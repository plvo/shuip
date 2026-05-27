# Design — `/components` gallery + top-level routing split

**Date:** 2026-05-27
**Status:** Approved (design), pending implementation plan

## Goal

Surface every published shuip item on a dedicated `/components` landing page
that shows each item's default-example preview inside a card, grouped by
category. Improve `/blocks` the same way (preview in each card). Split the
current `/docs/*` routing so items live under their own top-level route.

Routing change:

- `/docs` — guides only
- `/components` — all items (was `/docs/components`, `/docs/react-hook-form`, …)
- `/blocks` — blocks (unchanged location, improved cards)

## Decisions

- **Scope of `/components`:** all item categories move there — `components`,
  `react-hook-form`, `tanstack-form`, `tanstack-query`. `/docs` keeps only the
  guide pages.
- **`/components` gallery layout:** grouped by category (section title + grid,
  `md:grid-cols-2 lg:grid-cols-3`). Items are small, a grid fits.
- **`/blocks` gallery layout:** single column (`flex flex-col gap-6`),
  full-width stacked cards with a larger preview area. Blocks are large
  (kanban, responsive-dialog); stacking shows more and avoids responsive
  cramming.
- **Preview rendering:** lazy on scroll. Each card mounts its preview only when
  it enters the viewport (`IntersectionObserver`), so we never mount ~40 heavy
  React trees (maps, dnd, date pickers) on load.
- **Approach:** new fumadocs `components` collection parallel to `docs`/`blocks`
  (chosen over a custom React route, which would not change item URLs).

## Architecture

Three parallel fumadocs collections:

| Route         | Collection             | `dir`                | Content                                                         |
|---------------|------------------------|----------------------|----------------------------------------------------------------|
| `/docs`       | `docs` (trimmed)       | `content/docs`       | index, configuration, installation, contribution, changelog    |
| `/components` | `components` (new)     | `content/components` | components, react-hook-form, tanstack-form, tanstack-query      |
| `/blocks`     | `blocks` (unchanged)   | `content/blocks`     | blocks                                                          |

Item URLs change, e.g. `/docs/components/copy-button` →
`/components/components/copy-button`,
`/docs/react-hook-form/input-field` → `/components/react-hook-form/input-field`.

## Changes

### 1. Generator (source of truth)

`packages/registry/scripts/generate.ts`: retarget the doc-symlink output from
`content/docs` to `content/components`. The `DOCS_CONTENT_DIR` constant becomes
`COMPONENTS_CONTENT_DIR = path.resolve(ROOT, '../../apps/docs/content/components')`.
`writeDocSymlinks` then creates each item's `.mdx` symlink and the per-category
`.gitignore` under `content/components/<cat>/`. Blocks have no `index.mdx` and
are unaffected; no other category remains under `/docs`.

### 2. Content migration (one-shot, committed)

- `git mv apps/docs/content/docs/tanstack-form/overview.mdx
  apps/docs/content/components/tanstack-form/overview.mdx` — this is a real
  hand-written file (~4.9K), not a symlink.
- Remove the now-stale category dirs under `content/docs/`:
  `components/`, `react-hook-form/`, `tanstack-form/`, `tanstack-query/`
  (their symlinks are regenerated under `content/components/`, their committed
  `.gitignore` files go with them).
- `content/docs/meta.json`: drop the item sections; keep
  `["index","configuration","installation","contribution","changelog"]`.
- New `content/components/meta.json` (committed): `root: true`, `title:
  "Components"`, pages with the existing separators + globs, prefixed by the
  landing page:
  ```json
  [
    "index",
    "---COMPONENTS---", "...components",
    "---REACT HOOK FORM---", "...react-hook-form",
    "---TANSTACK QUERY---", "...tanstack-query",
    "---TANSTACK FORM---", "...tanstack-form/overview", "...tanstack-form"
  ]
  ```
- New `content/components/index.mdx` (committed): `title: Components`, renders
  `<ComponentsGallery />`.

### 3. Source / config wiring

- `apps/docs/source.config.ts`: add
  `export const components = defineDocs({ dir: './content/components', ...defaultOptions })`.
- `apps/docs/src/lib/source.ts`:
  - add `componentsSource = loader({ baseUrl: '/components', source: components.toFumadocsSource(), icon })`;
  - `allPages()` includes `componentsSource.getPages()`;
  - extend the `getPageImage` / `getLLMText` source type unions with
    `componentsSource`.
- `apps/docs/src/components/docs-page-base.tsx`: `DocsPageType` becomes
  `'docs' | 'blocks' | 'components'`; resolve the source via a map keyed by
  `docsType` instead of the two-way ternary (covers `DocsPageBase` and
  `generateDocsPageMetadata`).

### 4. App routes — `apps/docs/src/app/components/`

Mirror the existing `blocks/` subtree:

- `layout.tsx` — `DocsLayout` with `tree={componentsSource.pageTree}`.
- `not-found.tsx`.
- `[[...slug]]/page.tsx` — `<DocsPageBase docsType='components' props={props} />`
  + `generateStaticParams` + `generateMetadata`.
- `llms.mdx/[[...slug]]/route.ts`.
- `og/components/[...slug]/route.tsx`.

Search (`api/search/route.ts`) and `llms-full.txt` both build from
`allPages()`, so they pick up the new collection automatically.

### 5. `<ComponentsGallery>` (new)

`apps/docs/src/components/components-gallery.tsx`:

- Source: `componentsSource.getPages().filter((p) => p.data.registryName)` —
  the landing `index.mdx` and `tanstack-form/overview.mdx` have no
  `registryName`, so they are naturally excluded.
- Group by `page.slugs[0]` (the category segment). Render in a fixed category
  order, each section = a heading + a `grid md:grid-cols-2 lg:grid-cols-3`
  of cards.
- Card = `<Link href={page.url}>` containing a preview region (fixed height,
  `overflow-hidden`, `pointer-events-none`) above the title and description.
- Category label map: `components → Components`, `react-hook-form → React Hook
  Form`, `tanstack-form → Tanstack Form`, `tanstack-query → Tanstack Query`.

### 6. `<LazyPreview>` (new)

`apps/docs/src/components/lazy-preview.tsx`, client component:

- Wraps the existing `Preview` (`item-preview.tsx`, already
  `React.lazy` + `Suspense`) in an `IntersectionObserver` gate.
- Mounts `<Preview registryName={...} />` only once the wrapper has entered the
  viewport, so the dynamic import fires on scroll-in rather than at page load.
- Used by both `<ComponentsGallery>` and `<BlocksList>`. The
  `registryName` passed is `${page.data.registryName}.example` (the default
  example, the same key `ItemHeader` already renders).

### 7. `/blocks` improvement

`apps/docs/src/components/blocks-list.tsx`:

- Filter `blocksSource.getPages()` by `p.data.registryName` (drops the
  "Overview" index page).
- Switch the container to `flex flex-col gap-6` (single column, full-width
  stacked cards).
- Each card gains a larger preview region (generous fixed height,
  `overflow-hidden`) via `<LazyPreview registryName={`${p.data.registryName}.example`} />`,
  keeping title + description.

### 8. Navigation & misc

- `apps/docs/src/lib/layout.shared.tsx`: add nav link
  `{ text: 'Components', url: '/components', on: 'nav' }` between Documentation
  and Blocks.
- `apps/docs/src/app/(home)/page.tsx`: add a `/components` link next to `/docs`.

## Out of scope

- No test runner is configured in the repo. Verification stays build + manual.
  Adding a test harness for the generator is out of scope for this change.
- No backward-compat redirects from old `/docs/<cat>/<name>` URLs (not
  requested; confirm with Pelavo if SEO/links matter).

## Verification

1. `bun registry:generate` — confirm `N items processed` and that symlinks +
   `.gitignore` now appear under `apps/docs/content/components/<cat>/`.
2. `bun build:docs` — full end-to-end build passes.
3. Manual:
   - `/components` — grouped sections, previews mount on scroll.
   - an item page, e.g. `/components/components/copy-button`.
   - `/blocks` — full-width stacked cards with previews.
   - `/docs` — guides only, no item categories in the sidebar.
   - cmd+k search resolves to `/components/...` URLs.
