# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project Overview

**shuip** is a React component library built on top of shadcn/ui for Next.js applications. Items are distributed through a custom registry consumed by the shadcn CLI through the `@shuip` namespace (`npx shadcn@latest add @shuip/<name>`; `components.json` declares `"@shuip": "https://shuip.plvo.dev/r/{style}/{name}.json"`).

The codebase is a Bun-workspaces + turborepo monorepo (Next.js 16, React 19, Tailwind v4 CSS-only, fumadocs v16, Biome, TypeScript 6).

## Repo Layout

```
apps/docs/                     Next.js site (registry endpoints, MDX content, styles entry)
  scripts/shadcn-build.ts        Reads registry.json (radix) and registry.base.json, writes public/r/<variant>/*.json for shadcn CLI
  src/styles/globals.css         PostCSS entry; chains fumadocs + @repo/ui/styles/base.css
  content/docs/                  fumadocs `docs` collection (guide pages only, hand-written)
  content/components/            fumadocs `components` collection (registry-item symlinks + hand-written category guides)
  content/blocks/                fumadocs `blocks` collection (real MDX files, hand-written)

packages/ui/                   Vendored shadcn primitives + base.css (cross-package @source rules)
  src/components/ui/             radix-vega set (synced, never hand-edited)
  src/components/ui-base/        base-vega set (synced, Base UI; `bun run --filter @repo/ui typecheck:base`)
  scripts/sync-primitives.ts     Declares the primitive list and refreshes both sets via the shadcn CLI
packages/registry/             SOURCE OF TRUTH for published items
  items/<cat>/<name>/            See "Registry items" below
  items/tsconfig.json            Type-checks the Base UI overrides (`*.base.tsx`) against the Base UI primitives
  scripts/generate.ts            Scans items/, produces all downstream artifacts
  scripts/to-base-variant.ts     Codemod: Radix `asChild` composition to Base UI `render` composition
  generated/base/                Generated, git-ignored Base UI copies of every item (see "Base UI variant")
packages/config/ts/            Shared tsconfig presets (@repo/config/ts/*)
```

## Commands

```bash
bun dev                # All dev tasks (docs + registry:generate via turbo)
bun dev:docs           # Only the docs app
bun build              # Full build (depends on registry:generate + registry:build)
bun build:docs         # Build only the docs app (chains generate → registry:build → next build)
bun registry:generate  # Regenerate registry.json, __index__.ts, stubs/, MDX symlinks
bun registry:build     # Produce apps/docs/public/r/<variant>/*.json from registry.json
bun check              # Biome check + write (also runs on lint-staged pre-commit)
bun format             # Biome format
bun lint               # Biome lint
bun primitives:sync    # Refresh both vendored primitive sets from ui.shadcn.com (needs network)
bun check:unused       # knip
bun run test           # Unit tests of every workspace that has some (turbo)
bun smoke [style]      # Consumer smoke test: install every @shuip item in a fresh shadcn project (default radix-vega), then tsc. --keep leaves the project in /tmp
                       #   --items a,b restricts the installed items; --base-variant routes base-* styles to the base variant
                       #   (production still routes them to radix), e.g. bun smoke base-vega --base-variant --items search-input
bun typecheck:base     # Type-check the Base UI primitives and the Base UI overrides of the items
bun clean              # Wipe node_modules, .next, .turbo, .source, bun.lock
```

## Registry Items

Each item lives at `packages/registry/items/<category>/<name>/`. The folder structure is the contract — `packages/registry/scripts/generate.ts` scans it and emits every downstream artifact.

**Categories:** `components` (no prefix) · `blocks` (no prefix, type `registry:block`) · `react-hook-form` (`rhf-`) · `tanstack-form` (`tsf-`) · `tanstack-query` (`tsq-`). The folder name is **unprefixed**; the script applies the prefix.

```
items/<category>/<name>/
  component.radix.tsx          REQUIRED. Exact filename. The canonical (Radix) published source.
  default.example.radix.tsx    Primary preview (registry key: <prefixed-name>.example).
  <variant>.example.radix.tsx  Extra previews (key: <prefixed-name>.<variant>.example).
  component.base.tsx           Optional Base UI override of component.radix.tsx. See "Base UI variant".
  <variant>.example.base.tsx   Optional Base UI override of <variant>.example.radix.tsx.
  index.mdx                    Doc page. Symlinked into apps/docs/content/components/ (UI `components` flat
                               at the root; other categories under /<cat>/).
                               BLOCKS DO NOT USE THIS — see "Blocks doc flow" below.
  extras/                      Optional. Files copied alongside on install:
    <file>.action.ts             → installs as ./actions/shuip/<file>.ts
    <file>.<ext>                 → installs as ./components/ui/shuip/<file>.<ext>
  meta.shuip.json              Optional. { "dependsOn": ["<other-shuip-item>"] }
```

**Auto-detected from `component.radix.tsx` imports:**
- `import ... from '@/components/ui/<name>'` → `registryDependencies` (consumer installs that shadcn primitive)
- External npm imports → `dependencies`
- Anything else (relative, `@repo/*`, `#/*`) → ignored

## Base UI variant

Radix is the canonical source; the Base UI variant of every item is generated from it. For each canonical file (`component.radix.tsx`, `*.example.radix.tsx`):

- **No override:** the codemod `toBaseVariant` (`scripts/to-base-variant.ts`) converts `<X asChild><Child …/></X>` to `<X render={<Child …/>}>…</X>` and adds `nativeButton={false}` when the rendered element is not a button (not for `TooltipTrigger` and `HoverCardTrigger`, which have no such prop). `asChild={expr}` pass-throughs are left untouched, and so is an `asChild` that wraps something other than one element; the generator warns about the latter. A link (`a`, `Link`) rendered with `nativeButton={false}` also warns, because Base UI discourages it: use `buttonVariants` on a plain anchor instead. The output is formatted with Biome.
- **Override:** an item may ship `component.base.tsx` and/or `<variant>.example.base.tsx` next to the canonical file. It wins over the codemod and is used verbatim. Add one only where the two APIs genuinely diverge (for example `PopoverAnchor` and `onOpenAutoFocus` have no Base UI equivalent).

An override is written exactly as consumers receive it, with the standard `@/components/ui/*` aliases. `packages/registry/items/tsconfig.json` resolves those aliases to the Base UI primitives (`packages/ui/src/components/ui-base/`), so the editor and `bun typecheck:base` check overrides against Base UI. The registry `tsconfig.json` excludes `*.base.tsx`, so an override is never checked against Radix.

**Drift warning:** on every `registry:generate` run, the generator warns about each override whose canonical file has commits newer than the override's last commit (`<override> predates the latest commits of <canonical>`). It is a warning, not a failure: update the override to follow the canonical change, or commit it unchanged once you have checked it still holds. An override that is not committed yet, and a checkout without commit history, raise nothing.

**Outputs** (all generated, git-ignored, never edited by hand):
- `packages/registry/generated/base/consumer/items/**`: the consumer form, original aliases. This is what `registry.base.json` points to and what `/r/base/<name>.json` publishes.
- `packages/registry/generated/base/items/**` and `generated/base/stubs/**`: the copies the docs compile, with every alias rewritten to explicit paths (Base UI primitives, Base UI stubs, shared files).

Both variants are published (`apps/docs/public/r/base/` and `radix/`), but production still routes `base-*` styles to `radix`: `VARIANT_FOR_BASE` in `packages/registry/src/style-base.ts` decides.

**Blocks doc flow:** Block items must not contain `index.mdx`. Their docs live as real MDX files at `apps/docs/content/blocks/<name>.mdx` (a separate fumadocs collection defined in `apps/docs/source.config.ts`). If you put `index.mdx` in `items/blocks/<name>/`, the generator will create a symlink in `apps/docs/content/components/blocks/`, which no collection reads — the doc will silently not appear.

## Docs Routing & Sidebar

- Routes: `/docs` (guides only) · `/components` (all registry items) · `/blocks`. UI `components` items are flat at `/components/<name>`; other categories keep `/components/<cat>/<name>` (via `componentsDocsDir` in `generate.ts`).
- The sidebar is one custom merged `PageTree` built in `apps/docs/src/lib/source.ts` (`sidebarTree`), shared by the `/docs` and `/components` layouts. Order lives in code — fumadocs `...folder` meta extracts *flatten* a folder, so meta can't split a folder's index from its children across sidebar positions.
- PageTree node types (`Root`, `Item`, `Separator`, `Node`) import from `fumadocs-core/page-tree` (not `/server`).
- After changing a collection or content, run `bunx fumadocs-mdx` (in `apps/docs`) to regenerate `.source` types before `tsc`.

## Path Mappings

Configured identically in `apps/docs/tsconfig.json` and `packages/registry/tsconfig.json`:

| Alias | Resolves to |
|-------|-------------|
| `@/components/ui/shuip/*` | `packages/registry/stubs/*` (auto-generated re-exports of `items/<cat>/<name>/component.radix.tsx`) |
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
- **Tests use `bun test`** (bun:test), run from `packages/registry`, `packages/ui` and `apps/docs` through `bun run test`. CI runs them on every PR.
- **`next build` is the authoritative type gate** — `apps/docs` `tsc --noEmit` works but emits a harmless `baseUrl` TS5101 deprecation. `bun build:docs` can OOM (exit 137) on low-RAM machines; use `NODE_OPTIONS=--max-old-space-size=6144 bun build:docs`.
- **shadcn config** is at `packages/ui/components.json` (radix-vega style, RSC enabled).

## Generated Artifacts — Never Edit by Hand

`registry:generate` regenerates these. Any manual edit is lost:

- `packages/registry/registry.json`, `packages/registry/registry.base.json`
- `packages/registry/__index__.ts`
- `packages/registry/stubs/**`
- `packages/registry/generated/**`
- `apps/docs/public/r/**` (regenerated by `registry:build`; served per style through the rewrites from `packages/registry/src/style-base.ts`)
- `apps/docs/content/components/**` item-doc symlinks (UI `components` flat at the root; other categories under `<cat>/`) + the `.gitignore` files listing them

To change anything in those, edit the source under `packages/registry/items/<cat>/<name>/` and run `bun registry:generate`.

## Workflows

**Adding a registry item:**
1. Create `packages/registry/items/<cat>/<name>/{component.radix.tsx, default.example.radix.tsx, index.mdx}` (skip `index.mdx` for blocks; use `content/blocks/` instead).
2. `bun registry:generate` — confirm `[generate] N items processed` increased.
3. `bun build:docs` end-to-end check.

**Adding a Base UI override:**
1. Copy `component.radix.tsx` (or `<variant>.example.radix.tsx`) to `component.base.tsx` (or `<variant>.example.base.tsx`) in the same folder and change only what diverges.
2. `bun typecheck:base` regenerates, then type-checks every override against Base UI.
3. `bun smoke base-vega --base-variant --items <name>` installs the item into a real Base UI project and type-checks it.

**Adding a new alias used by extras/:** mirror the path mapping in `apps/docs/tsconfig.json`, `packages/registry/tsconfig.json` and `packages/registry/items/tsconfig.json`, and add it to `SHARED_FILES` in `packages/registry/scripts/base-variant.ts` so the Base UI copies resolve it.

**Adding a new shared external dep:** add the version to the root `workspaces.catalog` (or appropriate sub-catalog), then reference `"catalog:"`/`"catalog:<name>"` from the consuming workspace.

## Important Notes

- Examples import the item itself via the stub alias (`@/components/ui/shuip/<cat-subdir>/<name>`), never via `./component.radix`. Consumers will use the stub path after `shadcn add`.
- `component.radix.tsx` must not import `@/components/ui/shuip/*` — circular. Import shadcn primitives via `@/components/ui/<name>`.
- The generator skips silently (warning only) any item folder missing `component.radix.tsx`. Watch the console output. An unsuffixed `component.tsx`, an example without a recognised base suffix, or a scan that finds zero items makes it fail instead.
