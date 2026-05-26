# Kanban block — design

Date: 2026-05-26
Status: approved (brainstorming)
Item: `packages/registry/items/blocks/kanban/` (category `blocks`, registry name `kanban`)

## Goal

A generic, reusable kanban board published as a shuip block. Everything is modular:
columns and their names, the data type (`T`), search, and which properties show on a card —
all driven by the consumer's typed data model.

## Context — what already exists

Both source projects build domain- and backend-coupled boards with `@dnd-kit`:

- **edik** — `src/domains/need/components/needs-kanban.tsx`: dynamic columns from a
  reference list, drag = status change only (no intra-column ordering), trpc mutation +
  invalidation, card hardcoded to `Need`. (`reference-list-table.tsx` shows the sortable
  ordering pattern with optimistic `setQueryData`.)
- **kodex** — three boards (`ticket-board.tsx`, `projects-kanban.tsx`, `deals-kanban.tsx`),
  ~800 lines near-duplicated. The ticket board is the most complete: intra + inter-column
  reordering with fractional positions, sprint filter, `closestCorners`.

Shared DNA: `@dnd-kit/core` + `sortable`, `PointerSensor` distance 8, columns = droppables /
cards = draggable(or sortable), `DragOverlay`, column header with count (+ aggregate),
archived/closed toggle, shadcn `Card` + `GripVertical`, tanstack-query + mutation.

**Key insight:** all four are coupled to a specific domain *and* to trpc/react-query/DB. A
shuip block cannot ship that. So the kanban must be **generic and controlled** — it receives
`data` + column config + card config + callbacks, and contains no server logic. The
"modular" axes map exactly onto a generic typed `Kanban<T>` API.

## Decisions (from brainstorming)

- **State contract:** hybrid controlled/uncontrolled (shadcn pattern). Works standalone from
  `defaultData`; if `data` + `onDataChange` are passed, the consumer drives.
- **Reordering:** inter *and* intra-column. Order is **implicit in the `data` array order**
  (no `position` field exposed); the consumer maps array order to their own persistence.
- **Card rendering:** declarative `fields` config (typed by `keyof T`) drives a default card,
  plus a `renderCard` escape hatch for full control.
- **Search:** internal global text search over `searchableFields`.
- **Extras (all included):** column count + `renderColumnSummary` slot, per-column color accent,
  `onCardClick`, `onCardAdd` (+ button).
- **Verification:** `bun build:docs` (typecheck + build) + manual browser preview. No test
  runner is added (consistent with the repo; project CLAUDE.md says propose a setup first).

## Public API

```ts
type KanbanColumn = {
  id: string;
  label: string;
  color?: string; // CSS color/token for the accent strip — applied via inline style (see Styling)
};

type KanbanField<T> = {
  key: keyof T;
  label?: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

type KanbanProps<T extends Record<string, unknown>> = {
  columns: KanbanColumn[];

  // Data — hybrid: controlled when `data` is provided, else internal from `defaultData`
  data?: T[];
  defaultData?: T[];
  onDataChange?: (next: T[]) => void;

  // Identity + column read from each item
  idField?: keyof T;     // default 'id'
  columnField: keyof T;  // required: which field holds the column id

  // Card rendering (declarative config + escape hatch)
  titleField?: keyof T;
  fields?: KanbanField<T>[];
  renderCard?: (item: T) => React.ReactNode;

  // Internal global text search
  searchableFields?: (keyof T)[];
  searchPlaceholder?: string;

  // Extras
  renderColumnSummary?: (items: T[], column: KanbanColumn) => React.ReactNode;
  onCardClick?: (item: T) => void;
  onCardAdd?: (columnId: string) => void;

  // Semantic move event (fired alongside onDataChange)
  onCardMove?: (e: { item: T; fromColumn: string; toColumn: string; toIndex: number }) => void;

  className?: string;
};
```

- Moving a card = `{ ...item, [columnField]: toColumn }`. No `setColumnId` for the consumer to write.
- `onDataChange(next)` is the primary mechanism; `onCardMove` is a convenience for firing a
  single mutation without diffing the array.

## Internal architecture (single `component.tsx`)

- **`Kanban<T>`** — orchestrator. Internal `items` state seeded from `data ?? defaultData`; an
  effect resyncs from `data` when the prop changes *and no drag is in progress* (avoids the card
  jumping mid-drag). DnD operations mutate `items` locally; on drop, emit `onDataChange(items)` +
  `onCardMove(...)`. Holds `query` (search) and `activeId` (overlay). Derives `itemsByColumn`
  (filtered by `query` — search is purely visual, never mutates `items`).
- **`KanbanColumnView`** — `useDroppable({ id: column.id })`. Header = label + count +
  `renderColumnSummary?` + `+` button (`onCardAdd`). Color accent strip if `color`.
  `SortableContext` (column's ids, `verticalListSortingStrategy`). Empty-state placeholder,
  still droppable.
- **`KanbanCard`** — `useSortable({ id, data: { columnId } })`. `GripVertical` handle. Renders
  `renderCard?` if given, else default = title (`titleField`) + `fields` list
  (`render?(value, item) ?? String(value)`). `onClick` → `onCardClick?(item)` (click vs drag via
  the 8px distance constraint).

### DnD logic (the hard part — multi-container sortable)

- Sensors: `PointerSensor` (distance 8) + `KeyboardSensor` (`sortableKeyboardCoordinates`).
- `collisionDetection={closestCorners}`.
- `onDragStart` → set `activeId`.
- `onDragOver` → if hovering a different column (or a card in another column), move the item
  between columns in `items` live (rewrite `columnField`) for immediate visual feedback.
- `onDragEnd` → compute final index in the target column via `arrayMove`, finalize `items`, emit
  `onDataChange(next)` + `onCardMove(...)`, reset `activeId`.
- `onDragCancel` → reset.
- `DragOverlay` → renders a `KanbanCard` of the active item (`shadow-lg`, slight rotation).

Risk: `onDragOver` cross-container moves + controlled-state resync is where bugs hide (flicker,
desync from parent). This is the standard dnd-kit multi-container pattern; treat with care and
validate with the controlled example.

### Naming

Exports `Kanban`; types `KanbanColumn`, `KanbanField`, `KanbanProps`. No `Factory`/`Manager`/`Wrapper`.

## Styling

- Theme tokens only (no hardcoded colors): `bg-card`, `border`, `text-foreground`,
  `text-muted-foreground`; drop-over → `bg-muted`; focus → `ring`.
- Layout: `flex flex-row gap-4 overflow-x-auto`; columns `w-72 shrink-0`; cards `gap-2`; search
  bar above the board.
- Column color accent via `style={{ backgroundColor: color }}` on a strip — **not** a dynamic
  Tailwind class (it would be purged). This is the only inline-style case, justified because
  `color` is arbitrary.

## Dependencies

- External (auto-detected → block `dependencies`): `@dnd-kit/core`, `@dnd-kit/sortable`,
  `@dnd-kit/utilities`.
- `registryDependencies` (shadcn primitives via `@/components/ui/*`): `card`, `input`, `button`,
  `badge` (confirm they exist in `packages/ui` during planning).
- Catalog setup: `@dnd-kit/*` is not in the monorepo. Add the 3 packages to the root
  `workspaces.catalog` and reference them as `catalog:` from `apps/docs` **and**
  `packages/registry` so previews compile and types resolve. (`lucide-react` is already cataloged.)

## Examples (registry requires default + ≥1 variant)

- `default.example.tsx` — typed "tasks" dataset (`{ id, title, assignee, priority, points,
  status }`), 3–4 columns with `color`, declarative `fields`, `searchableFields`,
  `renderColumnSummary` (count), `onCardAdd` + `onCardClick`. **Uncontrolled** (`defaultData`) so
  it works standalone. Import via the stub `@/components/block/shuip/kanban`.
- `custom-card.example.tsx` — **controlled** (`useState` + `onDataChange`) + `renderCard` escape
  hatch (a "deal" card with formatted value) + `renderColumnSummary` summing values.

## Docs

`apps/docs/content/blocks/kanban.mdx` (real MDX — **never** an `index.mdx` in the item folder,
which would create a dead symlink under `content/docs/blocks/`). Frontmatter `title` /
`description` / `registryName: 'kanban'`. Body: `<ItemExamples registryName={'kanban'} />` and a
`<TypeTable>` for props.

## Verification

1. `bun registry:generate` — confirm `N items processed` increments by 1, stub at
   `stubs/blocks/kanban.tsx`, no symlink for a block, correct `dependencies` /
   `registryDependencies` in `registry.json`.
2. `bun build:docs` — typecheck + registry build + next build.
3. Manual browser preview: drag inter-column, drag intra-column, search filtering, controlled
   example syncs with parent state.

## Out of scope (YAGNI for v1)

- Collapsible / hideable columns, archived toggle.
- Per-field structured filters (only global text search).
- Built-in card detail dialog or add-card form (consumer wires `onCardClick` / `onCardAdd`).
- Fractional position field in the public API (order is array-implicit).
