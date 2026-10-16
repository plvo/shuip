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
  items/tsconfig.json            Type-checks the Base UI overrides (`*.base.tsx`) and the generated Base UI copies of every item and example against the Base UI primitives
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
bun check:unused       # knip (knip.config.ts); CI runs it after the tests, once registry:generate has produced stubs/ and generated/
bun run test           # Unit tests of every workspace that has some (turbo)
bun smoke [style]      # Consumer smoke test: install every @shuip item in a fresh shadcn project (default radix-vega), then tsc. --keep leaves the project in /tmp
                       #   --items a,b restricts the installed items, e.g. bun smoke base-vega --items search-input
                       #   base-* styles are served the Base UI variant, and the smoke test then fails on any Radix package
bun typecheck:base     # Type-check the Base UI primitives, the Base UI overrides and the generated Base UI copies of every item
bun typecheck:radix    # Regenerate, then type-check every canonical Radix source (component.radix.tsx, *.example.radix.tsx) against the Radix primitives
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

An override is written exactly as consumers receive it, with the standard `@/components/ui/*` aliases. `packages/registry/items/tsconfig.json` resolves those aliases to the Base UI primitives (`packages/ui/src/components/ui-base/`), so the editor and `bun typecheck:base` check overrides against Base UI. The registry `tsconfig.json` excludes `*.base.tsx`, so an override is never checked against Radix. The same project also includes `generated/base/items/**`, so the codemod output of every item and example is checked against Base UI too, without waiting for the smoke test.

**Drift warning:** on every `registry:generate` run, the generator warns about each override whose canonical file has commits newer than the override's last commit (`<override> predates the latest commits of <canonical>`). It is a warning, not a failure: update the override to follow the canonical change, or commit it unchanged once you have checked it still holds. An override that is not committed yet, and a checkout without commit history, raise nothing.

**Outputs** (all generated, git-ignored, never edited by hand):
- `packages/registry/generated/base/consumer/items/**`: the consumer form, original aliases. This is what `registry.base.json` points to and what `/r/base/<name>.json` publishes.
- `packages/registry/generated/base/items/**` and `generated/base/stubs/**`: the copies the docs compile, with every alias rewritten to explicit paths (Base UI primitives, Base UI stubs, shared files).
- `packages/registry/generated/base/__index__.ts` (`@repo/registry/__index__.base`): the lazy component index of those copies, the Base UI counterpart of `__index__.ts`. Neither index carries sources: the docs read them on the server with `readItemSource` (`@repo/registry/item-source`), from the files each registry publishes.

Both variants are published (`apps/docs/public/r/base/` and `radix/`). `styleRewrites()` in `packages/registry/src/style-base.ts` routes `/r/base-<preset>/<name>.json` to `base`, and `radix-<preset>`, `new-york`, `new-york-v4` and `default` to `radix`; any other style, such as `aria-*`, is not routed and answers 404.

**Blocks doc flow:** Block items must not contain `index.mdx`. Their docs live as real MDX files at `apps/docs/content/blocks/<name>.mdx` (a separate fumadocs collection defined in `apps/docs/source.config.ts`). If you put `index.mdx` in `items/blocks/<name>/`, the generator will create a symlink in `apps/docs/content/components/blocks/`, which no collection reads — the doc will silently not appear.

## Docs Routing & Sidebar

- Routes: `/docs` (guides only, no base) · `/components/{base,radix}/...` (all registry items) · `/blocks/{base,radix}/...`. UI `components` items are flat at `/components/<base>/<name>`; other categories keep `/components/<base>/<cat>/<name>` (via `componentsDocsDir` in `generate.ts`). One MDX per item; the base comes from the route segment and reaches the item blocks (`ItemHeader`, `ItemExamples`, the gallery) through `getMDXComponents(components, base)`.
- Base UI is the default base, and the reader's last base is remembered. Visiting a `/components/<base>/…` or `/blocks/<base>/…` page writes the `shuip-base` cookie from the browser (`BaseCookie`, mounted by the shared `[base]` layout); pages never read it, so they stay static. `baseRedirects()` in `apps/docs/src/lib/base-routes.ts` (wired in `next.config.ts`) sends `/components/**`, `/blocks/**` and their `llms.mdx` routes without a base segment to the page of the cookie's base through `has` cookie rules, then to Base UI. These redirects are temporary (307) on purpose: a browser keeps a permanent redirect per address whatever the cookie says later. Links from places that belong to no base (`/docs` sidebar, home page, not-found) use the unbased address so the redirect picks the base. Markdown routes are `/<section>/llms.mdx/<base>/<slug>`.
- Each base has its own loader over the same collection (`componentsSources`, `blocksSources` in `apps/docs/src/lib/source.ts`, built by `sectionLoaders` in `section-sources.ts`), so page addresses and page trees carry the base. `sidebarTreeFor(section, base, sectionSources)` returns the sidebar of a based page: the components sidebar comes from `buildSidebarTree` (`sidebar-tree.ts`) and the blocks one from the blocks loader's page tree. The `/docs` layout uses `docsSidebarTree()`, the default-base components tree with its links unbased (`unbasedSidebarTree`). `SiteDocsLayout` is the one `DocsLayout` setup behind both. Order lives in code — fumadocs `...folder` meta extracts *flatten* a folder, so meta can't split a folder's index from its children across sidebar positions.
- Two switchers change the base. The sidebar one (`BaseDropdown` in `components/base-dropdown.tsx`) is the `banner` of `BasedSectionLayout`, so it shows at the top of the sidebar and of the mobile drawer. It is fumadocs' own `SidebarTabsDropdown` (`fumadocs-ui/components/sidebar/tabs/dropdown`) fed options built in the browser: the `sidebar.tabs` option of the layout takes fixed addresses chosen on the server, which cannot name the page the reader is on, but the dropdown component takes any options, so `baseDropdownOptions` builds them from `usePathname`. The in-page one (`BaseSwitcher`, under the title) shows below `md` only, the width under which fumadocs moves the sidebar into the drawer (`max-md:hidden` on its sidebar), so at every width exactly one of the two is in sight. Both take their entries from `baseChoices(pathname, base, pages)` in `base-routes.ts`: the same page in the other base when `pages` (the addresses of every page under each base, from `sectionPageUrls(section, sectionSources)` in `section-sources.ts`) lists it, the index of the section otherwise. Choosing a base is a navigation, so `BaseCookie` of the target page writes the cookie; the switchers do not write it. Keep primitives out of docs chrome such as this: only the per-base modules of `components/preview` and `components/providers` import primitives, and `base-isolation.test.ts` watches them.
- The package manager tabs of the install block and the Preview / Code tabs of the examples are fumadocs `Tabs` with a `groupId` and `persist`: `TAB_GROUPS.packageManager` is one group for the whole site, and each example has its own Preview / Code group, `previewGroupId(exampleKey)`, whose key names no base, so every example keeps its tab across a base switch and a reload. fumadocs keeps the selected tab in `sessionStorage`, then `localStorage` (the id is the key), and restores it in a layout effect after hydration, so the server never reads storage and pages stay static. Base switches and page changes are client navigations and show the restored tab at once; a full page load shows the default tab until hydration. A stored tab the page does not offer (`manual` on an item without source) is ignored. `scripts/persistent-tabs.test.ts` fails when a `Tabs` from `fumadocs-ui/components/tabs` has no `groupId` and `persist`.
- The two primitive libraries never share a React tree: the `[base]` layouts mount the providers of their base (`ProvidersForBase`) and previews come from per-base client modules (`components/preview/base-ui-preview.tsx`, `components/preview/radix-preview.tsx`; providers live in `components/providers/`). Do not mount a primitive provider in `AppProvider`. `apps/docs/scripts/base-isolation.test.ts` follows the imports of those modules and fails when a module a base reaches imports the other base's primitives. `@/components/ui-base/*` resolves to the Base UI primitives in `apps/docs/tsconfig.json`.
- Prose or snippets that only hold for one base go inside `<BaseOnly base="radix">…</BaseOnly>` or `<BaseOnly base="base">…</BaseOnly>` in the MDX (`asChild` on Radix, `render` on Base UI). `apps/docs/scripts/base-prose.test.ts` fails when a Radix-only API appears outside a Radix block, and the markdown routes keep only the block of the page's base (`llmsText` in `apps/docs/src/lib/llms-text.ts`).
- Search and `llms-full.txt` list the pages of the default base only; each page's markdown names its other variants, and `llms-full.txt` opens with a pointer to the Radix pages and their `llms.mdx` markdown (`llmsFullText` in `apps/docs/src/lib/llms-text.ts`).
- PageTree node types (`Root`, `Item`, `Separator`, `Node`) import from `fumadocs-core/page-tree` (not `/server`).
- After changing a collection or content, run `bunx fumadocs-mdx` (in `apps/docs`) to regenerate `.source` types before `tsc`.

## Path Mappings

The first six aliases are configured identically in `apps/docs/tsconfig.json` and `packages/registry/tsconfig.json`. `@/components/ui-base/*` is configured in `apps/docs/tsconfig.json` and `packages/registry/items/tsconfig.json` only: the canonical registry sources never import it.

| Alias | Resolves to |
|-------|-------------|
| `@/components/ui/shuip/*` | `packages/registry/stubs/*` (auto-generated re-exports of `items/<cat>/<name>/component.radix.tsx`) |
| `@/components/block/shuip/*` | `packages/registry/stubs/blocks/*` |
| `@/components/ui/*` | `packages/ui/src/components/ui/*` (shadcn primitives) |
| `@/lib/utils` | `packages/ui/src/lib/utils` |
| `@/lib/time` | `packages/registry/items/lib/time/time` |
| `@/actions/shuip/places` | `packages/registry/items/react-hook-form/address-field/extras/places.action` |
| `@/components/ui-base/*` | `packages/ui/src/components/ui-base/*` (Base UI primitives, which the primitives import each other through) |

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
- **`bun check:unused` (knip) runs in CI** and fails a PR that adds an unused file, export or dependency, or an import a workspace does not declare. `knip.config.ts` lists the files loaded in ways knip cannot see (fumadocs config, `.mdx` imports, `actions/github-script`) as `entry`; each `ignore*` entry there says why. If `content/docs/changelog.mdx` stops importing `changelog-content.tsx`, remove its entry.
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
2. `bun typecheck:base` regenerates, then type-checks every override and every generated copy against Base UI.
3. `bun smoke base-vega --items <prefixed-name>` installs the item into a real Base UI project and type-checks it.

The vendored Base UI `PopoverContent` does not expose the Positioner's `anchor` prop. An item that anchors a popover to an element other than its trigger (the autocomplete fields) composes `Popover as PopoverPrimitive` from `@base-ui/react/popover` (`Portal`, `Positioner anchor={ref}`, `Popup`) next to the vendored `Popover` root, and sizes the popup with `var(--anchor-width)`.

**Adding a new alias used by extras/:** add the path mapping to `apps/docs/tsconfig.json` and `packages/registry/tsconfig.json`. The generator reads the Base UI copies' aliases from the registry `tsconfig.json`; `packages/registry/items/tsconfig.json` (the Base UI one) must carry the same mapping, with the stubs and primitives pointing to the Base UI ones, and a test fails when it differs.

**Adding a new shared external dep:** add the version to the root `workspaces.catalog` (or appropriate sub-catalog), then reference `"catalog:"`/`"catalog:<name>"` from the consuming workspace.

## Important Notes

- Examples import the item itself via the stub alias (`@/components/ui/shuip/<cat-subdir>/<name>`), never via `./component.radix`. Consumers will use the stub path after `shadcn add`.
- `component.radix.tsx` must not import `@/components/ui/shuip/*` — circular. Import shadcn primitives via `@/components/ui/<name>`.
- The generator skips silently (warning only) any item folder missing `component.radix.tsx`. Watch the console output. An unsuffixed `component.tsx`, an example without a recognised base suffix, or a scan that finds zero items makes it fail instead.
