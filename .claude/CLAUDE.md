# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project Overview

**shuip** is a React component library built on top of shadcn/ui for Next.js applications. Items are distributed through a custom registry consumed by the shadcn CLI (`npx shadcn@latest add "https://shuip.plvo.dev/r/<name>"`).

The codebase is a Bun-workspaces + turborepo monorepo (Next.js 16, React 19, Tailwind v4 CSS-only, fumadocs v16, Biome, TypeScript 6).

## Repo Layout

```
apps/docs/                     Next.js site (registry endpoints, MDX content, styles entry)
  scripts/shadcn-build.ts        Reads registry.json, writes public/r/*.json for shadcn CLI
  src/styles/globals.css         PostCSS entry; chains fumadocs + @repo/ui/styles/base.css
  content/docs/                  fumadocs `docs` collection (symlinks from registry items)
  content/blocks/                fumadocs `blocks` collection (real MDX files, hand-written)

packages/ui/                   Shadcn primitives + base.css (cross-package @source rules)
packages/registry/             SOURCE OF TRUTH for published items
  items/<cat>/<name>/            See "Registry items" below
  scripts/generate.ts            Scans items/, produces all downstream artifacts
packages/config/ts/            Shared tsconfig presets (@repo/config/ts/*)
```

## Commands

```bash
bun dev                # All dev tasks (docs + registry:generate via turbo)
bun dev:docs           # Only the docs app
bun build              # Full build (depends on registry:generate + registry:build)
bun build:docs         # Build only the docs app (chains generate → registry:build → next build)
bun registry:generate  # Regenerate registry.json, __index__.ts, stubs/, MDX symlinks
bun registry:build     # Produce apps/docs/public/r/*.json from registry.json
bun check              # Biome check + write (also runs on lint-staged pre-commit)
bun format             # Biome format
bun lint               # Biome lint
bun check:unused       # knip
bun clean              # Wipe node_modules, .next, .turbo, .source, bun.lock
```

## Registry Items

Each item lives at `packages/registry/items/<category>/<name>/`. The folder structure is the contract — `packages/registry/scripts/generate.ts` scans it and emits every downstream artifact.

**Categories:** `components` (no prefix) · `blocks` (no prefix, type `registry:block`) · `react-hook-form` (prefix `rhf-`) · `tanstack-form` (prefix `tsf-`). The folder name is **unprefixed**; the script applies the prefix.

```
items/<category>/<name>/
  component.tsx           REQUIRED. Exact filename. The published source.
  default.example.tsx     Primary preview (registry key: <prefixed-name>.example).
  <variant>.example.tsx   Extra previews (key: <prefixed-name>.<variant>.example).
  index.mdx               Doc page. Symlinked into apps/docs/content/docs/<cat>/.
                          BLOCKS DO NOT USE THIS — see "Blocks doc flow" below.
  extras/                 Optional. Files copied alongside on install:
    <file>.action.ts        → installs as ./actions/shuip/<file>.ts
    <file>.<ext>            → installs as ./components/ui/shuip/<file>.<ext>
  meta.shuip.json         Optional. { "dependsOn": ["<other-shuip-item>"] }
```

**Auto-detected from `component.tsx` imports:**
- `import ... from '@/components/ui/<name>'` → `registryDependencies` (consumer installs that shadcn primitive)
- External npm imports → `dependencies`
- Anything else (relative, `@repo/*`, `#/*`) → ignored

**Blocks doc flow:** Block items must not contain `index.mdx`. Their docs live as real MDX files at `apps/docs/content/blocks/<name>.mdx` (a separate fumadocs collection defined in `apps/docs/source.config.ts`). If you put `index.mdx` in `items/blocks/<name>/`, the generator will create a symlink in `apps/docs/content/docs/blocks/`, which no collection reads — the doc will silently not appear.

## Path Mappings

Configured identically in `apps/docs/tsconfig.json` and `packages/registry/tsconfig.json`:

| Alias | Resolves to |
|-------|-------------|
| `@/components/ui/shuip/*` | `packages/registry/stubs/*` (auto-generated re-exports of `items/<cat>/<name>/component.tsx`) |
| `@/components/block/shuip/*` | `packages/registry/stubs/blocks/*` |
| `@/components/ui/*` | `packages/ui/src/components/ui/*` (shadcn primitives) |
| `@/lib/utils` | `packages/ui/src/lib/utils` |
| `@/actions/shuip/places` | `packages/registry/items/react-hook-form/address-field/extras/places.action` |

`@/*` in `apps/docs` also resolves to `./src/*` for app-internal code.

Examples import the item itself through the stub alias (`@/components/ui/shuip/<cat-subdir>/<name>`), not via relative path. That mirrors what consumers will write after `shadcn add`.

## CSS Pipeline

Entry: `apps/docs/src/styles/globals.css`. Chain:

```
@import 'tailwindcss';
@import 'fumadocs-ui/css/shadcn.css';   bridge --color-fd-* ↔ --*
@import 'fumadocs-ui/css/preset.css';   fumadocs styling
@import '@repo/ui/styles/base.css';     shuip @theme + @source + :root/.dark
```

`@source` lines in `packages/ui/src/styles/base.css` are **relative to that file**:
- `../components/**` → `packages/ui/src/components`
- `../../../registry/items/**` → `packages/registry/items`
- `../../../../apps/docs/src/**` → `apps/docs/src`

A wrong `@source` path silently strips Tailwind classes from the affected files — no build error, just unstyled UI.

Tailwind v4 is config-CSS-only — there is no `tailwind.config.js`. Theme tokens are declared in `:root` / `.dark` inside `@layer base`, and exposed as Tailwind utilities via `@theme inline { ... }` at the top level.

## Bun Catalogs

Shared dependency versions live in `package.json` → `workspaces.catalog` (default) and `workspaces.catalogs.{fumadocs,radix,forms}`. Workspaces reference them as `"<pkg>": "catalog:"` or `"catalog:<name>"`. To add a new shared dep, edit the root catalog first, then reference it from each consuming workspace's `package.json`. Pinning a version directly defeats the catalog.

## Conventions

- **Biome** is the only linter/formatter (no ESLint/Prettier). Config: single quotes, 2-space indent, 120-col, trailing commas. Lint-staged runs `biome check --write --unsafe` on commit via husky.
- **TypeScript 6**. Project references are declared at root but workspaces are not marked `composite: true` — IDE works, `tsc --build` from root does not. Per-workspace `tsc --noEmit` is fine.
- **No test runner is configured.** Propose a setup before adding tests.
- **shadcn config** is at `packages/ui/components.json` (New York style, RSC enabled).

## Generated Artifacts — Never Edit by Hand

`registry:generate` regenerates these. Any manual edit is lost:

- `packages/registry/registry.json`
- `packages/registry/__index__.ts`
- `packages/registry/stubs/**`
- `apps/docs/public/r/**` (regenerated by `registry:build`)
- `apps/docs/content/docs/<cat>/<name>.mdx` (symlinks)
- `apps/docs/content/docs/<cat>/.gitignore` (lists the symlinks)

To change anything in those, edit the source under `packages/registry/items/<cat>/<name>/` and run `bun registry:generate`.

## Workflows

**Adding a registry item:**
1. Create `packages/registry/items/<cat>/<name>/{component.tsx, default.example.tsx, index.mdx}` (skip `index.mdx` for blocks; use `content/blocks/` instead).
2. `bun registry:generate` — confirm `[generate] N items processed` increased.
3. `bun build:docs` end-to-end check.

**Adding a new alias used by extras/:** mirror the path mapping in **both** `apps/docs/tsconfig.json` and `packages/registry/tsconfig.json`.

**Adding a new shared external dep:** add the version to the root `workspaces.catalog` (or appropriate sub-catalog), then reference `"catalog:"`/`"catalog:<name>"` from the consuming workspace.

## Important Notes

- Examples import the item itself via the stub alias (`@/components/ui/shuip/<cat-subdir>/<name>`), never via `./component`. Consumers will use the stub path after `shadcn add`.
- `component.tsx` must not import `@/components/ui/shuip/*` — circular. Import shadcn primitives via `@/components/ui/<name>`.
- The generator skips silently (warning only) any item folder missing `component.tsx`. Watch the console output.
