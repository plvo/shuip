# Data board block — design

Date: 2026-08-30
Status: approved (brainstorming)
Item: `packages/registry/items/blocks/data-board/` (category `blocks`, registry name `data-board`)

## Goal

A board that renders any array of typed items into draggable columns, and that stays usable
when the array is large: bounded height with sticky column headers, optional horizontal
grouping into bands, per-column pagination, hideable columns, and a persisted view.

`data-board` is to a board what `data-table` is to a table — the same data-driven, entity-agnostic
contract, applied to a different surface. The existing `kanban` block is **not touched**: it stays
the small, focused option (columns + drag, ~415 lines). Consumers who need more reach for
`data-board`.

## Context

### What `kanban` deliberately left out

The `kanban` design (`docs/superpowers/specs/2026-05-26-kanban-block-design.md`) lists under
"Out of scope (YAGNI for v1)": *collapsible / hideable columns*, *archived toggle*. It also has no
notion of height — a board's height is that of its tallest column, so a 60-card board runs several
screens long and the column headers leave the viewport on the first scroll. You lose track of which
column you are in as soon as you scroll down.

That is exactly the gap `data-board` fills. Two items is the right answer here rather than growing
`kanban`: the small board is a legitimate choice for a 20-card list, and its API stays free of
five props that would only ever be `undefined`.

### Prior art

A private downstream project ran this exact refactor on a vendored copy of the `kanban` block
across nine boards, and the result is proven in production use. The valuable part is not the
feature list — it is the set of non-obvious correctness fixes at the intersection of pagination,
grouping and drag-and-drop (see "Pure helpers" below). Those are ported as-is.

Three things from that codebase are explicitly **not** ported: French UI strings, `text-success` /
`text-warning` classes (tokens that do not exist in shuip), and the removal of the built-in search
(dropped there because no downstream board used it — not a reason that applies to a public item).

## Decisions

### D1 — Bounded height, per-column scroll

The board has a finite height. Column headers form a sticky band that never scrolls; each column
is its own vertical scroll container.

By default no height is imposed: the root is `flex min-h-0 flex-col` and fills whatever height its
parent gives it. A page that occupies the viewport therefore produces a board that occupies the
viewport, with no hardcoded `calc()` and without the block needing to know the page chrome around
it. The tradeoff is explicit and documented: a page that wants this must put `flex flex-col` plus a
height on its container.

`height?: number | string` bounds the board where the parent constrains nothing. A number is read
as pixels.

### D2 — Column icon and accent, no shipped palette

```ts
type DataBoardColumn = {
  id: string;
  label: string;
  icon?: LucideIcon;          // default: CircleDashed
  accentClassName?: string;   // applied to the icon
};
```

The header becomes `[icon] [label] [count]`, then on the right the optional summary, the add
button, and the hide button that only appears on hover or focus.

`kanban`'s `color?: string` (an arbitrary CSS color applied via inline style) is **not** carried
over. A registry block must not impose a palette, and shuip's token set is the standard shadcn one
plus `--chart-1..5` — there is no `--success` or `--warning` to map a fixed tone scale onto.
`accentClassName` hands that decision to the consumer, who applies their own tokens. The MDX
documents the recipe for a semantic five-state look.

A full badge per column saturates the header row; a colored icon is what keeps a five-column board
with a summary and two action buttons readable.

### D3 — Generic grouping into bands

```ts
type DataBoardGroup = { id: string; label: string };

groupBy?: {
  field: keyof T;
  label?: (value: unknown) => string;
  description?: (value: unknown) => React.ReactNode;
  groups?: DataBoardGroup[];
  defaultCollapsed?: (groupId: string) => boolean;
};
```

The block only knows the chain: value → group id → label. It has no idea what a sprint, an
assignee or a priority is; `field: 'sprint'` is one use among others.

The group id is `String(value)`. `null` and `undefined` fall into a `__none__` group rendered last
and labelled by `labels.ungrouped`. Without an explicit `groups`, order is derived from the values
present — sorted numerically when they are all numeric, alphabetically otherwise, `__none__` always
last. With `groups`, that array imposes the order and keeps empty groups visible.

**Layout** — groups are horizontal bands: the band title spans the full width, and under it the
columns resume their grid. Column headers stay sticky at the top of the board, band headers stay
sticky within the band scroller.

**Height** — the band scroller holds the whole set of bands; each band is sized by its content and
a band collapses on a click on its title. Combined with per-cell pagination (D4), a band of 80
cards does not push the others off screen.

**Moving** — dropping a card into another band emits the group change. The block writes the
band's *value* onto the item, not the band id: a board grouped by a numeric sprint expects the
number back, not `"3"`. Nothing is persisted; the block signals, the consumer decides.

### D4 — Per-column pagination

```ts
pageSize?: number | false;    // default 20; false disables pagination entirely
pageSizeOptions?: number[];   // default [10, 20, 50]
```

Outside grouping, each column shows at most `pageSize` cards and a "show more" button at the foot
of the column raises its own ceiling by one step. The ceiling is per column: expanding *Backlog*
does not touch *Done*.

In grouped mode the ceiling applies per cell (column × band) but the button is **one per band** and
raises all of its columns at once. One button per cell would put fifteen buttons on screen for a
five-column, three-band board.

A toolbar shows a page-size `Select` when `pageSizeOptions` holds more than one value.

### D5 — Hideable columns and a recall rail

The hide button (`EyeOff`) appears on hover or keyboard focus of a header. The column leaves the
grid and a vertical badge appears in a rail on the board's right edge, with the label, an `Eye`
icon and a `Tooltip` carrying its card count. A click returns it to its original position. The rail
takes no space when nothing is hidden.

Hiding every column is allowed and shows a message pointing at the rail.

Two modes, as everywhere else in shadcn: uncontrolled by default, or controlled via
`hiddenColumns` + `onHiddenColumnsChange` for a consumer driving this from its own toolbar.

A hidden column is not a valid drop target: its cards are not rendered, so they are not movable.
They are not lost — the rail badge's tooltip shows the count.

### D6 — Local view persistence

```ts
persistKey?: string;
```

Hidden columns, page size and collapsed bands are persisted to `localStorage` under
`shuip-data-board:<persistKey>`. Read in an effect after mount so SSR hydration does not diverge,
written synchronously, silent `try/catch` on corrupt storage or a full quota.

Named `persistKey` rather than `boardId` because that is what it is — the storage key. Without it,
nothing is persisted and the view starts fresh on every mount.

This is local and per-browser. A view preference shared across users is a product feature, not a
block feature.

### D7 — Search kept, and made overridable

`searchableFields?: (keyof T)[]` and the search input are kept from `kanban`, moved into the
toolbar next to the page-size select. It matches the raw stored value, not a custom-rendered label,
and filtering is purely visual — it never mutates the item list. Omit the prop to hide the input.

### D8 — Every string overridable

```ts
type DataBoardLabels = {
  empty: string;                          // 'No items'
  ungrouped: string;                      // 'Ungrouped'
  allColumnsHidden: string;               // 'All columns are hidden'
  searchPlaceholder: string;              // 'Search...'
  showMore: (remaining: number) => string;    // n => `Show ${n} more`
  pageSizeOption: (size: number) => string;   // n => `${n} per column`
  pageSizeLabel: string;                  // 'Cards per column'
  addToColumn: (label: string) => string;     // aria-label
  hideColumn: (label: string) => string;      // aria-label
  showColumn: (label: string) => string;      // aria-label
};

labels?: Partial<DataBoardLabels>;
```

A registry item consumed by an international audience cannot hardcode English any more than it can
hardcode French. Defaults are English; `labels` merges over them. The aria-labels are in the same
object — accessibility strings need translating too.

Group ordering uses `localeCompare` with **no** locale argument, so it follows the runtime locale
instead of pinning one.

### D9 — Corrections carried over from the prior art

Four fixes that apply to `data-board` and that `kanban` gets wrong today. They are **not**
backported to `kanban` in this work — that is a separate, deliberate decision.

- **`T extends object`** instead of `T extends Record<string, unknown>`. The current constraint is
  why the `kanban` doc has to tell readers "declare your item type with a `type` alias, not an
  `interface`" — a TypeScript `interface` does not satisfy an index-signature constraint. The
  documented wart disappears.
- **`<DndContext id={React.useId()}>`**. dnd-kit generates non-deterministic ids otherwise, which
  produces a server/client hydration mismatch in Next.js.
- **Drag gated on `onCardMove`.** Without a handler, a drag mutates local state that the
  consumer's next refetch silently discards. `draggable = onCardMove != null` makes a read-only
  board actually read-only, sortable handles included.
- **`cardClassName` and `wrapCard` escape hatches.** `wrapCard(item, card)` wraps a rendered card
  rather than replacing it — for a `ContextMenu`, a `Link`, a badge overlay. Deliberately *not*
  named `renderCard`, which the `kanban` design used for full replacement before shipping as
  `cardContent`: sitting next to `cardContent`, a `renderCard` would read as "replace", which is
  the opposite of what it does. `wrapCard` says what it does.

## Public API

```ts
type DataBoardColumn = {
  id: string;
  label: string;
  icon?: LucideIcon;
  accentClassName?: string;
};

type DataBoardGroup = { id: string; label: string };

type DataBoardGroupBy<T> = {
  field: keyof T;
  label?: (value: unknown) => string;
  description?: (value: unknown) => React.ReactNode;
  groups?: DataBoardGroup[];
  defaultCollapsed?: (groupId: string) => boolean;
};

type DataBoardField<T> = {
  key: keyof T;
  label?: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

type DataBoardMoveEvent<T> = {
  item: T;
  fromColumn: string;
  toColumn: string;
  toIndex: number;
  fromGroup?: string;
  toGroup?: string;
};

type DataBoardProps<T extends object> = {
  columns: DataBoardColumn[];

  // Data — hybrid: controlled when `data` is provided, else internal from `defaultData`
  data?: T[];
  defaultData?: T[];
  onDataChange?: (next: T[]) => void;

  idField?: keyof T;      // default 'id'
  columnField: keyof T;   // required

  // Card rendering
  title?: (item: T) => React.ReactNode;
  fields?: DataBoardField<T>[];
  cardContent?: (item: T) => React.ReactNode;
  cardClassName?: (item: T) => string | undefined;
  wrapCard?: (item: T, card: React.ReactNode) => React.ReactNode;

  // Column extras
  renderColumnSummary?: (items: T[], column: DataBoardColumn) => React.ReactNode;
  onCardAdd?: (columnId: string) => void;

  // Events
  onCardClick?: (item: T) => void;
  onCardMove?: (e: DataBoardMoveEvent<T>) => void;   // also gates drag

  // View
  searchableFields?: (keyof T)[];
  groupBy?: DataBoardGroupBy<T>;
  pageSize?: number | false;        // default 20
  pageSizeOptions?: number[];       // default [10, 20, 50]
  hiddenColumns?: string[];
  onHiddenColumnsChange?: (ids: string[]) => void;
  persistKey?: string;
  height?: number | string;

  labels?: Partial<DataBoardLabels>;
  className?: string;
};
```

Moving a card writes `{ ...item, [columnField]: toColumn }` (and `[groupBy.field]: bandValue` when
the band changed). `onDataChange(next)` is the primary mechanism; `onCardMove` is the convenience
for firing a single mutation without diffing the array.

## Internal architecture — single `component.tsx`

One file, in line with the sibling blocks (`data-table` 1584 lines, `calendar` 1389). Expect
~1000–1200 lines. A `shadcn add` should drop one file, and the registry generator only scans
`component.tsx` for dependencies — splitting into siblings under `extras/` would land them in a
different install directory *and* silently drop their `registryDependencies`.

Sections in a fixed order:

1. **Types** — everything in the Public API block above.
2. **Pure helpers** — no DOM, no React. See below.
3. **`useDataBoardView`** — hidden columns (controlled/uncontrolled), page size, revealed steps
   per key, collapsed bands, plus `localStorage` persistence.
4. **`useDataBoardDrag`** — the live item list and the drag state machine that mutates it.
   Optimistic reordering on hover; `onCardMove` fires on drop and only when the position actually
   changed.
5. **Subcomponents** — `DataBoardToolbar`, `DataBoardColumnHeader`, `DataBoardColumnBody`,
   `DataBoardBand`, `DataBoardCard`, `DataBoardCardFace`, `DataBoardHiddenRail`. Exported, as
   `data-table` exports its parts.
6. **`DataBoard<T>`** — orchestration, `DndContext`, assembling columns × bands.

### Pure helpers

This is the testable core and where the port can break silently.

```ts
groupIdOf(value): string
buildGroups<T>(items, groupBy): { id, label, value, items }[]
paginate<T>(items, limit): { shown: T[], hidden: number }
limitFor(pageSize, revealed): number
visibleColumns(columns, hidden): DataBoardColumn[]
dropZoneId(columnId, groupId?) / parseDropZoneId(id)
resolveDropTarget({ overId, zones, overItem }): { columnId, groupId? } | null
isSamePosition(move): boolean
withActiveCard<T>(all, shown, hidden, activeId, getId): { rendered, remaining }
withPinnedBands<T>(bands, pinned): bands
revealStepsFor(pageSize, revealed, index): number
```

The last three are the non-obvious ones — each fixes a bug that only appears where pagination or
grouping meets drag-and-drop, and none of them is something you would write from first principles:

- **`withActiveCard`** — a card dragged out of its cell can end up outside the paginated slice. If
  it unmounts mid-drag it vanishes from the screen until the next "show more", and dnd-kit loses
  its active node. Keeping it appended to the rendered slice preserves order, since `shown` is
  always a prefix of `all`.
- **`withPinnedBands`** — a band emptied mid-drag would disappear under the cursor: the layout
  jumps, dnd-kit's measurements go stale, and the card can no longer return to its original band.
  Bands present at drag start stay rendered (empty, in place) until the drag ends. A band born
  during the drag is still added.
- **`revealStepsFor`** — a card dropped past its target cell's paginated window would be invisible
  until the next "show more". This opens exactly enough steps to reveal it, and returns 0 when the
  card landed inside the window — the common case must not inflate the pagination.

### Pagination key

Flat mode paginates per column (`col:<id>`), grouped mode per band (`band:<id>`) so that one button
raises the whole band. `limitFor` turns a `(pageSize, revealed)` pair into a ceiling; `pageSize:
false` maps to `Infinity`, which `paginate` passes through untouched.

## Styling

Theme tokens only. `bg-card`, `bg-background`, `border`, `text-foreground`,
`text-muted-foreground`; drop-over → `border-border bg-muted/50`; focus → `ring`. The single
arbitrary-color escape is `accentClassName`, which is the consumer's own class string, never
interpolated into a Tailwind class name.

Columns are `w-72 shrink-0`; the board scrolls horizontally, each column scrolls vertically. The
column body keeps `p-1.5` of padding so a badge positioned at `-top-1.5 -right-1.5` on a card is
not clipped by the scrollport.

## Dependencies

- External: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `lucide-react` — all
  already in the root `workspaces.catalog` and referenced by `packages/registry` and `apps/docs`.
  Nothing to add.
- `registryDependencies` (auto-detected from `@/components/ui/*`): `card`, `button`, `input`,
  `select`, `tooltip`. All five exist in `packages/ui/src/components/ui/`.

## Testing

shuip has no test runner. The repo CLAUDE.md says to propose a setup before adding tests — this is
that proposal, and it is approved.

Add `vitest` at the root with a `test` script and a config that picks up
`packages/registry/**/*.test.ts`. Scope for this work: **the pure helpers only** — no DOM, no
jsdom, no `@testing-library/react`. That keeps the setup to one dev dependency and one config file
while covering the part of the port that can break silently.

`packages/registry/items/blocks/data-board/component.test.ts` covers:

- `buildGroups` derives groups from the values present; numeric sort when all values are numeric,
  alphabetical otherwise; `null` / `undefined` land in `__none__`, rendered last; an explicit
  `groups` imposes order and keeps an empty group.
- `paginate` reports the right hidden count; `Infinity` hides nothing.
- `visibleColumns` preserves the original order after unhiding.
- `resolveDropTarget` / `parseDropZoneId` round-trip, including a group id containing the
  separator.
- `isSamePosition` is false when only the band changed.
- `withActiveCard` appends the dragged card and decrements the remainder; no-ops when it is
  already in the slice.
- `withPinnedBands` keeps an emptied band in place and appends a band born mid-drag.
- `revealStepsFor` returns 0 inside the window, and the exact step count past it.

Development follows TDD: red test, code, green test.

Drag-and-drop itself is not tested — dnd-kit under jsdom needs a pointer simulation that tests
dnd-kit more than it tests this block. It is verified by dogfooding on the docs page.

A `*.test.ts` file inside an item folder must be invisible to the registry: the generator only
emits `component.tsx` plus a flat `extras/`, so a sibling test file is ignored by construction.
Verify this in step 1 of the plan rather than assuming it.

## Examples

Registry requires a default plus at least one variant. All import via the stub alias
`@/components/block/shuip/data-board`, never `./component`.

- **`default.example.tsx`** — flat mode, uncontrolled (`defaultData`). A typed task dataset, four
  columns with `icon` + `accentClassName`, declarative `fields`, `searchableFields`, `onCardAdd`,
  `onCardClick`, a small `pageSize` so "show more" is visible in the preview, and `height` so the
  bounded-height behaviour is the first thing a reader sees.
- **`grouped.example.tsx`** — the headline feature: `groupBy` on a sprint field, explicit `groups`
  for ordering, a `description` on the band, `defaultCollapsed` on the oldest sprint, and
  `persistKey` so hidden columns and collapsed bands survive a reload.
- **`custom-card.example.tsx`** — controlled (`useState` + `onDataChange`), `cardContent` for a
  fully custom card body, `cardClassName` keyed on the item, `wrapCard` wrapping the card in a
  link, and `renderColumnSummary` summing a value.

## Docs

`apps/docs/content/blocks/data-board.mdx` — a real MDX file in the `blocks` collection. **Never**
an `index.mdx` in the item folder: the generator would symlink it under `content/components/blocks/`,
which no collection reads, and the page would silently not appear.

Frontmatter `title` / `description` / `registryName: 'data-board'`. Body: prose,
`<ItemExamples registryName={'data-board'} />`, a `<TypeTable>` per type group (props, column,
groupBy, labels), plus two short sections that are load-bearing:

- **Sizing the board** — the `flex flex-col` + height contract on the parent, and when to reach for
  `height` instead.
- **Choosing between `kanban` and `data-board`** — a short, honest comparison so a reader landing on
  `/blocks` is not left guessing which of two boards to install.

The existing `kanban.mdx` gets one sentence pointing at `data-board` for larger boards. That is the
only edit to the `kanban` item in this work.

## Verification

1. `bun registry:generate` — `[generate] N items processed` increments by 1, no
   `skipping blocks/data-board` warning, stub at `packages/registry/stubs/blocks/data-board.tsx`,
   no MDX symlink (blocks have none), and `registry.json` shows the five expected
   `registryDependencies` and the three `@dnd-kit/*` dependencies.
2. `bun test` — helper tests green.
3. `bun check` — Biome clean.
4. `NODE_OPTIONS=--max-old-space-size=6144 bun build:docs` — the authoritative type gate.
5. Dogfood at https://docs.localhost:1355/blocks/data-board: drag inter-column, intra-column and
   inter-band; drag a card past a "show more" ceiling and confirm it stays visible; hide every
   column and recall from the rail; reload and confirm the persisted view; check both themes.

## Out of scope

- Any change to the `kanban` block beyond the one cross-reference sentence in its MDX.
- Virtual scrolling. Pagination answers the same problem for the volumes this targets.
- Server-side persistence of a view preference.
- A compound-component `<DataBoard.Column>` API. The config-driven contract mirrors `data-table`,
  which is the consistency that matters here.
- Component-level (jsdom) tests. The runner setup is intentionally minimal; adding
  `@testing-library/react` is its own decision.
- Multi-select or bulk card moves.
