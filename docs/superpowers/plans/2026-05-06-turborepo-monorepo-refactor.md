# Turborepo Monorepo Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the shuip codebase into a turborepo monorepo with `apps/docs` (Next.js + fumadocs), `packages/ui` (shadcn primitives), `packages/registry` (shipped components, examples, docs colocated), and `packages/config` (shared TS configs). Eliminate duplication, reduce import friction, preserve the public shadcn-CLI contract.

**Architecture:** Single-source-of-truth `generate.ts` script in `packages/registry` derives `registry.json`, `__index__.ts`, and re-export stubs from filesystem scan of `packages/registry/items/<category>/<name>/{component,*.example,index.mdx}`. fumadocs scans both `apps/docs/content/docs` and `../../packages/registry/items` via its `dir: string[]` option. TypeScript path mappings in `apps/docs/tsconfig.json` route `@/components/ui/shuip/*` → `packages/registry/stubs/*`, `@/components/ui/*` → `packages/ui/src/components/ui/*`. Bun workspace catalogs centralize dep versions.

**Tech Stack:** Bun workspaces, Turborepo, Next.js 16, fumadocs (mdx + ui + core), shadcn registry, Biome, TypeScript 6.

**Spec:** `docs/superpowers/specs/2026-05-06-turborepo-monorepo-refactor-design.md`

**Branch:** `refactor/turborepo` (already created)

**No test runner** is configured in this project. Verification is performed by:
- `bun install` exits 0
- `bun dev` starts Next.js without errors and the relevant page renders
- `bun build` completes
- Generated `registry.json` diff matches the pre-migration snapshot for migrated items
- `npx shadcn@latest add` against a throwaway Next.js project succeeds

A snapshot of the **pre-migration** `registry.json` is captured in T0.0 and used as the regression oracle during item migration (Phase 2).

---

## Phase 0 — Skeleton + pilot

### Task 0.0: Snapshot the pre-migration state

**Files:**
- Create: `docs/superpowers/plans/snapshots/registry.pre.json` (snapshot of current `registry.json`)
- Create: `docs/superpowers/plans/snapshots/public-r-index.txt` (list of current `public/r/*.json` filenames)

- [ ] **Step 1: Capture current `registry.json` and `public/r/` listing**

```bash
mkdir -p docs/superpowers/plans/snapshots
cp registry.json docs/superpowers/plans/snapshots/registry.pre.json
ls public/r/ > docs/superpowers/plans/snapshots/public-r-index.txt
```

- [ ] **Step 2: Verify snapshot present**

```bash
test -s docs/superpowers/plans/snapshots/registry.pre.json && echo OK
test -s docs/superpowers/plans/snapshots/public-r-index.txt && echo OK
```
Expected: `OK` printed twice.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/snapshots/
git commit -m "chore: snapshot pre-migration registry state"
```

---

### Task 0.1: Root `package.json` with workspaces and bun catalogs

**Files:**
- Modify: `package.json` (rewrite — top-level workspaces + scripts; deps move to packages)

- [ ] **Step 1: Replace root `package.json`**

```json
{
  "name": "shuip",
  "version": "1.2.0",
  "author": "plvo <plvdev@proton.me>",
  "license": "MIT",
  "description": "Ship fast with sh(ui)p, a collection of components and blocks for your Next.js project, built with shadcn/ui",
  "homepage": "https://github.com/plvo/shuip",
  "bugs": { "url": "https://github.com/plvo/shuip/issues" },
  "repository": { "type": "git", "url": "git+https://github.com/plvo/shuip" },
  "type": "module",
  "private": true,
  "packageManager": "bun@1.2.10",
  "workspaces": {
    "packages": ["apps/*", "packages/*"],
    "catalog": {
      "react": "^19.2.5",
      "react-dom": "^19.2.5",
      "@types/react": "^19.2.14",
      "@types/react-dom": "^19.2.3",
      "next": "16.2.4",
      "typescript": "^6.0.3",
      "tailwindcss": "^4.2.4",
      "@tailwindcss/postcss": "^4.2.4",
      "tailwind-merge": "^3.5.0",
      "tailwindcss-animate": "^1.0.7",
      "tw-animate-css": "^1.4.0",
      "clsx": "^2.1.1",
      "class-variance-authority": "^0.7.1",
      "lucide-react": "^1.14.0",
      "zod": "^4.4.3",
      "cmdk": "^1.1.1",
      "sonner": "^2.0.7",
      "vaul": "^1.1.2",
      "next-themes": "^0.4.6"
    },
    "catalogs": {
      "fumadocs": {
        "fumadocs-core": "^16.8.7",
        "fumadocs-mdx": "14.3.2",
        "fumadocs-ui": "^16.8.7",
        "next-mdx-remote": "^6.0.0",
        "@types/mdx": "^2.0.13",
        "gray-matter": "^4.0.3",
        "prism-react-renderer": "^2.4.1"
      },
      "radix": {
        "@radix-ui/react-dialog": "^1.1.15",
        "@radix-ui/react-popover": "^1.1.15",
        "@radix-ui/react-select": "^2.2.6",
        "@radix-ui/react-checkbox": "^1.3.3",
        "@radix-ui/react-radio-group": "^1.3.8",
        "@radix-ui/react-tooltip": "^1.2.8",
        "@radix-ui/react-tabs": "^1.1.13",
        "@radix-ui/react-collapsible": "^1.1.12",
        "@radix-ui/react-hover-card": "^1.1.15",
        "@radix-ui/react-label": "^2.1.8",
        "@radix-ui/react-separator": "^1.1.8",
        "@radix-ui/react-slot": "^1.2.4",
        "@radix-ui/react-icons": "^1.3.2"
      },
      "forms": {
        "react-hook-form": "^7.75.0",
        "@hookform/resolvers": "^5.2.2",
        "@tanstack/react-form": "^1.29.1",
        "@tanstack/react-query": "^5.100.9",
        "react-error-boundary": "^6.1.1"
      }
    }
  },
  "scripts": {
    "dev": "turbo run dev",
    "dev:docs": "turbo run dev --filter=@repo/docs",
    "build": "turbo run build",
    "build:docs": "turbo run build --filter=@repo/docs",
    "registry:generate": "turbo run registry:generate --filter=@repo/registry",
    "registry:build": "turbo run registry:build --filter=@repo/docs",
    "lint": "biome lint",
    "format": "biome format --write .",
    "check": "biome check --write",
    "check:unused": "knip",
    "clean": "rimraf \"**/.turbo\" \"**/node_modules\" \"**/.next\" \"**/.source\" \"**/bun.lock\"",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}": [
      "biome check --write --unsafe --no-errors-on-unmatched"
    ]
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.14",
    "@types/node": "^25.6.0",
    "husky": "^9.1.7",
    "knip": "^6.11.0",
    "lint-staged": "^17.0.0",
    "rimraf": "^6.1.3",
    "turbo": "^2.7.2",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: Verify the file is valid JSON**

```bash
bun -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('package.json', 'utf-8'))))"
```
Expected: prints array including `workspaces`, `scripts`, `devDependencies`.

- [ ] **Step 3: Commit (do NOT run install yet — workspaces don't exist)**

```bash
git add package.json
git commit -m "chore(monorepo): rewrite root package.json with workspaces and bun catalogs"
```

---

### Task 0.2: Root `turbo.json`, `bunfig.toml`, `biome.json`

**Files:**
- Create: `turbo.json`
- Modify: `bunfig.toml` (create or replace — currently absent)
- Modify: `biome.json` (update ignores for monorepo)

- [ ] **Step 1: Write `turbo.json`**

```jsonc
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "stream",
  "tasks": {
    "registry:generate": {
      "inputs": ["items/**", "scripts/generate.ts"],
      "outputs": ["registry.json", "__index__.ts", "stubs/**"]
    },
    "registry:build": {
      "dependsOn": ["@repo/registry#registry:generate"],
      "inputs": ["../../packages/registry/registry.json", "../../packages/registry/items/**"],
      "outputs": ["public/r/**"]
    },
    "build": {
      "dependsOn": ["^build", "registry:generate", "registry:build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "dependsOn": ["registry:generate"],
      "inputs": ["$TURBO_DEFAULT$", ".env"],
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 2: Write `bunfig.toml`**

```toml
[install]
linker = "hoisted"
```

- [ ] **Step 3: Replace root `biome.json`**

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.11/schema.json",
  "root": true,
  "vcs": {
    "enabled": false,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "files": {
    "ignoreUnknown": true,
    "includes": [
      "**",
      "!**/node_modules/**/*",
      "!**/.next/**/*",
      "!**/.turbo/**/*",
      "!**/.source/**/*",
      "!**/dist/**/*",
      "!**/out/**/*",
      "!**/generated/**/*",
      "!**/.husky/**/*",
      "!**/*.css",
      "!packages/registry/__index__.ts",
      "!packages/registry/registry.json",
      "!packages/registry/stubs/**",
      "!packages/ui/src/components/ui/**/*",
      "!packages/ui/src/styles/**/*",
      "!apps/docs/public/r/**"
    ]
  },
  "assist": { "actions": { "source": { "organizeImports": "on" } } },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "lineEnding": "lf",
    "indentWidth": 2,
    "lineWidth": 120
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "bracketSameLine": false,
      "bracketSpacing": true,
      "jsxQuoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  },
  "json": { "formatter": { "trailingCommas": "none" } },
  "linter": {
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "off",
        "noArrayIndexKey": "off",
        "noConsole": { "level": "off", "options": { "allow": ["log"] } }
      },
      "a11y": {
        "useKeyWithClickEvents": "off",
        "noStaticElementInteractions": "off"
      },
      "correctness": {
        "noChildrenProp": "off",
        "noUnusedVariables": { "level": "info", "fix": "unsafe" }
      },
      "complexity": { "noForEach": "off" },
      "style": {}
    }
  }
}
```

- [ ] **Step 4: Verify each is valid**

```bash
bun -e "JSON.parse(require('fs').readFileSync('turbo.json','utf-8')); JSON.parse(require('fs').readFileSync('biome.json','utf-8')); console.log('OK')"
test -f bunfig.toml && echo OK
```
Expected: `OK` printed (twice or more).

- [ ] **Step 5: Commit**

```bash
git add turbo.json bunfig.toml biome.json
git commit -m "chore(monorepo): add turbo.json, bunfig.toml, monorepo biome ignores"
```

---

### Task 0.3: `packages/config` — shared TS configs

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/ts/base.json`
- Create: `packages/config/ts/nextjs.json`
- Create: `packages/config/ts/react-library.json`
- Create: `packages/config/ts/with-shadcn-paths.json`

- [ ] **Step 1: Create `packages/config/package.json`**

```json
{
  "name": "@repo/config",
  "version": "0.0.0",
  "private": true,
  "files": ["ts"]
}
```

- [ ] **Step 2: Create `packages/config/ts/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Base",
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "incremental": false,
    "isolatedModules": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 3: Create `packages/config/ts/nextjs.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "jsx": "preserve",
    "target": "ES2022",
    "esModuleInterop": true,
    "incremental": true,
    "isolatedModules": true,
    "plugins": [{ "name": "next" }]
  }
}
```

- [ ] **Step 4: Create `packages/config/ts/react-library.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React Library",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

- [ ] **Step 5: Create `packages/config/ts/with-shadcn-paths.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Shadcn paths",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/ui/*": ["../ui/src/components/ui/*"],
      "@/lib/utils": ["../ui/src/lib/utils"]
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/config/
git commit -m "feat(config): add @repo/config package with shared TS configs"
```

---

### Task 0.4: `packages/ui` — empty primitives package

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/components.json`
- Create: `packages/ui/.gitignore`
- Create: `packages/ui/src/lib/utils.ts` (placeholder, primitives moved in Phase 1)
- Create: `packages/ui/src/components/ui/.gitkeep`
- Create: `packages/ui/src/styles/.gitkeep`

- [ ] **Step 1: Create `packages/ui/package.json`**

```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./components/ui/*": "./src/components/ui/*",
    "./lib/utils": "./src/lib/utils.ts",
    "./styles/globals.css": "./src/styles/globals.css"
  },
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:",
    "tailwind-merge": "catalog:",
    "clsx": "catalog:",
    "class-variance-authority": "catalog:",
    "lucide-react": "catalog:",
    "tailwindcss-animate": "catalog:",
    "cmdk": "catalog:",
    "sonner": "catalog:",
    "vaul": "catalog:",
    "next-themes": "catalog:",
    "@radix-ui/react-dialog": "catalog:radix",
    "@radix-ui/react-popover": "catalog:radix",
    "@radix-ui/react-select": "catalog:radix",
    "@radix-ui/react-checkbox": "catalog:radix",
    "@radix-ui/react-radio-group": "catalog:radix",
    "@radix-ui/react-tooltip": "catalog:radix",
    "@radix-ui/react-tabs": "catalog:radix",
    "@radix-ui/react-collapsible": "catalog:radix",
    "@radix-ui/react-hover-card": "catalog:radix",
    "@radix-ui/react-label": "catalog:radix",
    "@radix-ui/react-separator": "catalog:radix",
    "@radix-ui/react-slot": "catalog:radix",
    "@radix-ui/react-icons": "catalog:radix"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: Create `packages/ui/tsconfig.json`**

```json
{
  "extends": "@repo/config/ts/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `packages/ui/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@repo/ui/components",
    "utils": "@repo/ui/lib/utils",
    "ui": "@repo/ui/components/ui",
    "lib": "@repo/ui/lib",
    "hooks": "@repo/ui/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 4: Create `packages/ui/src/lib/utils.ts`** (placeholder; primitives moved Phase 1)

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function firstCharUppercase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function filenameToTitle(filename: string) {
  return filename
    .split('-')
    .map((w) => firstCharUppercase(w))
    .join(' ');
}

export function titleToFilename(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function processSlug(slug: string[] | string): [string, string] {
  if (typeof slug === 'string') {
    slug = slug.split('/');
  }
  return [slug[0], slug[1] ?? 'index'];
}
```

- [ ] **Step 5: Create stub directories and gitignore**

```bash
mkdir -p packages/ui/src/components/ui packages/ui/src/styles
touch packages/ui/src/components/ui/.gitkeep packages/ui/src/styles/.gitkeep
cat > packages/ui/.gitignore << 'EOF'
node_modules
.turbo
EOF
```

- [ ] **Step 6: Commit**

```bash
git add packages/ui/
git commit -m "feat(ui): scaffold @repo/ui package (cn helper present, primitives empty)"
```

---

### Task 0.5: `packages/registry` — empty registry package + generator

**Files:**
- Create: `packages/registry/package.json`
- Create: `packages/registry/tsconfig.json`
- Create: `packages/registry/.gitignore`
- Create: `packages/registry/scripts/generate.ts`
- Create: `packages/registry/items/.gitkeep`

- [ ] **Step 1: Create `packages/registry/package.json`**

```json
{
  "name": "@repo/registry",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./__index__": "./__index__.ts",
    "./items/*": "./items/*",
    "./stubs/*": "./stubs/*"
  },
  "scripts": {
    "registry:generate": "bun run scripts/generate.ts"
  },
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:",
    "react-hook-form": "catalog:forms",
    "@hookform/resolvers": "catalog:forms",
    "@tanstack/react-form": "catalog:forms",
    "@tanstack/react-query": "catalog:forms",
    "react-error-boundary": "catalog:forms",
    "zod": "catalog:",
    "lucide-react": "catalog:",
    "class-variance-authority": "catalog:",
    "@radix-ui/react-icons": "catalog:radix",
    "@repo/ui": "workspace:*"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "gray-matter": "catalog:fumadocs",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: Create `packages/registry/tsconfig.json`**

```json
{
  "extends": "@repo/config/ts/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/ui/*": ["../ui/src/components/ui/*"],
      "@/lib/utils": ["../ui/src/lib/utils"]
    }
  },
  "include": ["items/**/*.ts", "items/**/*.tsx", "scripts/**/*.ts", "__index__.ts"],
  "exclude": ["node_modules", "stubs"]
}
```

- [ ] **Step 3: Create `packages/registry/.gitignore`**

```
node_modules
.turbo
__index__.ts
registry.json
stubs/
```

- [ ] **Step 4: Create `packages/registry/scripts/generate.ts`**

```ts
#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');
const ITEMS_DIR = path.join(ROOT, 'items');
const STUBS_DIR = path.join(ROOT, 'stubs');

type Category = 'components' | 'react-hook-form' | 'tanstack-form' | 'blocks';

interface RegistryFile {
  path: string;
  type: 'registry:ui' | 'registry:block' | 'registry:file';
  target?: string;
}

interface RegistryItem {
  name: string;
  type: 'registry:ui' | 'registry:block';
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
}

interface ItemMeta {
  dependsOn?: string[];
}

const categoryToType = (cat: Category): 'registry:ui' | 'registry:block' =>
  cat === 'blocks' ? 'registry:block' : 'registry:ui';

const namePrefix = (cat: Category, name: string): string => {
  if (cat === 'react-hook-form') return `rhf-${name}`;
  if (cat === 'tanstack-form') return `tsf-${name}`;
  return name;
};

const computeTarget = (cat: Category, name: string): string => {
  if (cat === 'react-hook-form') return `./components/ui/shuip/react-hook-form/${name}.tsx`;
  if (cat === 'tanstack-form') return `./components/ui/shuip/tanstack-form/${name}.tsx`;
  if (cat === 'blocks') return `./components/block/shuip/${name}.tsx`;
  return `./components/ui/shuip/${name}.tsx`;
};

const computeStubPath = (cat: Category, name: string): string => {
  if (cat === 'react-hook-form') return path.join(STUBS_DIR, 'react-hook-form', `${name}.tsx`);
  if (cat === 'tanstack-form') return path.join(STUBS_DIR, 'tanstack-form', `${name}.tsx`);
  if (cat === 'blocks') return path.join(STUBS_DIR, 'blocks', `${name}.tsx`);
  return path.join(STUBS_DIR, `${name}.tsx`);
};

const stubExportPath = (cat: Category, name: string): string => {
  return `../items/${cat}/${name}/component`;
};

// Parse TS imports from a source file. Returns named npm packages (and their submodules)
// excluding @/* and @repo/* and relative imports.
const parseImports = (source: string): string[] => {
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(source)) !== null) {
    const spec = m[1];
    if (!spec) continue;
    if (spec.startsWith('.') || spec.startsWith('@/') || spec.startsWith('@repo/') || spec.startsWith('#/')) continue;
    const parts = spec.split('/');
    if (spec.startsWith('@')) {
      out.add(parts.slice(0, 2).join('/'));
    } else {
      out.add(parts[0]);
    }
  }
  return Array.from(out).sort();
};

// Parse @/components/ui/<name> imports → registryDependencies (shadcn primitives).
const parseRegistryDeps = (source: string): string[] => {
  const regex = /from\s+['"]@\/components\/ui\/([^'"\/]+)['"]/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(source)) !== null) {
    if (m[1] && m[1] !== 'shuip') out.add(m[1]);
  }
  return Array.from(out).sort();
};

const readMeta = (itemDir: string): ItemMeta => {
  const metaPath = path.join(itemDir, 'meta.shuip.json');
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }
  return {};
};

interface ScannedItem {
  category: Category;
  folderName: string;
  itemDir: string;
  componentPath: string;
  examples: { filename: string; absPath: string }[];
  extras: { filename: string; absPath: string }[];
  hasMdx: boolean;
}

const scanItems = (): ScannedItem[] => {
  const out: ScannedItem[] = [];
  if (!fs.existsSync(ITEMS_DIR)) return out;
  const categories = fs.readdirSync(ITEMS_DIR).filter((d) => {
    const p = path.join(ITEMS_DIR, d);
    return fs.statSync(p).isDirectory();
  }) as Category[];

  for (const category of categories) {
    const catDir = path.join(ITEMS_DIR, category);
    const entries = fs.readdirSync(catDir).filter((d) => {
      const p = path.join(catDir, d);
      return fs.statSync(p).isDirectory();
    });

    for (const folderName of entries) {
      const itemDir = path.join(catDir, folderName);
      const componentPath = path.join(itemDir, 'component.tsx');
      if (!fs.existsSync(componentPath)) {
        console.warn(`[generate] skipping ${category}/${folderName}: no component.tsx`);
        continue;
      }
      const examples = fs
        .readdirSync(itemDir)
        .filter((f) => f.endsWith('.example.tsx'))
        .map((filename) => ({ filename, absPath: path.join(itemDir, filename) }));
      const extrasDir = path.join(itemDir, 'extras');
      const extras = fs.existsSync(extrasDir)
        ? fs.readdirSync(extrasDir).map((filename) => ({ filename, absPath: path.join(extrasDir, filename) }))
        : [];
      const hasMdx = fs.existsSync(path.join(itemDir, 'index.mdx'));
      out.push({ category, folderName, itemDir, componentPath, examples, extras, hasMdx });
    }
  }
  return out;
};

const buildRegistryJson = (items: ScannedItem[]): { name: string; homepage: string; items: RegistryItem[] } => {
  const out: RegistryItem[] = [];
  for (const item of items) {
    const { category, folderName, componentPath, extras } = item;
    const source = fs.readFileSync(componentPath, 'utf-8');
    const dependencies = parseImports(source);
    const registryDependencies = parseRegistryDeps(source);
    const meta = readMeta(item.itemDir);
    const fullDeps = [...registryDependencies, ...(meta.dependsOn ?? [])].sort();
    const itemName = namePrefix(category, folderName);
    const target = computeTarget(category, folderName);
    const componentRelPath = path.relative(ROOT, componentPath).replace(/\\/g, '/');
    const files: RegistryFile[] = [
      {
        path: `./${componentRelPath}`,
        type: categoryToType(category),
        target,
      },
    ];
    for (const extra of extras) {
      const extraRel = path.relative(ROOT, extra.absPath).replace(/\\/g, '/');
      let extraTarget: string;
      if (extra.filename.endsWith('.action.ts')) {
        const base = extra.filename.replace(/\.action\.ts$/, '');
        extraTarget = `./actions/shuip/${base}.ts`;
      } else {
        extraTarget = `./components/ui/shuip/${extra.filename}`;
      }
      files.push({ path: `./${extraRel}`, type: 'registry:file', target: extraTarget });
    }
    const entry: RegistryItem = {
      name: itemName,
      type: categoryToType(category),
      files,
    };
    if (dependencies.length) entry.dependencies = dependencies;
    if (fullDeps.length) entry.registryDependencies = fullDeps;
    out.push(entry);
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return { name: 'shuip', homepage: 'https://shuip.plvo.dev', items: out };
};

const buildIndexTs = (items: ScannedItem[]): string => {
  let body = `// @ts-nocheck

/**
 * AUTO-GENERATED by packages/registry/scripts/generate.ts. Do not edit.
 */

import * as React from 'react';

interface RegistryComponent {
  path: string;
  code: string;
  component: any;
}

export const REGISTRY_INDEX: Record<string, RegistryComponent> = {`;

  for (const item of items) {
    const { category, folderName, componentPath, examples } = item;
    const itemName = namePrefix(category, folderName);
    const importPath = `@repo/registry/items/${category}/${folderName}/component`;
    const code = fs.readFileSync(componentPath, 'utf-8');
    body += `
  '${itemName}': {
    path: '${importPath}',
    code: ${JSON.stringify(code)},
    component: React.lazy(() => import('${importPath}')),
  },`;
    for (const ex of examples) {
      const variant = ex.filename.replace(/\.example\.tsx$/, '');
      const exImport = `@repo/registry/items/${category}/${folderName}/${variant}.example`;
      const exCode = fs.readFileSync(ex.absPath, 'utf-8');
      const exKey = variant === 'default' ? `${itemName}.example` : `${itemName}.${variant}.example`;
      body += `
  '${exKey}': {
    path: '${exImport}',
    code: ${JSON.stringify(exCode)},
    component: React.lazy(() => import('${exImport}')),
  },`;
    }
  }

  body += `
};
`;
  return body;
};

const writeStubs = (items: ScannedItem[]): void => {
  fs.rmSync(STUBS_DIR, { recursive: true, force: true });
  for (const item of items) {
    const stubPath = computeStubPath(item.category, item.folderName);
    fs.mkdirSync(path.dirname(stubPath), { recursive: true });
    const exportPath = stubExportPath(item.category, item.folderName);
    const content = `// AUTO-GENERATED by packages/registry/scripts/generate.ts — DO NOT EDIT
export * from '${exportPath}';
`;
    fs.writeFileSync(stubPath, content);
  }
};

const main = () => {
  const items = scanItems();
  const registry = buildRegistryJson(items);
  fs.writeFileSync(path.join(ROOT, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, '__index__.ts'), buildIndexTs(items));
  writeStubs(items);
  console.log(`[generate] ${items.length} items processed`);
};

main();
```

- [ ] **Step 5: Create stub items folder and verify the generator runs (with empty items)**

```bash
mkdir -p packages/registry/items
touch packages/registry/items/.gitkeep
```

- [ ] **Step 6: Commit**

```bash
git add packages/registry/
git commit -m "feat(registry): scaffold @repo/registry package with generate.ts"
```

---

### Task 0.6: `apps/docs` — empty Next.js + fumadocs scaffold

**Files:**
- Create: `apps/docs/package.json`
- Create: `apps/docs/tsconfig.json`
- Create: `apps/docs/.gitignore`
- Create: `apps/docs/next.config.ts`
- Create: `apps/docs/source.config.ts`
- Create: `apps/docs/postcss.config.mjs`
- Create: `apps/docs/scripts/shadcn-build.ts`

The actual Next.js app code (src/, content/, public/) will be moved from the root in Task 0.7.

- [ ] **Step 1: Create `apps/docs/package.json`**

```json
{
  "name": "@repo/docs",
  "version": "1.2.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "registry:build": "bun run scripts/shadcn-build.ts && biome format --write public/r",
    "postinstall": "fumadocs-mdx"
  },
  "dependencies": {
    "@repo/registry": "workspace:*",
    "@repo/ui": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:",
    "next": "catalog:",
    "fumadocs-core": "catalog:fumadocs",
    "fumadocs-mdx": "catalog:fumadocs",
    "fumadocs-ui": "catalog:fumadocs",
    "next-mdx-remote": "catalog:fumadocs",
    "next-themes": "catalog:",
    "gray-matter": "catalog:fumadocs",
    "prism-react-renderer": "catalog:fumadocs",
    "lucide-react": "catalog:",
    "tailwind-merge": "catalog:",
    "clsx": "catalog:",
    "zod": "catalog:",
    "shadcn": "^4.7.0",
    "@vercel/analytics": "^2.0.1"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/mdx": "catalog:fumadocs",
    "@types/node": "^25.6.0",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@biomejs/biome": "^2.4.14",
    "@tailwindcss/postcss": "catalog:",
    "tailwindcss": "catalog:",
    "tw-animate-css": "catalog:",
    "postcss": "^8.5.14",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: Create `apps/docs/tsconfig.json`**

```jsonc
{
  "extends": "@repo/config/ts/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/ui/shuip/*": ["../../packages/registry/stubs/*"],
      "@/components/ui/*": ["../../packages/ui/src/components/ui/*"],
      "@/lib/utils": ["../../packages/ui/src/lib/utils"],
      "fumadocs-mdx:collections/*": [".source/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `apps/docs/.gitignore`**

```
node_modules
.next
.turbo
.source
public/r
next-env.d.ts
```

- [ ] **Step 4: Create `apps/docs/next.config.ts`**

```ts
import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';

const withMDX = createMDX();

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    registry: ['../../packages/registry/items/**/*', '../../packages/registry/__index__.ts'],
  },

  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],

  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_APP_URL: process.env.PORTLESS_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://shuip.plvo.dev',
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*' }],
  },
};

export default withMDX(nextConfig);
```

- [ ] **Step 5: Create `apps/docs/source.config.ts`**

```ts
import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

const schema = frontmatterSchema.extend({
  registryName: z.string().optional(),
});

const defaultOptions = {
  docs: {
    schema,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
};

export const docs = defineDocs({
  dir: ['./content/docs', '../../packages/registry/items'],
  ...defaultOptions,
});

export const blocks = defineDocs({
  dir: './content/blocks',
  ...defaultOptions,
});

export default defineConfig({ mdxOptions: {} });
```

- [ ] **Step 6: Create `apps/docs/postcss.config.mjs`**

```js
const config = {
  plugins: ['@tailwindcss/postcss'],
};
export default config;
```

- [ ] **Step 7: Create `apps/docs/scripts/shadcn-build.ts`** (port of current `scripts/shadcn-build.ts`, adapted paths)

```ts
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';

const REGISTRY_PKG = path.resolve(import.meta.dir, '..', '..', '..', 'packages', 'registry');

const buildOptionsSchema = z.object({
  cwd: z.string(),
  registryFile: z.string(),
  outputDir: z.string(),
});

const registryItemTypeSchema = z.enum([
  'registry:lib',
  'registry:block',
  'registry:component',
  'registry:ui',
  'registry:hook',
  'registry:page',
  'registry:file',
  'registry:theme',
  'registry:style',
  'registry:item',
  'registry:base',
  'registry:font',
  'registry:example',
  'registry:internal',
]);

const registryItemFileSchema = z.discriminatedUnion('type', [
  z.object({
    path: z.string(),
    content: z.string().optional(),
    type: z.enum(['registry:file', 'registry:page']),
    target: z.string(),
  }),
  z.object({
    path: z.string(),
    content: z.string().optional(),
    type: registryItemTypeSchema.exclude(['registry:file', 'registry:page']),
    target: z.string().optional(),
  }),
]);

const registryItemCommonSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  type: registryItemTypeSchema,
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(registryItemFileSchema).optional(),
});

const registrySchema = z.object({
  name: z.string(),
  homepage: z.string(),
  items: z.array(registryItemCommonSchema),
});

const build = async () => {
  const options = buildOptionsSchema.parse({
    cwd: REGISTRY_PKG,
    registryFile: path.resolve(REGISTRY_PKG, 'registry.json'),
    outputDir: path.resolve(import.meta.dir, '..', 'public', 'r'),
  });

  await fs.mkdir(options.outputDir, { recursive: true });

  const content = await fs.readFile(options.registryFile, 'utf-8');
  const result = registrySchema.safeParse(JSON.parse(content));
  if (!result.success) {
    console.error(`Invalid registry file: ${options.registryFile}`);
    console.error(result.error.message);
    process.exit(1);
  }

  for (const registryItem of result.data.items) {
    const item: any = { ...registryItem, $schema: 'https://ui.shadcn.com/schema/registry-item.json' };
    for (const file of item.files ?? []) {
      file.content = await fs.readFile(path.resolve(options.cwd, file.path), 'utf-8');
    }
    await fs.writeFile(path.resolve(options.outputDir, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
  }
  await fs.copyFile(options.registryFile, path.resolve(options.outputDir, 'registry.json'));
  console.log(`[shadcn-build] ${result.data.items.length} items written to ${options.outputDir}`);
};

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 8: Commit**

```bash
git add apps/docs/
git commit -m "feat(docs): scaffold apps/docs (configs only, src/content moved next)"
```

---

### Task 0.7: Move existing Next.js app code into `apps/docs/`

**Files:**
- Move (git mv): root `src/` → `apps/docs/src/`
- Move: root `content/` → `apps/docs/content/`
- Move: root `public/` → `apps/docs/public/` (excluding `public/r`)
- Move: root `mdx-components.tsx` (currently `src/mdx-components.tsx`) — already covered by `src/` move

- [ ] **Step 1: Move directories**

```bash
git mv src apps/docs/src
git mv content apps/docs/content
git mv public apps/docs/public
```

- [ ] **Step 2: Remove `apps/docs/public/r` (regenerated by `registry:build`)**

```bash
git rm -rf apps/docs/public/r
```

- [ ] **Step 3: Update import in `apps/docs/src/components/item-content.tsx` and `item-preview.tsx`**

Change `from '#/registry/__index__'` → `from '@repo/registry/__index__'`.

```bash
sed -i "s|from '#/registry/__index__'|from '@repo/registry/__index__'|g" apps/docs/src/components/item-content.tsx apps/docs/src/components/item-preview.tsx
```

- [ ] **Step 4: Verify the imports changed**

```bash
grep -n "@repo/registry/__index__" apps/docs/src/components/item-content.tsx apps/docs/src/components/item-preview.tsx
grep -rn "#/registry" apps/docs/src/ || echo "no #/ refs remaining"
```
Expected: both files show the new import; second grep prints `no #/ refs remaining`.

- [ ] **Step 5: Delete the duplicate `cn.ts`**

```bash
git rm apps/docs/src/lib/cn.ts
```

- [ ] **Step 6: Verify nothing imports the deleted `cn.ts`**

```bash
grep -rn "from '@/lib/cn'" apps/docs/src/ packages/ || echo "no refs"
```
Expected: `no refs`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(docs): move src/, content/, public/ into apps/docs (drop duplicate cn.ts, retarget registry imports)"
```

---

### Task 0.8: Migrate pilot — `submit-button`

**Files:**
- Create: `packages/registry/items/components/submit-button/component.tsx`
- Create: `packages/registry/items/components/submit-button/index.mdx`
- Create: `packages/registry/items/components/submit-button/default.example.tsx`
- Create: `packages/registry/items/components/submit-button/loading.example.tsx`

- [ ] **Step 1: Move source via git mv to preserve history**

```bash
mkdir -p packages/registry/items/components/submit-button
git mv registry/ui/submit-button.tsx packages/registry/items/components/submit-button/component.tsx
```

- [ ] **Step 2: Move examples**

```bash
git mv examples/submit-button.tsx packages/registry/items/components/submit-button/default.example.tsx
git mv examples/submit-button.loading.tsx packages/registry/items/components/submit-button/loading.example.tsx
```

- [ ] **Step 3: Move doc**

```bash
git mv content/docs/components/submit-button.mdx packages/registry/items/components/submit-button/index.mdx
```

- [ ] **Step 4: Verify moved files**

```bash
ls packages/registry/items/components/submit-button/
```
Expected output includes `component.tsx`, `default.example.tsx`, `index.mdx`, `loading.example.tsx`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(registry): migrate submit-button as pilot item (component + 2 examples + doc)"
```

---

### Task 0.9: Install workspace deps and run generator

- [ ] **Step 1: Run `bun install` at the repo root**

```bash
bun install
```
Expected: no errors. Workspace symlinks created (`apps/docs/node_modules/@repo/registry`, etc.).

- [ ] **Step 2: Run the generator manually**

```bash
cd packages/registry && bun run scripts/generate.ts && cd ../..
```
Expected: `[generate] 1 items processed`. Files appear: `packages/registry/registry.json`, `packages/registry/__index__.ts`, `packages/registry/stubs/submit-button.tsx`.

- [ ] **Step 3: Inspect generated `registry.json`**

```bash
cat packages/registry/registry.json
```
Expected: contains one item named `submit-button` with type `registry:ui` and target `./components/ui/shuip/submit-button.tsx`.

- [ ] **Step 4: Run `registry:build`**

```bash
cd apps/docs && bun run registry:build && cd ../..
```
Expected: `[shadcn-build] 1 items written` and file `apps/docs/public/r/submit-button.json` exists.

- [ ] **Step 5: Inspect the generated `submit-button.json`**

```bash
cat apps/docs/public/r/submit-button.json | head -30
```
Expected: `name: "submit-button"`, `target: "./components/ui/shuip/submit-button.tsx"`, `content` field with the component source as string starting with `import { ReloadIcon }`.

- [ ] **Step 6: Verify against pre-migration snapshot**

```bash
bun -e "
const pre = JSON.parse(require('fs').readFileSync('docs/superpowers/plans/snapshots/registry.pre.json','utf-8'));
const post = JSON.parse(require('fs').readFileSync('packages/registry/registry.json','utf-8'));
const preItem = pre.items.find(i => i.name === 'submit-button');
const postItem = post.items.find(i => i.name === 'submit-button');
const ok = preItem.name === postItem.name && preItem.type === postItem.type && preItem.files[0].target === postItem.files[0].target;
console.log(ok ? 'OK: submit-button matches snapshot' : JSON.stringify({preItem, postItem}, null, 2));
"
```
Expected: `OK: submit-button matches snapshot`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(registry): regenerate registry.json/__index__/stubs for pilot"
```

---

### Task 0.10: Move shadcn primitives needed by `submit-button`

`submit-button` imports `@/components/ui/button`. We need to move `button.tsx` (and its dependencies) into `packages/ui/src/components/ui/`.

**Files:**
- Move: `apps/docs/src/components/ui/button.tsx` → `packages/ui/src/components/ui/button.tsx`

- [ ] **Step 1: Move `button.tsx`**

```bash
git mv apps/docs/src/components/ui/button.tsx packages/ui/src/components/ui/button.tsx
```

- [ ] **Step 2: Verify `button.tsx` import paths still work**

```bash
grep -n "from " packages/ui/src/components/ui/button.tsx
```
Expected: imports use `@/lib/utils` (resolves via `@repo/config/ts/with-shadcn-paths`) or relative paths only.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(ui): move button primitive into packages/ui (pilot dep)"
```

---

### Task 0.11: Run dev server and verify pilot end-to-end

- [ ] **Step 1: Start dev server**

```bash
cd apps/docs && bun run dev &
DEV_PID=$!
sleep 8
cd ../..
```

- [ ] **Step 2: Curl the docs page**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/docs/components/submit-button
```
Expected: `200`.

- [ ] **Step 3: Curl the registry JSON**

```bash
curl -s http://localhost:3000/r/submit-button.json | head -20
```
Expected: a JSON response with `name: "submit-button"` and `content` field present.

- [ ] **Step 4: Stop dev server**

```bash
kill $DEV_PID
wait $DEV_PID 2>/dev/null
```

- [ ] **Step 5: Smoke test `shadcn add` against a throwaway project**

```bash
cd /tmp && rm -rf shuip-smoke && bun create next-app shuip-smoke --typescript --no-eslint --tailwind --app --src-dir --no-import-alias --use-bun -y
cd shuip-smoke
# start a server again from apps/docs in a new terminal
```

(This step requires a separate terminal; document the manual smoke. If the previous curl checks pass and `bun build` succeeds in Task 0.12, the install path is exercised in Phase 4 acceptance.)

- [ ] **Step 6: Commit checkpoint**

```bash
cd /home/ttecim/.lab/shuip/.worktrees/main
git status
# nothing to commit if the dev server didn't write files; if it did (e.g., `.next/types`), they're gitignored.
```

---

### Task 0.12: Run `bun build` and verify

- [ ] **Step 1: Run the full pipeline**

```bash
bun run build
```
Expected: turbo runs `registry:generate` → `registry:build` → `apps/docs#build`. Exits 0.

- [ ] **Step 2: Verify build artifacts**

```bash
test -d apps/docs/.next && echo "next built"
test -f apps/docs/public/r/submit-button.json && echo "registry built"
```
Expected: both lines printed.

- [ ] **Step 3: Commit (no expected diff, but tag as checkpoint)**

```bash
git status
# If clean, no commit needed.
# If `bun.lock` updated, commit it:
git add bun.lock 2>/dev/null && git commit -m "chore: update bun.lock after pilot setup" || true
```

**PHASE 0 GATE**: pilot works in dev, build, and JSON output matches snapshot. Proceed to Phase 1 only if all checks above passed.

---

## Phase 1 — Move shadcn primitives into `packages/ui`

### Task 1.1: Move all shadcn primitives

**Files:**
- Move: `apps/docs/src/components/ui/*.tsx` (all remaining, NOT `shuip/`) → `packages/ui/src/components/ui/`

The current files in `apps/docs/src/components/ui/` (after Phase 0): `button.tsx` already moved. Remaining are: `card.tsx`, `checkbox.tsx`, `collapsible.tsx`, `command.tsx`, `dialog.tsx`, `drawer.tsx`, `field.tsx`, `form.tsx`, `hover-card.tsx`, `input-group.tsx`, `input.tsx`, `label.tsx`, `popover.tsx`, `radio-group.tsx`, `select.tsx`, `separator.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`. Plus the `shuip/` subdir stays for now (deleted in Phase 4 after items migrate).

- [ ] **Step 1: Move each primitive**

```bash
for f in card checkbox collapsible command dialog drawer field form hover-card input-group input label popover radio-group select separator tabs textarea tooltip; do
  if [ -f "apps/docs/src/components/ui/${f}.tsx" ]; then
    git mv "apps/docs/src/components/ui/${f}.tsx" "packages/ui/src/components/ui/${f}.tsx"
  fi
done
```

- [ ] **Step 2: Verify no primitive remains in `apps/docs`**

```bash
ls apps/docs/src/components/ui/
```
Expected: only `shuip/` directory (and possibly nothing else).

- [ ] **Step 3: Move `globals.css`**

```bash
git mv apps/docs/src/styles/globals.css packages/ui/src/styles/globals.css
git rm -rf apps/docs/src/styles 2>/dev/null || true
```

- [ ] **Step 4: Update CSS import in `apps/docs/src/app/layout.tsx`**

Find the existing CSS import line (likely `import '../styles/globals.css'` or `import '@/styles/globals.css'`).

```bash
grep -n "globals.css\|/styles/" apps/docs/src/app/layout.tsx
```

Replace with:
```ts
import '@repo/ui/styles/globals.css';
```

```bash
sed -i "s|import .*globals.css.*|import '@repo/ui/styles/globals.css';|" apps/docs/src/app/layout.tsx
```

- [ ] **Step 5: Verify the import**

```bash
grep -n "@repo/ui/styles/globals.css" apps/docs/src/app/layout.tsx
```
Expected: one match.

- [ ] **Step 6: Move `apps/docs/src/lib/utils.ts` content into `packages/ui/src/lib/utils.ts`** (already created in T0.4 with same content). Delete the apps/docs copy.

```bash
git rm apps/docs/src/lib/utils.ts
```

- [ ] **Step 7: Verify nothing in `apps/docs/src/` imports from a moved primitive without going through `@/components/ui/*`**

```bash
grep -rn "from '@/components/ui/" apps/docs/src/ | grep -v "shuip" | head -20
```
Expected: imports remain as `@/components/ui/<name>` — they now resolve via tsconfig path mapping to `packages/ui`.

- [ ] **Step 8: Run `bun install` to refresh symlinks**

```bash
bun install
```

- [ ] **Step 9: Run `bun run build` to verify everything still compiles**

```bash
bun run build
```
Expected: exits 0.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(ui): move all shadcn primitives + globals.css into @repo/ui"
```

---

## Phase 2 — Migrate items in batches

### Task 2.1: Batch — `components/` (5 items)

For each of: `copy-button`, `theme-button`, `confirmation-dialog`, `hover-reveal`, `side-dialog`.

**Files (per item, e.g. `copy-button`):**
- Move: `registry/ui/copy-button.tsx` → `packages/registry/items/components/copy-button/component.tsx`
- Move: `examples/copy-button.tsx` → `packages/registry/items/components/copy-button/default.example.tsx`
- Move: `examples/copy-button.with-custom-icons.tsx` → `packages/registry/items/components/copy-button/with-custom-icons.example.tsx`
- Move: `content/docs/components/copy-button.mdx` → `packages/registry/items/components/copy-button/index.mdx`

- [ ] **Step 1: Migrate `copy-button`**

```bash
mkdir -p packages/registry/items/components/copy-button
git mv registry/ui/copy-button.tsx packages/registry/items/components/copy-button/component.tsx
git mv examples/copy-button.tsx packages/registry/items/components/copy-button/default.example.tsx
git mv examples/copy-button.with-custom-icons.tsx packages/registry/items/components/copy-button/with-custom-icons.example.tsx
git mv content/docs/components/copy-button.mdx packages/registry/items/components/copy-button/index.mdx
```

- [ ] **Step 2: Migrate `theme-button`**

```bash
mkdir -p packages/registry/items/components/theme-button
git mv registry/ui/theme-button.tsx packages/registry/items/components/theme-button/component.tsx
git mv examples/theme-button.tsx packages/registry/items/components/theme-button/default.example.tsx
git mv examples/theme-button.text.tsx packages/registry/items/components/theme-button/text.example.tsx
git mv content/docs/components/theme-button.mdx packages/registry/items/components/theme-button/index.mdx
```

- [ ] **Step 3: Migrate `confirmation-dialog`**

```bash
mkdir -p packages/registry/items/components/confirmation-dialog
git mv registry/ui/confirmation-dialog.tsx packages/registry/items/components/confirmation-dialog/component.tsx
git mv examples/confirmation-dialog.tsx packages/registry/items/components/confirmation-dialog/default.example.tsx
git mv content/docs/components/confirmation-dialog.mdx packages/registry/items/components/confirmation-dialog/index.mdx
```

- [ ] **Step 4: Migrate `hover-reveal`**

```bash
mkdir -p packages/registry/items/components/hover-reveal
git mv registry/ui/hover-reveal.tsx packages/registry/items/components/hover-reveal/component.tsx
git mv examples/hover-reveal.tsx packages/registry/items/components/hover-reveal/default.example.tsx
git mv content/docs/components/hover-reveal.mdx packages/registry/items/components/hover-reveal/index.mdx
```

- [ ] **Step 5: Migrate `side-dialog`**

```bash
mkdir -p packages/registry/items/components/side-dialog
git mv registry/ui/side-dialog.tsx packages/registry/items/components/side-dialog/component.tsx
git mv examples/side-dialog.tsx packages/registry/items/components/side-dialog/default.example.tsx
git mv examples/side-dialog.form.tsx packages/registry/items/components/side-dialog/form.example.tsx
git mv content/docs/components/side-dialog.mdx packages/registry/items/components/side-dialog/index.mdx
```

- [ ] **Step 6: Regenerate registry**

```bash
cd packages/registry && bun run scripts/generate.ts && cd ../..
```
Expected: `[generate] 6 items processed` (5 new + submit-button).

- [ ] **Step 7: Diff against snapshot**

```bash
bun -e "
const pre = JSON.parse(require('fs').readFileSync('docs/superpowers/plans/snapshots/registry.pre.json','utf-8'));
const post = JSON.parse(require('fs').readFileSync('packages/registry/registry.json','utf-8'));
const targets = ['copy-button','theme-button','confirmation-dialog','hover-reveal','side-dialog','submit-button'];
for (const name of targets) {
  const a = pre.items.find(i => i.name === name);
  const b = post.items.find(i => i.name === name);
  const ok = a && b && a.type === b.type && a.files[0].target === b.files[0].target;
  console.log(ok ? '✓ '+name : '✗ '+name+': '+JSON.stringify({a, b}, null, 2));
}
"
```
Expected: 6 lines, all starting with `✓`.

- [ ] **Step 8: Run dev server and verify previews**

```bash
cd apps/docs && bun run dev &
DEV_PID=$!
sleep 8
for slug in components/copy-button components/theme-button components/confirmation-dialog components/hover-reveal components/side-dialog components/submit-button; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/docs/$slug")
  echo "$code $slug"
done
kill $DEV_PID
wait $DEV_PID 2>/dev/null
cd ../..
```
Expected: all `200`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(registry): migrate components batch (copy-button, theme-button, confirmation-dialog, hover-reveal, side-dialog)"
```

---

### Task 2.2: Batch — `react-hook-form/` (8 items)

Items (folder name on the LEFT, current registry/examples filenames on the RIGHT):
- `input-field` ↔ `rhf-input-field`
- `password-field` ↔ `rhf-password-field`
- `checkbox-field` ↔ `rhf-checkbox-field`
- `radio-field` ↔ `rhf-radio-field`
- `select-field` ↔ `rhf-select-field`
- `textarea-field` ↔ `rhf-textarea-field`
- `query-boundary` ↔ `rhf-query-boundary`
- `address-field` ↔ `rhf-address-field` (has `extras/places.action.ts`)

For each item, the example files in `examples/rhf-<name>*.tsx` are renamed to `<variant>.example.tsx`.

- [ ] **Step 1: Migrate `input-field`**

```bash
mkdir -p packages/registry/items/react-hook-form/input-field
git mv registry/ui/rhf-input-field.tsx packages/registry/items/react-hook-form/input-field/component.tsx
git mv examples/rhf-input-field.tsx packages/registry/items/react-hook-form/input-field/default.example.tsx
git mv examples/rhf-input-field.tooltip.tsx packages/registry/items/react-hook-form/input-field/tooltip.example.tsx
git mv examples/rhf-input-field.email.tsx packages/registry/items/react-hook-form/input-field/email.example.tsx
git mv examples/rhf-input-field.validation.tsx packages/registry/items/react-hook-form/input-field/validation.example.tsx
git mv content/docs/react-hook-form/input-field.mdx packages/registry/items/react-hook-form/input-field/index.mdx
```

- [ ] **Step 2: Migrate `password-field`**

```bash
mkdir -p packages/registry/items/react-hook-form/password-field
git mv registry/ui/rhf-password-field.tsx packages/registry/items/react-hook-form/password-field/component.tsx
git mv examples/rhf-password-field.tsx packages/registry/items/react-hook-form/password-field/default.example.tsx
git mv examples/rhf-password-field.tooltip.tsx packages/registry/items/react-hook-form/password-field/tooltip.example.tsx
git mv examples/rhf-password-field.confirm-password.tsx packages/registry/items/react-hook-form/password-field/confirm-password.example.tsx
git mv examples/rhf-password-field.login.tsx packages/registry/items/react-hook-form/password-field/login.example.tsx
git mv examples/rhf-password-field.strength-meter.tsx packages/registry/items/react-hook-form/password-field/strength-meter.example.tsx
git mv content/docs/react-hook-form/password-field.mdx packages/registry/items/react-hook-form/password-field/index.mdx
```

- [ ] **Step 3: Migrate `checkbox-field`**

```bash
mkdir -p packages/registry/items/react-hook-form/checkbox-field
git mv registry/ui/rhf-checkbox-field.tsx packages/registry/items/react-hook-form/checkbox-field/component.tsx
git mv examples/rhf-checkbox-field.tsx packages/registry/items/react-hook-form/checkbox-field/default.example.tsx
git mv examples/rhf-checkbox-field.box-label.tsx packages/registry/items/react-hook-form/checkbox-field/box-label.example.tsx
git mv examples/rhf-checkbox-field.group.tsx packages/registry/items/react-hook-form/checkbox-field/group.example.tsx
git mv content/docs/react-hook-form/checkbox-field.mdx packages/registry/items/react-hook-form/checkbox-field/index.mdx
```

- [ ] **Step 4: Migrate `radio-field`**

```bash
mkdir -p packages/registry/items/react-hook-form/radio-field
git mv registry/ui/rhf-radio-field.tsx packages/registry/items/react-hook-form/radio-field/component.tsx
git mv examples/rhf-radio-field.tsx packages/registry/items/react-hook-form/radio-field/default.example.tsx
git mv examples/rhf-radio-field.payment-method.tsx packages/registry/items/react-hook-form/radio-field/payment-method.example.tsx
git mv examples/rhf-radio-field.conditional-pricing.tsx packages/registry/items/react-hook-form/radio-field/conditional-pricing.example.tsx
git mv content/docs/react-hook-form/radio-field.mdx packages/registry/items/react-hook-form/radio-field/index.mdx
```

- [ ] **Step 5: Migrate `select-field`**

```bash
mkdir -p packages/registry/items/react-hook-form/select-field
git mv registry/ui/rhf-select-field.tsx packages/registry/items/react-hook-form/select-field/component.tsx
git mv examples/rhf-select-field.tsx packages/registry/items/react-hook-form/select-field/default.example.tsx
git mv examples/rhf-select-field.conditional.tsx packages/registry/items/react-hook-form/select-field/conditional.example.tsx
git mv examples/rhf-select-field.dependent.tsx packages/registry/items/react-hook-form/select-field/dependent.example.tsx
git mv content/docs/react-hook-form/select-field.mdx packages/registry/items/react-hook-form/select-field/index.mdx
```

- [ ] **Step 6: Migrate `textarea-field`**

```bash
mkdir -p packages/registry/items/react-hook-form/textarea-field
git mv registry/ui/rhf-textarea-field.tsx packages/registry/items/react-hook-form/textarea-field/component.tsx
git mv examples/rhf-textarea-field.tsx packages/registry/items/react-hook-form/textarea-field/default.example.tsx
git mv examples/rhf-textarea-field.tooltip.tsx packages/registry/items/react-hook-form/textarea-field/tooltip.example.tsx
git mv examples/rhf-textarea-field.character-count.tsx packages/registry/items/react-hook-form/textarea-field/character-count.example.tsx
git mv content/docs/react-hook-form/textarea-field.mdx packages/registry/items/react-hook-form/textarea-field/index.mdx
```

- [ ] **Step 7: Migrate `query-boundary`**

```bash
mkdir -p packages/registry/items/react-hook-form/query-boundary
git mv registry/ui/rhf-query-boundary.tsx packages/registry/items/react-hook-form/query-boundary/component.tsx
git mv examples/query-boundary.tsx packages/registry/items/react-hook-form/query-boundary/default.example.tsx
git mv examples/rhf-query-boundary.tsx packages/registry/items/react-hook-form/query-boundary/rhf-default.example.tsx
git mv examples/rhf-query-boundary.error-handling.tsx packages/registry/items/react-hook-form/query-boundary/error-handling.example.tsx
git mv content/docs/tanstack-query/query-boundary.mdx packages/registry/items/react-hook-form/query-boundary/index.mdx
```

NOTE: `query-boundary.mdx` lives under `tanstack-query/` today but the registry item is `rhf-query-boundary`. Decision: keep it categorized under `react-hook-form/` for consistency, since there is no `tanstack-query/` group elsewhere.

- [ ] **Step 8: Migrate `address-field` (with extras)**

```bash
mkdir -p packages/registry/items/react-hook-form/address-field/extras
git mv registry/ui/rhf-address-field.tsx packages/registry/items/react-hook-form/address-field/component.tsx
git mv registry/actions/places.ts packages/registry/items/react-hook-form/address-field/extras/places.action.ts
git mv examples/rhf-address-field.tsx packages/registry/items/react-hook-form/address-field/default.example.tsx
git mv examples/rhf-address-field.shipping-billing.tsx packages/registry/items/react-hook-form/address-field/shipping-billing.example.tsx
git mv examples/address-field.tsx packages/registry/items/react-hook-form/address-field/standalone.example.tsx 2>/dev/null || true
git mv content/docs/react-hook-form/address-field.mdx packages/registry/items/react-hook-form/address-field/index.mdx
```

- [ ] **Step 9: Move `meta.json` for the rhf group**

```bash
# If content/docs/react-hook-form has its own meta.json, move it; otherwise, no-op
test -f content/docs/react-hook-form/meta.json && git mv content/docs/react-hook-form/meta.json packages/registry/items/react-hook-form/meta.json || true
```

- [ ] **Step 10: Regenerate**

```bash
cd packages/registry && bun run scripts/generate.ts && cd ../..
```
Expected: `[generate] 14 items processed`.

- [ ] **Step 11: Snapshot diff**

```bash
bun -e "
const pre = JSON.parse(require('fs').readFileSync('docs/superpowers/plans/snapshots/registry.pre.json','utf-8'));
const post = JSON.parse(require('fs').readFileSync('packages/registry/registry.json','utf-8'));
const targets = ['rhf-input-field','rhf-password-field','rhf-checkbox-field','rhf-radio-field','rhf-select-field','rhf-textarea-field','rhf-query-boundary','rhf-address-field'];
for (const name of targets) {
  const a = pre.items.find(i => i.name === name);
  const b = post.items.find(i => i.name === name);
  const ok = a && b && a.type === b.type && a.files[0].target === b.files[0].target && (a.files.length === b.files.length);
  console.log(ok ? '✓ '+name : '✗ '+name+': '+JSON.stringify({a, b}, null, 2));
}
"
```
Expected: 8 lines all starting with `✓`.

- [ ] **Step 12: Verify dev**

```bash
cd apps/docs && bun run dev &
DEV_PID=$!
sleep 8
for slug in input-field password-field checkbox-field radio-field select-field textarea-field query-boundary address-field; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/docs/react-hook-form/$slug")
  echo "$code $slug"
done
kill $DEV_PID
wait $DEV_PID 2>/dev/null
cd ../..
```
Expected: all `200`.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(registry): migrate react-hook-form batch (8 items)"
```

---

### Task 2.3: Batch — `tanstack-form/` (7 items)

Items: `input-field`, `password-field`, `checkbox-field`, `radio-field`, `select-field`, `textarea-field`, `submit-button` (the `tsf-submit-button`).

- [ ] **Step 1: Migrate `input-field`**

```bash
mkdir -p packages/registry/items/tanstack-form/input-field
git mv registry/ui/tsf-input-field.tsx packages/registry/items/tanstack-form/input-field/component.tsx
git mv examples/tsf-input-field.tsx packages/registry/items/tanstack-form/input-field/default.example.tsx
git mv examples/tsf-input-field.tooltip.tsx packages/registry/items/tanstack-form/input-field/tooltip.example.tsx
git mv examples/tsf-input-field.async-validation.tsx packages/registry/items/tanstack-form/input-field/async-validation.example.tsx
git mv examples/tsf-input-field.nested-path.tsx packages/registry/items/tanstack-form/input-field/nested-path.example.tsx
git mv content/docs/tanstack-form/input-field.mdx packages/registry/items/tanstack-form/input-field/index.mdx
```

- [ ] **Step 2: Migrate `password-field`**

```bash
mkdir -p packages/registry/items/tanstack-form/password-field
git mv registry/ui/tsf-password-field.tsx packages/registry/items/tanstack-form/password-field/component.tsx
git mv examples/tsf-password-field.tsx packages/registry/items/tanstack-form/password-field/default.example.tsx
git mv examples/tsf-password-field.tooltip.tsx packages/registry/items/tanstack-form/password-field/tooltip.example.tsx
git mv examples/tsf-password-field.confirm-password.tsx packages/registry/items/tanstack-form/password-field/confirm-password.example.tsx
git mv examples/tsf-password-field.strength-meter.tsx packages/registry/items/tanstack-form/password-field/strength-meter.example.tsx
git mv content/docs/tanstack-form/password-field.mdx packages/registry/items/tanstack-form/password-field/index.mdx
```

- [ ] **Step 3: Migrate `checkbox-field`**

```bash
mkdir -p packages/registry/items/tanstack-form/checkbox-field
git mv registry/ui/tsf-checkbox-field.tsx packages/registry/items/tanstack-form/checkbox-field/component.tsx
git mv examples/tsf-checkbox-field.tsx packages/registry/items/tanstack-form/checkbox-field/default.example.tsx
git mv examples/tsf-checkbox-field.group.tsx packages/registry/items/tanstack-form/checkbox-field/group.example.tsx
git mv examples/tsf-checkbox-field.dependent-fields.tsx packages/registry/items/tanstack-form/checkbox-field/dependent-fields.example.tsx
git mv content/docs/tanstack-form/checkbox-field.mdx packages/registry/items/tanstack-form/checkbox-field/index.mdx
```

- [ ] **Step 4: Migrate `radio-field`**

```bash
mkdir -p packages/registry/items/tanstack-form/radio-field
git mv registry/ui/tsf-radio-field.tsx packages/registry/items/tanstack-form/radio-field/component.tsx
git mv examples/tsf-radio-field.tsx packages/registry/items/tanstack-form/radio-field/default.example.tsx
git mv examples/tsf-radio-field.payment-method.tsx packages/registry/items/tanstack-form/radio-field/payment-method.example.tsx
git mv examples/tsf-radio-field.conditional-pricing.tsx packages/registry/items/tanstack-form/radio-field/conditional-pricing.example.tsx
git mv content/docs/tanstack-form/radio-field.mdx packages/registry/items/tanstack-form/radio-field/index.mdx
```

- [ ] **Step 5: Migrate `select-field`**

```bash
mkdir -p packages/registry/items/tanstack-form/select-field
git mv registry/ui/tsf-select-field.tsx packages/registry/items/tanstack-form/select-field/component.tsx
git mv examples/tsf-select-field.tsx packages/registry/items/tanstack-form/select-field/default.example.tsx
git mv examples/tsf-select-field.conditional.tsx packages/registry/items/tanstack-form/select-field/conditional.example.tsx
git mv examples/tsf-select-field.dependent.tsx packages/registry/items/tanstack-form/select-field/dependent.example.tsx
git mv examples/tsf-select-field.dynamic.tsx packages/registry/items/tanstack-form/select-field/dynamic.example.tsx
git mv content/docs/tanstack-form/select-field.mdx packages/registry/items/tanstack-form/select-field/index.mdx
```

- [ ] **Step 6: Migrate `textarea-field`**

```bash
mkdir -p packages/registry/items/tanstack-form/textarea-field
git mv registry/ui/tsf-textarea-field.tsx packages/registry/items/tanstack-form/textarea-field/component.tsx
git mv examples/tsf-textarea-field.tsx packages/registry/items/tanstack-form/textarea-field/default.example.tsx
git mv examples/tsf-textarea-field.character-count.tsx packages/registry/items/tanstack-form/textarea-field/character-count.example.tsx
git mv examples/tsf-textarea-field.markdown-preview.tsx packages/registry/items/tanstack-form/textarea-field/markdown-preview.example.tsx
git mv content/docs/tanstack-form/textarea-field.mdx packages/registry/items/tanstack-form/textarea-field/index.mdx
```

- [ ] **Step 7: Migrate `submit-button` (tsf variant)**

```bash
mkdir -p packages/registry/items/tanstack-form/submit-button
git mv registry/ui/tsf-submit-button.tsx packages/registry/items/tanstack-form/submit-button/component.tsx
git mv examples/tsf-submit-button.tsx packages/registry/items/tanstack-form/submit-button/default.example.tsx
git mv content/docs/tanstack-form/submit-button.mdx packages/registry/items/tanstack-form/submit-button/index.mdx
```

- [ ] **Step 8: Move `meta.json` and `overview.mdx`**

```bash
test -f content/docs/tanstack-form/meta.json && git mv content/docs/tanstack-form/meta.json packages/registry/items/tanstack-form/meta.json || true
# overview.mdx is a category-level page, keep it under apps/docs/content/docs (Phase 3)
mkdir -p apps/docs/content/docs/tanstack-form
test -f content/docs/tanstack-form/overview.mdx && git mv content/docs/tanstack-form/overview.mdx apps/docs/content/docs/tanstack-form/overview.mdx || true
```

- [ ] **Step 9: Regenerate and diff**

```bash
cd packages/registry && bun run scripts/generate.ts && cd ../..
bun -e "
const pre = JSON.parse(require('fs').readFileSync('docs/superpowers/plans/snapshots/registry.pre.json','utf-8'));
const post = JSON.parse(require('fs').readFileSync('packages/registry/registry.json','utf-8'));
const targets = ['tsf-input-field','tsf-password-field','tsf-checkbox-field','tsf-radio-field','tsf-select-field','tsf-textarea-field','tsf-submit-button'];
for (const name of targets) {
  const a = pre.items.find(i => i.name === name);
  const b = post.items.find(i => i.name === name);
  const ok = a && b && a.type === b.type && a.files[0].target === b.files[0].target;
  console.log(ok ? '✓ '+name : '✗ '+name+': '+JSON.stringify({a, b}, null, 2));
}
"
```
Expected: 7 lines all `✓`.

- [ ] **Step 10: Verify dev**

```bash
cd apps/docs && bun run dev &
DEV_PID=$!
sleep 8
for slug in input-field password-field checkbox-field radio-field select-field textarea-field submit-button overview; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/docs/tanstack-form/$slug")
  echo "$code $slug"
done
kill $DEV_PID
wait $DEV_PID 2>/dev/null
cd ../..
```
Expected: all `200`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(registry): migrate tanstack-form batch (7 items)"
```

---

### Task 2.4: Batch — `blocks/` (2 items)

Items: `title-section`, `responsive-dialog` (declares `dependsOn: ["side-dialog"]` so the generator augments `registryDependencies`).

- [ ] **Step 1: Migrate `title-section`**

```bash
mkdir -p packages/registry/items/blocks/title-section
git mv registry/block/title-section.tsx packages/registry/items/blocks/title-section/component.tsx
git mv content/blocks/title-section.mdx packages/registry/items/blocks/title-section/index.mdx
```

- [ ] **Step 2: Migrate `responsive-dialog`**

```bash
mkdir -p packages/registry/items/blocks/responsive-dialog
git mv registry/block/responsive-dialog.tsx packages/registry/items/blocks/responsive-dialog/component.tsx
git mv examples/responsive-dialog.tsx packages/registry/items/blocks/responsive-dialog/default.example.tsx
git mv content/blocks/responsive-dialog.mdx packages/registry/items/blocks/responsive-dialog/index.mdx
```

- [ ] **Step 3: Add `meta.shuip.json` for `responsive-dialog` to declare `side-dialog` dependency**

```bash
cat > packages/registry/items/blocks/responsive-dialog/meta.shuip.json << 'EOF'
{
  "dependsOn": ["side-dialog"]
}
EOF
```

- [ ] **Step 4: Move `content/blocks/index.mdx` to apps/docs**

```bash
mkdir -p apps/docs/content/blocks
test -f content/blocks/index.mdx && git mv content/blocks/index.mdx apps/docs/content/blocks/index.mdx || true
test -f content/blocks/meta.json && git mv content/blocks/meta.json apps/docs/content/blocks/meta.json || true
```

- [ ] **Step 5: Update `apps/docs/source.config.ts` to also scan `blocks` from registry**

Edit `apps/docs/source.config.ts`:

```ts
export const blocks = defineDocs({
  dir: ['./content/blocks', '../../packages/registry/items/blocks'],
  ...defaultOptions,
});
```

- [ ] **Step 6: Regenerate and diff**

```bash
cd packages/registry && bun run scripts/generate.ts && cd ../..
bun -e "
const pre = JSON.parse(require('fs').readFileSync('docs/superpowers/plans/snapshots/registry.pre.json','utf-8'));
const post = JSON.parse(require('fs').readFileSync('packages/registry/registry.json','utf-8'));
const targets = ['title-section','responsive-dialog'];
for (const name of targets) {
  const a = pre.items.find(i => i.name === name);
  const b = post.items.find(i => i.name === name);
  const ok = a && b && a.type === b.type && a.files[0].target === b.files[0].target;
  console.log(ok ? '✓ '+name : '✗ '+name+': '+JSON.stringify({a, b}, null, 2));
}
"
```
Expected: both `✓`.

- [ ] **Step 7: Verify dev**

```bash
cd apps/docs && bun run dev &
DEV_PID=$!
sleep 8
for slug in title-section responsive-dialog; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/blocks/$slug")
  echo "$code $slug"
done
kill $DEV_PID
wait $DEV_PID 2>/dev/null
cd ../..
```
Expected: all `200`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(registry): migrate blocks batch (title-section, responsive-dialog)"
```

---

## Phase 3 — Move non-component pages and finalize fumadocs

### Task 3.1: Move remaining `content/docs/*` pages into `apps/docs/`

**Files:**
- Move: `content/docs/changelog.mdx`, `configuration.mdx`, `contribution.mdx`, `index.mdx`, `installation.mdx` → `apps/docs/content/docs/`
- Move: `content/docs/meta.json` → `apps/docs/content/docs/meta.json`

- [ ] **Step 1: Move pages**

```bash
mkdir -p apps/docs/content/docs
for f in changelog configuration contribution index installation; do
  if [ -f "content/docs/${f}.mdx" ]; then
    git mv "content/docs/${f}.mdx" "apps/docs/content/docs/${f}.mdx"
  fi
done
test -f content/docs/meta.json && git mv content/docs/meta.json apps/docs/content/docs/meta.json || true
```

- [ ] **Step 2: Verify nothing remains in root `content/`**

```bash
find content -type f 2>/dev/null | head
ls content 2>/dev/null
```
Expected: only `components/`, `react-hook-form/`, `tanstack-form/`, `blocks/` directories with possibly residual `.gitkeep` or empty subdirs (the `.mdx` and `.tsx` files are gone). `content/docs/components/` may still hold an empty `tanstack-query/` dir — clean below.

- [ ] **Step 3: Remove now-empty content subdirs**

```bash
find content -type d -empty -delete
```

- [ ] **Step 4: Run dev and verify the moved pages render**

```bash
cd apps/docs && bun run dev &
DEV_PID=$!
sleep 8
for slug in "" changelog configuration contribution installation; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/docs/$slug")
  echo "$code /docs/$slug"
done
kill $DEV_PID
wait $DEV_PID 2>/dev/null
cd ../..
```
Expected: all `200`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(docs): move non-component MDX pages into apps/docs/content"
```

---

## Phase 4 — Cleanup

### Task 4.1: Delete obsolete root files and folders

- [ ] **Step 1: Verify nothing remains in `registry/`, `examples/`, `content/`, `src/`**

```bash
find registry examples content src -type f 2>/dev/null | head
```
Expected: empty output (or only `.gitkeep`-like files).

- [ ] **Step 2: Remove the directories**

```bash
git rm -rf registry examples content src 2>/dev/null
rm -rf registry examples content src 2>/dev/null
```

- [ ] **Step 3: Remove obsolete root scripts**

```bash
git rm -f scripts/copy-local-registry.ts scripts/generate-registry.ts scripts/all-registry-cli.ts scripts/shadcn-build.ts 2>/dev/null
rmdir scripts 2>/dev/null || true
```

- [ ] **Step 4: Remove obsolete root configs**

```bash
git rm -f next.config.ts tsconfig.json components.json source.config.ts postcss.config.mjs cli.json registry.json mdx-components.tsx 2>/dev/null
```

- [ ] **Step 5: Verify root no longer contains app-level files**

```bash
ls
```
Expected: only `apps/`, `packages/`, `docs/`, `.github/`, `.husky/`, `.gitignore`, `.env.example`, `LICENSE`, `README.md`, `CHANGELOG.md`, `package.json`, `turbo.json`, `biome.json`, `bunfig.toml`, `bun.lock`.

- [ ] **Step 6: Verify build still works**

```bash
bun install
bun run build
```
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(cleanup): remove root registry/examples/content/src and obsolete scripts/configs"
```

---

### Task 4.2: Update `README.md` and `.github/` workflows

**Files:**
- Modify: `README.md` — add monorepo structure section, update commands
- Modify: `.github/workflows/*.yml` — adjust paths and build command

- [ ] **Step 1: Update `README.md`**

Replace the `## Quick Start` section (or add after the existing one) with:

```markdown
## Repository Structure

This is a turborepo monorepo:

- `apps/docs` — Next.js + fumadocs site (https://shuip.plvo.dev)
- `packages/ui` — shadcn primitives (button, form, input, …)
- `packages/registry` — components shipped to users (the source of truth)
- `packages/config` — shared TypeScript configs

### Local development

```bash
bun install
bun dev          # starts apps/docs at http://localhost:3000
bun build        # builds everything
```

### Adding a new component

1. Create `packages/registry/items/<category>/<name>/` with:
   - `component.tsx` — the shipped file
   - `index.mdx` — the doc
   - `default.example.tsx` and any number of `<variant>.example.tsx`
2. Run `bun dev` — `registry.json`, `__index__.ts`, and stubs are auto-generated.
3. Test installation: `npx shadcn@latest add http://localhost:3000/r/<name>.json` against a Next.js project.
```

- [ ] **Step 2: Inspect `.github/workflows/`**

```bash
ls .github/workflows/
```

- [ ] **Step 3: For each workflow, replace `bun build` with `turbo run build`, verify install command stays `bun install` at root**

For each workflow file under `.github/workflows/`:
- Find lines invoking `bun run build` or `bun build` → replace with `bun run build` (which runs `turbo run build` per root package.json) — already correct since root `build` script is `turbo run build`.
- Add cache for turbo if missing:

```yaml
- uses: actions/cache@v4
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-${{ hashFiles('bun.lock') }}
    restore-keys: ${{ runner.os }}-turbo-
```

(Apply manually to each workflow; if there are no workflows that build, skip.)

- [ ] **Step 4: Commit**

```bash
git add README.md .github/
git commit -m "docs: update README for monorepo + adjust CI workflows"
```

---

### Task 4.3: Vercel configuration

**Files:**
- Create or modify: root `vercel.json` (if not present, document the project settings)

- [ ] **Step 1: Create root `vercel.json`** (instructs Vercel where to build)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "turbo run build --filter=@repo/docs",
  "installCommand": "bun install",
  "outputDirectory": "apps/docs/.next",
  "framework": "nextjs",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./apps/docs ./packages || exit 1"
}
```

NOTE: Vercel project root setting in the dashboard should be the **repo root**, not `apps/docs`. The `outputDirectory` and `buildCommand` handle the rest.

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore(deploy): add vercel.json for monorepo build"
```

- [ ] **Step 3: Note for Pelavo (manual)**: in Vercel dashboard, ensure project's "Root Directory" is set to repo root (not `apps/docs`). This needs to be done after merge.

---

### Task 4.4: Final smoke test

- [ ] **Step 1: Full pipeline build**

```bash
bun install
bun run build
```
Expected: exits 0, all artifacts in place.

- [ ] **Step 2: Snapshot diff for ALL items**

```bash
bun -e "
const pre = JSON.parse(require('fs').readFileSync('docs/superpowers/plans/snapshots/registry.pre.json','utf-8'));
const post = JSON.parse(require('fs').readFileSync('packages/registry/registry.json','utf-8'));
const preNames = pre.items.map(i => i.name).sort();
const postNames = post.items.map(i => i.name).sort();
const missing = preNames.filter(n => !postNames.includes(n));
const added = postNames.filter(n => !preNames.includes(n));
console.log('Missing in post:', missing);
console.log('Added in post:', added);
let ok = 0, ko = 0;
for (const a of pre.items) {
  const b = post.items.find(i => i.name === a.name);
  if (!b) { ko++; console.log('✗ MISSING', a.name); continue; }
  const sameType = a.type === b.type;
  const sameTarget = a.files[0].target === b.files[0].target;
  if (sameType && sameTarget) ok++;
  else { ko++; console.log('✗ DRIFT', a.name, {a: a.files[0].target, b: b.files[0].target}); }
}
console.log('OK:', ok, 'KO:', ko);
"
```
Expected: `Missing in post: []`, `Added in post: []`, `OK: 23, KO: 0`.

- [ ] **Step 3: Run dev and curl every documented page**

```bash
cd apps/docs && bun run dev &
DEV_PID=$!
sleep 10
fail=0
for url in \
  "/" \
  "/docs" \
  "/docs/changelog" \
  "/docs/installation" \
  "/docs/components/submit-button" \
  "/docs/components/copy-button" \
  "/docs/components/theme-button" \
  "/docs/components/confirmation-dialog" \
  "/docs/components/hover-reveal" \
  "/docs/components/side-dialog" \
  "/docs/react-hook-form/input-field" \
  "/docs/react-hook-form/password-field" \
  "/docs/react-hook-form/address-field" \
  "/docs/tanstack-form/overview" \
  "/docs/tanstack-form/input-field" \
  "/blocks/title-section" \
  "/blocks/responsive-dialog" \
  "/r/submit-button.json" \
  "/r/rhf-input-field.json" \
  "/r/responsive-dialog.json"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${url}")
  if [ "$code" != "200" ]; then echo "FAIL $code $url"; fail=1; else echo "OK $url"; fi
done
kill $DEV_PID
wait $DEV_PID 2>/dev/null
cd ../..
[ $fail -eq 0 ] && echo "ALL OK" || echo "FAILURES PRESENT"
```
Expected: `ALL OK`.

- [ ] **Step 4: Smoke test against a throwaway project**

```bash
# In a separate terminal: keep dev server running
# cd /tmp && rm -rf shuip-smoke && bun create next-app shuip-smoke -y
# cd shuip-smoke && npx shadcn@latest init -y
# npx shadcn@latest add http://localhost:3000/r/submit-button.json
# Verify file installed at components/ui/shuip/submit-button.tsx
```

This is a **manual** step due to interactivity. Document it but do not block the plan.

- [ ] **Step 5: Final commit**

```bash
git status
# If clean, no commit needed.
# If bun.lock or other artifacts changed:
git add -A
git diff --cached --stat
git commit -m "chore: final monorepo build verification" 2>/dev/null || true
```

- [ ] **Step 6: Push branch and open PR**

```bash
git push -u origin refactor/turborepo
gh pr create --title "refactor: turborepo monorepo (apps/docs + packages/{ui,registry,config})" --body "$(cat <<'EOF'
## Summary
- Migrated to turborepo + bun workspaces with apps/docs, packages/ui, packages/registry, packages/config
- Single source-of-truth generator (packages/registry/scripts/generate.ts) derives registry.json + __index__.ts + stubs
- Colocated component source, examples, and MDX docs under packages/registry/items/<category>/<name>/
- Eliminated duplicate cn helper, dead @r/ alias, and copy-local-registry script
- Public shadcn-CLI contract preserved (URLs, item names, targets, shipped content unchanged)

## Test plan
- [x] bun install
- [x] bun run build
- [x] All 23 items match pre-migration snapshot (name, type, target)
- [x] Dev server renders /docs/* and /r/*.json for all items
- [ ] Manual: `npx shadcn@latest add` against a throwaway Next.js project (post-deploy)
- [ ] Vercel preview deploy verified before merge

Spec: docs/superpowers/specs/2026-05-06-turborepo-monorepo-refactor-design.md
Plan: docs/superpowers/plans/2026-05-06-turborepo-monorepo-refactor.md
EOF
)"
```

---

## Self-Review Notes (post-write)

1. **Spec coverage**: every section of the spec maps to at least one task.
   - Architecture (workspace layout) → Tasks 0.1–0.7 + 1.1
   - generate.ts script → Task 0.5
   - TypeScript path resolution → Tasks 0.4, 0.5, 0.6 (tsconfig files)
   - Build pipeline (turbo) → Task 0.2 (turbo.json), exercised in 0.9, 0.12
   - Bun workspace catalogs → Task 0.1
   - Phase 0 / pilot → Tasks 0.0–0.12
   - Phase 1 (move primitives) → Task 1.1
   - Phase 2 (item batches) → Tasks 2.1–2.4
   - Phase 3 (non-component pages) → Task 3.1
   - Phase 4 (cleanup) → Tasks 4.1–4.4

2. **Placeholders scan**: no TBD/TODO; every code block is concrete; every command is concrete.

3. **Type/name consistency**: `@repo/*` used consistently; `component.tsx` filename used in every item; `*.example.tsx` suffix consistent; folder names `components`/`react-hook-form`/`tanstack-form`/`blocks` consistent.

4. **Risks acknowledged in spec, mitigated in plan**:
   - Snapshot diff after every batch (Tasks 0.9, 2.1, 2.2, 2.3, 2.4, 4.4)
   - Pilot gate before bulk migration (Phase 0 gate after Task 0.12)
   - `bun.lock` updates committed when they appear

5. **Out of scope items NOT included**: no test runner setup; no item renaming; no `@repo/ui` npm publishing.
