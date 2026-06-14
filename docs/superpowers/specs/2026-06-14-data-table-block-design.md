# DataTable block — design

## Goal

Ship one entity-agnostic, dual-mode `data-table` block for the shuip registry. A consumer drops in their entity type and column definitions and gets a working table — smooth client-side with zero config, or server-side with pagination/sorting/filtering driven by their backend. All per-entity knowledge lives in the column definitions; the components stay generic.

Built on TanStack Table v8, shadcn/ui primitives, Tailwind v4. No external table CSS, no design-system lock-in — it must drop into any shadcn project.

## Scope

In scope (v1):

- Generic `useDataTable<TData>` hook wrapping `useReactTable`, auto-selecting client vs server mode.
- `DataTable` rendering + composable sub-components: column header, toolbar, faceted filter, view options, pagination.
- Sorting, global search, per-column faceted filters (auto-generated from column `meta`), column visibility, row selection, column pinning.
- Client mode (all row models registered, zero config) and server mode (`manual*` flags + controlled state + `pageCount`).
- Empty / loading (skeleton) / no-results states.
- Three example previews: simple client-side, server-side, and a Twenty-like rich rendering example.
- A documented copy-paste recipe for URL state sync via nuqs.

Out of scope (v1):

- Advanced compound-filter toolbar (Linear/Notion-style filter builder, multi-column sort builder, command-palette filter entry). Deferred — roughly doubles surface area.
- Inline cell editing, keyboard cell navigation, drag-to-reorder columns, virtualization.
- A shipped nuqs URL-state file (see "URL state sync" — recipe instead).
- Shipping Badge/Avatar/status primitives (rich rendering is demonstrated in examples, not shipped as core).

## Repo prerequisites

Done before the block itself, because the block depends on them:

1. **`packages/ui/src/components/ui/table.tsx`** — the shadcn New York `table` primitive. Currently absent from `packages/ui`. `component.tsx` imports it via `@/components/ui/table`, which `generate.ts` auto-detects as `registryDependencies: ["table"]` so consumers install the shadcn primitive.
2. **`@tanstack/react-table`** added to root `package.json` → `workspaces.catalog`, then referenced as `"catalog:"` from `packages/registry`.
3. No `dropdown-menu` primitive exists in shuip. View-options and header menus are built on the existing **`popover` + `command`** primitives, consistent with the faceted filter. No new primitive is introduced.

## Item structure

```
packages/registry/items/blocks/data-table/
  component.tsx          whole system, multiple named exports, generic <TData>
  default.example.tsx    client-side "smooth", zero config
  server.example.tsx     server-side (manual pagination/sorting/filtering + pageCount, simulated backend)
  rich.example.tsx       Twenty-like: typed cells (status pill, avatar, chips), sticky/pinned columns
apps/docs/content/blocks/data-table.mdx   doc page + URL-sync recipe (NOT index.mdx — blocks doc flow)
```

`data-table` is a `blocks` item: type `registry:block`, no name prefix, docs as a real MDX file under `content/blocks/` (per the blocks doc flow — no `index.mdx` in the item folder).

## Component architecture (`component.tsx`)

Everything generic over `TData`. Sub-components receive the `Table<TData>` instance, never raw rows, so they hold no entity-specific code.

### `useDataTable<TData>(options)`

Wraps `useReactTable` and selects the mode:

- **Client mode (default):** registers `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`, `getFacetedRowModel`, `getFacetedUniqueValues`. The table does all the work in memory. Zero backend wiring required.
- **Server mode:** triggered by passing `pageCount`. Sets `manualPagination`, `manualSorting`, `manualFiltering`; state (`pagination`, `sorting`, `columnFilters`, `globalFilter`) is controlled via props with `on*Change` callbacks; only `getCoreRowModel` is registered.

Common: configurable `getRowId` (so row selection survives pagination/sorting/refetch), resets `pageIndex` to 0 on filter change. Returns `{ table }`.

### Rendering + sub-components

- **`DataTable({ table, children })`** — renders `<Table>` markup from `table.getHeaderGroups()` / `table.getRowModel()` via `flexRender`. Slots `children` (toolbar above, pagination below). Handles empty / loading (skeleton rows) / no-results-after-filter states. Owns no business logic.
- **`DataTableColumnHeader`** — per-column sort toggle (asc → desc → clear) + "hide column" action. Reads `column.getCanSort()` / `getToggleSortingHandler()` / `getIsSorted()`.
- **`DataTableToolbar`** — global search input + per-column faceted filters auto-generated from `meta.variant` / `meta.options` + a "Reset" button when filters are active + `DataTableViewOptions`.
- **`DataTableFacetedFilter`** — multi-select popover (command list) for one column; counts from `column.getFacetedUniqueValues()` (client) or `meta.options[].count` (server). Filter value is a string array.
- **`DataTableViewOptions`** — column visibility toggle; lists only `column.getCanHide()` columns.
- **`DataTablePagination`** — selected-row count, page-size select, page index display, first/prev/next/last buttons.

### The `meta` convention (the agnosticism pivot)

Declaration merging on TanStack's `ColumnMeta` carries all entity-specific config so the toolbar/filters/visibility derive automatically:

```ts
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    placeholder?: string
    variant?: 'text' | 'number' | 'date' | 'select' | 'multiSelect'
    options?: { label: string; value: string; icon?: React.FC; count?: number }[]
    icon?: React.FC
  }
}
```

The toolbar does `table.getAllColumns().filter(c => c.getCanFilter())` and switches on `meta.variant` to render the right control. Adding a new table = writing column defs only.

### Column pinning

Supported in core via `enableColumnPinning` + `column.getIsPinned()` → sticky CSS offsets. Light to add in TanStack, carries the Twenty-like rich example, opt-in (off by default).

## Cells — essential, composable

The core ships no cell primitives. Rich rendering (status pills, avatars, chips, sticky columns — Twenty-like) is demonstrated in `rich.example.tsx` via inline `cell` render functions in Tailwind, to give consumers ideas without imposing a design. Consumers supply their own `cell`/`render` per column, exactly as in the reference CRMs (kodex/edik).

## URL state sync — documented recipe, not a shipped file

Rationale: `generate.ts` scans only `component.tsx` for dependencies, and `extras/` files are always installed. A nuqs hook in `extras/` would land an always-installed file importing an undeclared `nuqs` on every consumer — a TS error for those who use plain `useState`. A second registry item would force a non-visual entry into the `/blocks` gallery.

So: server mode lives in the core (driven by controlled state). URL sync ships in v1 as a **copy-paste recipe in `data-table.mdx`**: a `useDataTableUrlState` built on nuqs that produces exactly the `{ pagination, sorting, columnFilters, on*Change }` shape `useDataTable` expects, with install notes (`bun add nuqs`, wrap app in `<NuqsAdapter>`). Opt-in, zero pollution for `useState` users. The recipe wires the smoothness knobs that separate a janky server table from a smooth one: `shallow`, `debounceMs` for filter text, `throttleMs` for pagination, `startTransition`.

## Data flow

```
consumer columns + data + (optional) controlled state
        │
        ▼
   useDataTable<TData>  ──client──▶ row models compute in memory
        │              ──server──▶ manual flags; consumer fetches on state change
        ▼
   Table<TData> instance ──▶ DataTable / Toolbar / Pagination / etc. (read instance API only)
```

## Reuse from reference projects

- **edik** — dual-mode pattern (one component, client or server), server pagination utilities, the controlled-state shape. The backbone.
- **kodex** — `meta.label`, toolbar slots, custom search accessor, distinct empty vs filtered-empty states.
- **twenty-fields** — dense/spreadsheet aesthetic, sticky/pinned columns, field-type-driven cell rendering, checkbox row selection. Demonstrated in `rich.example.tsx`.
- **shadcn/diceui reference** — the canonical 6-component decomposition and the typed `meta` convention as the automatic-toolbar pivot.

## Production-quality guards (built in, not afterthoughts)

- Stable `columns`/`data` references (memoization) to avoid instance re-creation loops.
- `getRowId` set so selection survives pagination/sort/refetch.
- `pageCount` required in server mode; pagination resets to page 0 on filter change.
- Empty / loading / no-results states handled, not bare tables.
- Faceted counts and a visible "reset filters" affordance.

## Testing

No test runner is configured in this repo, and adding one is out of scope here. Verification is the authoritative type gate plus the doc build:

- `bun registry:generate` — confirms the item is scanned and `[generate] N items processed` increases; check `registryDependencies` includes `table` and `dependencies` includes `@tanstack/react-table`.
- `bun build:docs` end-to-end (with `NODE_OPTIONS=--max-old-space-size=6144` if low RAM) — `next build` is the authoritative type gate; the three examples must compile and render in the docs.
- Manual check of the three previews in `/blocks/data-table`: client sort/filter/search/visibility/selection; server mode paginating against a simulated backend; rich example with pinned columns and typed cells.
