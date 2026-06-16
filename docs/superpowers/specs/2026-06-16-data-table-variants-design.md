# Data Table — UI/UX variants design

Status: approved (design + build method), 2026-06-16
Branch: `feat/data-table-block` · Item: `packages/registry/items/blocks/data-table/`

## Goal

Give the composable data-table kit per-zone UI/UX variants, exposed shadcn-style
through `variant` props on the relevant sub-components. The kit stays a single
registry block (entity-agnostic, dual-mode client/server). Pure-styling variants
go through `cva`; variants that change structure or interaction use conditional
rendering.

## Scope — four zones

### 1. Pagination (split by semantics)

Page-based variants are pure presentation of the existing TanStack pagination
state — one `variant` prop:

```tsx
<DataTablePagination variant="simple" | "numbered" />
```

- `simple` — arrows + "Page X of Y" + rows-per-page (current behaviour, cleaned).
- `numbered` — numbered pages with truncation (`1 … 4 5 6 … 20`), active page
  `bg-primary text-primary-foreground`, siblings `ghost`, ellipsis `muted`,
  `size-8` hit targets, `tabular-nums`. Rows-per-page optional on the left.

Progressive loading changes the data model (accumulate rows instead of paging),
needs `onLoadMore` / `hasMore`, and "page" stops meaning anything — so it is a
separate component, not a pagination variant:

```tsx
<DataTableLoadMore mode="button" | "infinite" onLoadMore hasMore isLoading />
```

- `button` — centered "Load more" outline button + "Showing N of M" muted text.
- `infinite` — sentinel + `IntersectionObserver`, bottom mini-spinner while
  loading, "All caught up" when `hasMore` is false.

### 2. Toolbar / filters — `<DataTableToolbar variant>`

- `default` — current (search + inline faceted filters + View options).
- `inline-chips` — row 1: search + filter triggers; row 2: active filters as
  removable chips (`secondary`, `rounded-full`, X on hover) + "Clear all".
- `minimal` — search + View only, no faceted filters.

### 3. Empty state

Keep `emptyState?: ReactNode` on `<DataTable>` for full composability, and add a
ready-made brick to drop into it:

```tsx
<DataTableEmpty variant="text" | "illustrated" | "with-action"
  title description icon action />
```

- `illustrated` — lucide icon in a `bg-muted/50 size-12` circle, title +
  subtext, vertical rhythm, `text-balance`.
- `with-action` — illustrated + a button (auto "Reset filters" when filtered,
  else custom CTA).

### 4. Loading — `loadingVariant` on `<DataTable>`

- `skeleton` — current (skeleton bars per cell, `pageSize` rows).
- `overlay` — keep previous rows, dim them (`opacity-60 pointer-events-none`),
  centered spinner over `bg-background/60 backdrop-blur-[1px]`. Best for server
  mode: no context flash on refetch.
- `shimmer` — skeleton with an animated gradient sweep + `prefers-reduced-motion`
  fallback (crossfade / static).

## Styling principles (impeccable)

- Body/placeholder text ≥ 4.5:1 contrast; no light-gray-on-tint.
- Use existing shuip/shadcn tokens (`bg-primary`, `text-muted-foreground`, …),
  no hardcoded colors.
- Motion: ease-out, no bounce; every animation has a reduced-motion alternative.
- No nested cards, no side-stripe accents, semantic z-index for the overlay.

## Build method

Real components in the registry (no throwaway mockups). After each zone, run the
docs dev server and screenshot every variant to verify styling against the
impeccable rules, iterate, then commit.

## Verification

- `bunx tsc --noEmit` clean (registry + docs) apart from the known `baseUrl`
  TS5101 deprecation.
- `bunx biome check` clean on touched files.
- `bun registry:generate` still processes the item; examples render.
- Visual screenshot pass per variant.

## Open notes

- No test runner configured in the repo; verification is type-check + biome +
  visual screenshots. Propose a runner separately if unit tests are wanted.
- This design doc can be excluded from the final PR if undesired.
