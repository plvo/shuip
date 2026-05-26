# Kanban Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a generic, controlled/uncontrolled kanban board as the shuip block `kanban`, where columns, the data type `T`, search, and card properties are all driven by the consumer's typed data model.

**Architecture:** A single `component.tsx` exports `Kanban<T>` plus internal `KanbanColumnView`, `SortableCard`, `CardBody`. State is hybrid (controlled when `data` is passed, else internal from `defaultData`). Card order is implicit in the `data` array order. Drag-and-drop uses `@dnd-kit` with columns as droppables and cards as sortables; the move algorithm only preserves within-column ordering (cross-column flat position is irrelevant because cards render via per-column filter).

**Tech Stack:** React 19, TypeScript 6, `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`, Tailwind v4, shadcn primitives (`card`, `input`, `button`), `lucide-react`. No test runner — verification is `bun build:docs` + manual browser preview.

**Spec:** `docs/superpowers/specs/2026-05-26-kanban-block-design.md`

---

## File Structure

- Create `packages/registry/items/blocks/kanban/component.tsx` — the published block (all internal sub-components live here; block contract = one file).
- Create `packages/registry/items/blocks/kanban/default.example.tsx` — uncontrolled "tasks" preview using the `fields` config + search + count summary.
- Create `packages/registry/items/blocks/kanban/custom-card.example.tsx` — controlled "deals" preview using the `renderCard` escape hatch + value-sum summary.
- Create `apps/docs/content/blocks/kanban.mdx` — block doc (real MDX; **never** `index.mdx` in the item folder).
- Modify `package.json` (root) — add `@dnd-kit/*` to `workspaces.catalog`.
- Modify `apps/docs/package.json` and `packages/registry/package.json` — reference `@dnd-kit/*` as `catalog:` so previews compile and types resolve.

**Verification gates used below:**
- Per-task typecheck: `cd packages/registry && bunx tsc --noEmit` (per-workspace typecheck is supported; root `tsc --build` is not).
- Lint/format: `bun check` (Biome; also runs on commit via lint-staged).
- Final: `bun build:docs` (chains `registry:generate` → `registry:build` → `next build`) + manual browser preview.

> **Generic-type gotcha (applies to all examples):** define the data shape with a `type` alias, **not** an `interface`. An `interface` is not assignable to `Record<string, unknown>` (TS index-signature rule), so `Kanban<MyInterface>` fails to typecheck; `type MyShape = { ... }` works.

---

## Task 1: Add `@dnd-kit` to the catalog and wire consumers

**Files:**
- Modify: `package.json` (root, `workspaces.catalog`)
- Modify: `apps/docs/package.json` (`dependencies`)
- Modify: `packages/registry/package.json` (`dependencies`)

- [ ] **Step 1: Add the three packages to the root catalog**

In `package.json`, inside `workspaces.catalog`, add these entries (alongside the existing ones such as `lucide-react`):

```json
"@dnd-kit/core": "^6.3.1",
"@dnd-kit/sortable": "^10.0.0",
"@dnd-kit/utilities": "^3.2.2"
```

- [ ] **Step 2: Reference the catalog from `apps/docs`**

In `apps/docs/package.json`, inside `dependencies`, add:

```json
"@dnd-kit/core": "catalog:",
"@dnd-kit/sortable": "catalog:",
"@dnd-kit/utilities": "catalog:"
```

- [ ] **Step 3: Reference the catalog from `packages/registry`**

In `packages/registry/package.json`, inside `dependencies`, add:

```json
"@dnd-kit/core": "catalog:",
"@dnd-kit/sortable": "catalog:",
"@dnd-kit/utilities": "catalog:"
```

- [ ] **Step 4: Install**

Run: `bun install`
Expected: completes without "No catalog entry found" errors; `@dnd-kit/*` resolves in `apps/docs` and `packages/registry`.

- [ ] **Step 5: Commit**

```bash
git add package.json apps/docs/package.json packages/registry/package.json bun.lock
git commit -m "build(kanban): add @dnd-kit to catalog for the kanban block"
```

---

## Task 2: Scaffold the block — types + static board (no drag yet)

**Files:**
- Create: `packages/registry/items/blocks/kanban/component.tsx`
- Create: `packages/registry/items/blocks/kanban/default.example.tsx`

This task produces a visually complete, non-interactive board (columns, default card via `fields`, `renderCard` escape hatch, title, color accent, header with count + summary, `onCardClick`, `onCardAdd`, empty state). Drag is added in Task 4.

- [ ] **Step 1: Write `component.tsx` (static version)**

```tsx
'use client';

import * as React from 'react';
import { GripVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type KanbanColumn = {
  id: string;
  label: string;
  color?: string;
};

export type KanbanField<T> = {
  key: keyof T;
  label?: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

export type KanbanProps<T extends Record<string, unknown>> = {
  columns: KanbanColumn[];
  data?: T[];
  defaultData?: T[];
  onDataChange?: (next: T[]) => void;
  idField?: keyof T;
  columnField: keyof T;
  titleField?: keyof T;
  fields?: KanbanField<T>[];
  renderCard?: (item: T) => React.ReactNode;
  searchableFields?: (keyof T)[];
  searchPlaceholder?: string;
  renderColumnSummary?: (items: T[], column: KanbanColumn) => React.ReactNode;
  onCardClick?: (item: T) => void;
  onCardAdd?: (columnId: string) => void;
  onCardMove?: (e: { item: T; fromColumn: string; toColumn: string; toIndex: number }) => void;
  className?: string;
};

export function Kanban<T extends Record<string, unknown>>({
  columns,
  data,
  defaultData,
  idField = 'id' as keyof T,
  columnField,
  titleField,
  fields,
  renderCard,
  renderColumnSummary,
  onCardClick,
  onCardAdd,
  className,
}: KanbanProps<T>) {
  const getId = React.useCallback((item: T) => String(item[idField]), [idField]);
  const getColumn = React.useCallback((item: T) => String(item[columnField]), [columnField]);

  const [items, setItems] = React.useState<T[]>(() => data ?? defaultData ?? []);
  React.useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const itemsByColumn = React.useCallback(
    (columnId: string) => items.filter((it) => getColumn(it) === columnId),
    [items, getColumn],
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-row gap-4 overflow-x-auto pb-2">
        {columns.map((column) => {
          const columnItems = itemsByColumn(column.id);
          return (
            <KanbanColumnView
              key={column.id}
              column={column}
              count={columnItems.length}
              summary={renderColumnSummary?.(columnItems, column)}
              onAdd={onCardAdd ? () => onCardAdd(column.id) : undefined}
            >
              {columnItems.length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                  No items
                </p>
              ) : (
                columnItems.map((item) => (
                  <KanbanCardShell
                    key={getId(item)}
                    onClick={onCardClick ? () => onCardClick(item) : undefined}
                  >
                    <CardBody item={item} titleField={titleField} fields={fields} renderCard={renderCard} />
                  </KanbanCardShell>
                ))
              )}
            </KanbanColumnView>
          );
        })}
      </div>
    </div>
  );
}

function KanbanColumnView({
  column,
  count,
  summary,
  onAdd,
  children,
}: {
  column: KanbanColumn;
  count: number;
  summary?: React.ReactNode;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        {column.color ? <span className="size-2 rounded-full" style={{ backgroundColor: column.color }} /> : null}
        <span className="text-sm font-medium">{column.label}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
        {summary != null ? <span className="ml-auto text-xs text-muted-foreground">{summary}</span> : null}
        {onAdd ? (
          <Button variant="ghost" size="icon" className={cn('size-6', summary == null && 'ml-auto')} onClick={onAdd}>
            <Plus className="size-4" />
          </Button>
        ) : null}
      </div>
      <div className="flex min-h-24 flex-col gap-2 rounded-lg border border-transparent p-2">{children}</div>
    </div>
  );
}

function KanbanCardShell({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <Card className={cn('gap-0 py-0', onClick && 'cursor-pointer')} onClick={onClick}>
      <CardContent className="flex items-start gap-2 p-3">
        <span className="mt-0.5 text-muted-foreground">
          <GripVertical className="size-4" />
        </span>
        <div className="min-w-0 flex-1">{children}</div>
      </CardContent>
    </Card>
  );
}

function CardBody<T extends Record<string, unknown>>({
  item,
  titleField,
  fields,
  renderCard,
}: {
  item: T;
  titleField?: keyof T;
  fields?: KanbanField<T>[];
  renderCard?: (item: T) => React.ReactNode;
}) {
  if (renderCard) return <>{renderCard(item)}</>;
  return (
    <div className="space-y-1">
      {titleField ? <p className="truncate text-sm font-medium">{String(item[titleField] ?? '')}</p> : null}
      {fields?.length ? (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {fields.map((field) => {
            const value = item[field.key];
            return (
              <span key={String(field.key)} className="whitespace-nowrap">
                {field.label ? `${field.label}: ` : null}
                {field.render ? field.render(value, item) : String(value ?? '')}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
```

> `onDataChange`, `searchableFields`, `searchPlaceholder`, and `onCardMove` exist in `KanbanProps` but are intentionally not destructured yet — they are wired in Tasks 3–5. Leaving them out of the destructure avoids unused-variable lint noise in this intermediate task.

- [ ] **Step 2: Write `default.example.tsx`**

```tsx
'use client';

import * as React from 'react';
import { Kanban } from '@/components/block/shuip/kanban';

type Task = {
  id: string;
  title: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  points: number;
  status: string;
};

const columns = [
  { id: 'todo', label: 'To do', color: 'var(--color-muted-foreground)' },
  { id: 'in-progress', label: 'In progress', color: 'var(--color-blue-500)' },
  { id: 'done', label: 'Done', color: 'var(--color-green-500)' },
];

const tasks: Task[] = [
  { id: '1', title: 'Design the empty states', assignee: 'Ava', priority: 'medium', points: 3, status: 'todo' },
  { id: '2', title: 'Wire the search bar', assignee: 'Liam', priority: 'high', points: 5, status: 'todo' },
  { id: '3', title: 'Drag-and-drop sensors', assignee: 'Noah', priority: 'high', points: 8, status: 'in-progress' },
  { id: '4', title: 'Column color accents', assignee: 'Mia', priority: 'low', points: 2, status: 'in-progress' },
  { id: '5', title: 'Write the docs page', assignee: 'Ava', priority: 'medium', points: 3, status: 'done' },
];

export default function KanbanDefaultExample() {
  return (
    <Kanban<Task>
      columns={columns}
      defaultData={tasks}
      columnField="status"
      titleField="title"
      fields={[
        { key: 'assignee', label: 'Assignee' },
        { key: 'priority', label: 'Priority' },
        { key: 'points', render: (value) => `${String(value)} pts` },
      ]}
      searchableFields={['title', 'assignee']}
      searchPlaceholder="Search tasks..."
      renderColumnSummary={(items) => `${items.reduce((sum, t) => sum + t.points, 0)} pts`}
      onCardClick={(task) => console.log('open task', task.id)}
      onCardAdd={(columnId) => console.log('add card to', columnId)}
    />
  );
}
```

- [ ] **Step 3: Generate registry artifacts**

Run: `bun registry:generate`
Expected: output includes `[generate] N items processed` with N increased by 1, and **no** `[generate] skipping blocks/kanban: no component.tsx` warning. Confirm the stub exists:

Run: `test -f packages/registry/stubs/blocks/kanban.tsx && echo OK`
Expected: `OK`

- [ ] **Step 4: Typecheck**

Run: `cd packages/registry && bunx tsc --noEmit`
Expected: no errors. (`searchableFields` / `searchPlaceholder` are declared in props but unused so far — that is fine for TS; they are consumed in Task 3.)

- [ ] **Step 5: Lint**

Run: `bun check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/items/blocks/kanban/component.tsx packages/registry/items/blocks/kanban/default.example.tsx
git commit -m "feat(kanban): scaffold generic kanban block with static board"
```

---

## Task 3: Add internal global search

**Files:**
- Modify: `packages/registry/items/blocks/kanban/component.tsx`

- [ ] **Step 1: Import `Input` and `Search`**

At the top of `component.tsx`, add the import for the search icon to the existing `lucide-react` import and add the `Input` import:

```tsx
import { GripVertical, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
```

- [ ] **Step 2: Destructure search props and add query state**

In the `Kanban` function signature, add `searchableFields` and `searchPlaceholder` to the destructured props:

```tsx
  fields,
  renderCard,
  searchableFields,
  searchPlaceholder = 'Search...',
  renderColumnSummary,
```

Then, right after the `items` state/effect block, add the query state and the filtered list, and change `itemsByColumn` to read from `visible`:

```tsx
  const [query, setQuery] = React.useState('');

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchableFields?.length) return items;
    return items.filter((it) => searchableFields.some((f) => String(it[f] ?? '').toLowerCase().includes(q)));
  }, [items, query, searchableFields]);

  const itemsByColumn = React.useCallback(
    (columnId: string) => visible.filter((it) => getColumn(it) === columnId),
    [visible, getColumn],
  );
```

(Delete the previous `itemsByColumn` that filtered `items`.)

- [ ] **Step 3: Render the search bar**

Inside the returned JSX, immediately after `<div className={cn('flex flex-col gap-4', className)}>` and before the columns row, add:

```tsx
      {searchableFields?.length ? (
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      ) : null}
```

- [ ] **Step 4: Typecheck**

Run: `cd packages/registry && bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/items/blocks/kanban/component.tsx
git commit -m "feat(kanban): add internal global search over searchableFields"
```

---

## Task 4: Add drag-and-drop (inter + intra-column)

**Files:**
- Modify: `packages/registry/items/blocks/kanban/component.tsx`

This task replaces the static board with a fully functional `@dnd-kit` board: droppable columns, sortable cards with a grip handle, a `DragOverlay`, and an `onDragEnd` that reorders within and across columns, committing via `onDataChange` + `onCardMove`. After this task the component file is the canonical version below — replace the whole file with it.

- [ ] **Step 1: Replace `component.tsx` with the full drag-enabled version**

```tsx
'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type KanbanColumn = {
  id: string;
  label: string;
  color?: string;
};

export type KanbanField<T> = {
  key: keyof T;
  label?: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

export type KanbanProps<T extends Record<string, unknown>> = {
  columns: KanbanColumn[];
  data?: T[];
  defaultData?: T[];
  onDataChange?: (next: T[]) => void;
  idField?: keyof T;
  columnField: keyof T;
  titleField?: keyof T;
  fields?: KanbanField<T>[];
  renderCard?: (item: T) => React.ReactNode;
  searchableFields?: (keyof T)[];
  searchPlaceholder?: string;
  renderColumnSummary?: (items: T[], column: KanbanColumn) => React.ReactNode;
  onCardClick?: (item: T) => void;
  onCardAdd?: (columnId: string) => void;
  onCardMove?: (e: { item: T; fromColumn: string; toColumn: string; toIndex: number }) => void;
  className?: string;
};

export function Kanban<T extends Record<string, unknown>>({
  columns,
  data,
  defaultData,
  onDataChange,
  idField = 'id' as keyof T,
  columnField,
  titleField,
  fields,
  renderCard,
  searchableFields,
  searchPlaceholder = 'Search...',
  renderColumnSummary,
  onCardClick,
  onCardAdd,
  onCardMove,
  className,
}: KanbanProps<T>) {
  const getId = React.useCallback((item: T) => String(item[idField]), [idField]);
  const getColumn = React.useCallback((item: T) => String(item[columnField]), [columnField]);

  const [items, setItems] = React.useState<T[]>(() => data ?? defaultData ?? []);
  const draggingRef = React.useRef(false);
  const fromColumnRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (data && !draggingRef.current) setItems(data);
  }, [data]);

  const [query, setQuery] = React.useState('');
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchableFields?.length) return items;
    return items.filter((it) => searchableFields.some((f) => String(it[f] ?? '').toLowerCase().includes(q)));
  }, [items, query, searchableFields]);

  const itemsByColumn = React.useCallback(
    (columnId: string) => visible.filter((it) => getColumn(it) === columnId),
    [visible, getColumn],
  );

  const reorder = React.useCallback(
    (activeCardId: string, toColumn: string, overCardId: string | null): { next: T[]; toIndex: number } | null => {
      const item = items.find((it) => getId(it) === activeCardId);
      if (!item) return null;
      const moved = { ...item, [columnField]: toColumn } as T;
      const without = items.filter((it) => getId(it) !== activeCardId);
      const colItems = without.filter((it) => getColumn(it) === toColumn);

      let colIndex: number;
      if (overCardId && overCardId !== activeCardId) {
        const found = colItems.findIndex((it) => getId(it) === overCardId);
        colIndex = found < 0 ? colItems.length : found;
      } else {
        colIndex = colItems.length;
      }

      let flatIndex: number;
      if (colIndex < colItems.length) {
        flatIndex = without.findIndex((it) => getId(it) === getId(colItems[colIndex]));
      } else if (colItems.length > 0) {
        flatIndex = without.findIndex((it) => getId(it) === getId(colItems[colItems.length - 1])) + 1;
      } else {
        flatIndex = without.length;
      }

      const next = [...without];
      next.splice(flatIndex, 0, moved);
      return { next, toIndex: colIndex };
    },
    [items, getId, getColumn, columnField],
  );

  function handleDragStart(event: DragStartEvent) {
    draggingRef.current = true;
    const id = String(event.active.id);
    const startItem = items.find((it) => getId(it) === id);
    fromColumnRef.current = startItem ? getColumn(startItem) : null;
    setActiveId(id);
  }

  function handleDragEnd(event: DragEndEvent) {
    draggingRef.current = false;
    setActiveId(null);
    const { active, over } = event;
    const fromColumn = fromColumnRef.current;
    fromColumnRef.current = null;
    if (!over || fromColumn == null) return;

    const activeCardId = String(active.id);
    if (!items.some((it) => getId(it) === activeCardId)) return;

    let toColumn: string;
    let overCardId: string | null = null;
    if (columns.some((c) => c.id === String(over.id))) {
      toColumn = String(over.id);
    } else {
      const overItem = items.find((it) => getId(it) === String(over.id));
      if (!overItem) return;
      toColumn = getColumn(overItem);
      overCardId = String(over.id);
    }

    const result = reorder(activeCardId, toColumn, overCardId);
    if (!result) return;
    setItems(result.next);
    onDataChange?.(result.next);
    const movedItem = result.next.find((it) => getId(it) === activeCardId);
    if (movedItem) onCardMove?.({ item: movedItem, fromColumn, toColumn, toIndex: result.toIndex });
  }

  function handleDragCancel() {
    draggingRef.current = false;
    fromColumnRef.current = null;
    setActiveId(null);
  }

  const activeItem = activeId ? items.find((it) => getId(it) === activeId) ?? null : null;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {searchableFields?.length ? (
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-row gap-4 overflow-x-auto pb-2">
          {columns.map((column) => {
            const columnItems = itemsByColumn(column.id);
            return (
              <KanbanColumnView
                key={column.id}
                column={column}
                count={columnItems.length}
                summary={renderColumnSummary?.(columnItems, column)}
                onAdd={onCardAdd ? () => onCardAdd(column.id) : undefined}
              >
                <SortableContext items={columnItems.map((it) => getId(it))} strategy={verticalListSortingStrategy}>
                  {columnItems.length === 0 ? (
                    <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                      No items
                    </p>
                  ) : (
                    columnItems.map((item) => (
                      <SortableCard
                        key={getId(item)}
                        id={getId(item)}
                        columnId={column.id}
                        onClick={onCardClick ? () => onCardClick(item) : undefined}
                      >
                        <CardBody item={item} titleField={titleField} fields={fields} renderCard={renderCard} />
                      </SortableCard>
                    ))
                  )}
                </SortableContext>
              </KanbanColumnView>
            );
          })}
        </div>

        <DragOverlay>
          {activeItem ? (
            <Card className="rotate-3 shadow-lg">
              <CardContent className="flex items-start gap-2 p-3">
                <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <CardBody item={activeItem} titleField={titleField} fields={fields} renderCard={renderCard} />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumnView({
  column,
  count,
  summary,
  onAdd,
  children,
}: {
  column: KanbanColumn;
  count: number;
  summary?: React.ReactNode;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div className="flex w-72 shrink-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        {column.color ? <span className="size-2 rounded-full" style={{ backgroundColor: column.color }} /> : null}
        <span className="text-sm font-medium">{column.label}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
        {summary != null ? <span className="ml-auto text-xs text-muted-foreground">{summary}</span> : null}
        {onAdd ? (
          <Button variant="ghost" size="icon" className={cn('size-6', summary == null && 'ml-auto')} onClick={onAdd}>
            <Plus className="size-4" />
          </Button>
        ) : null}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-col gap-2 rounded-lg border border-transparent p-2 transition-colors',
          isOver && 'border-border bg-muted/50',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SortableCard({
  id,
  columnId,
  onClick,
  children,
}: {
  id: string;
  columnId: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { columnId },
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50')}>
      <Card className={cn('gap-0 py-0', onClick && 'cursor-pointer')} onClick={onClick}>
        <CardContent className="flex items-start gap-2 p-3">
          <button
            type="button"
            className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <div className="min-w-0 flex-1">{children}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function CardBody<T extends Record<string, unknown>>({
  item,
  titleField,
  fields,
  renderCard,
}: {
  item: T;
  titleField?: keyof T;
  fields?: KanbanField<T>[];
  renderCard?: (item: T) => React.ReactNode;
}) {
  if (renderCard) return <>{renderCard(item)}</>;
  return (
    <div className="space-y-1">
      {titleField ? <p className="truncate text-sm font-medium">{String(item[titleField] ?? '')}</p> : null}
      {fields?.length ? (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {fields.map((field) => {
            const value = item[field.key];
            return (
              <span key={String(field.key)} className="whitespace-nowrap">
                {field.label ? `${field.label}: ` : null}
                {field.render ? field.render(value, item) : String(value ?? '')}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Regenerate (so `dependencies` pick up `@dnd-kit/*`)**

Run: `bun registry:generate`
Then confirm the registry entry got the deps:

Run: `node -e "const r=require('./packages/registry/registry.json'); const i=r.items.find(x=>x.name==='kanban'); console.log(JSON.stringify({dependencies:i.dependencies, registryDependencies:i.registryDependencies},null,2))"`
Expected: `dependencies` contains `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `lucide-react`; `registryDependencies` contains `button`, `card`, `input`.

- [ ] **Step 3: Typecheck**

Run: `cd packages/registry && bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `bun check`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/items/blocks/kanban/component.tsx
git commit -m "feat(kanban): add inter and intra-column drag-and-drop"
```

---

## Task 5: Smooth cross-column dragging (`onDragOver`)

**Files:**
- Modify: `packages/registry/items/blocks/kanban/component.tsx`

Without this, a card only visually changes column on drop. `onDragOver` moves the dragged item into the hovered column live (the final index is still resolved on drop). The `fromColumnRef` captured at drag start (Task 4) keeps `onCardMove.fromColumn` correct even after the live move.

- [ ] **Step 1: Import the `DragOverEvent` type**

In the `@dnd-kit/core` import block, add `type DragOverEvent`:

```tsx
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
```

- [ ] **Step 2: Add the `handleDragOver` handler**

Immediately after `handleDragStart` in the `Kanban` function body, add:

```tsx
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeCardId = String(active.id);
    const overId = String(over.id);
    if (activeCardId === overId) return;

    const activeItem = items.find((it) => getId(it) === activeCardId);
    if (!activeItem) return;

    const overIsColumn = columns.some((c) => c.id === overId);
    const overItem = overIsColumn ? null : items.find((it) => getId(it) === overId);
    const overColumn = overIsColumn ? overId : overItem ? getColumn(overItem) : null;
    if (!overColumn || overColumn === getColumn(activeItem)) return;

    setItems((prev) => {
      const current = prev.find((it) => getId(it) === activeCardId);
      if (!current) return prev;
      const moved = { ...current, [columnField]: overColumn } as T;
      const without = prev.filter((it) => getId(it) !== activeCardId);
      if (overItem) {
        const idx = without.findIndex((it) => getId(it) === overId);
        without.splice(idx < 0 ? without.length : idx, 0, moved);
        return without;
      }
      without.push(moved);
      return without;
    });
  }
```

- [ ] **Step 3: Wire it into `DndContext`**

Add `onDragOver={handleDragOver}` to the `DndContext` props:

```tsx
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
```

- [ ] **Step 4: Typecheck**

Run: `cd packages/registry && bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/items/blocks/kanban/component.tsx
git commit -m "feat(kanban): live cross-column move during drag"
```

---

## Task 6: Add the controlled + custom-card variant example

**Files:**
- Create: `packages/registry/items/blocks/kanban/custom-card.example.tsx`

- [ ] **Step 1: Write `custom-card.example.tsx`**

```tsx
'use client';

import * as React from 'react';
import { Kanban } from '@/components/block/shuip/kanban';

type Deal = {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
};

const columns = [
  { id: 'lead', label: 'Lead', color: 'var(--color-muted-foreground)' },
  { id: 'qualified', label: 'Qualified', color: 'var(--color-blue-500)' },
  { id: 'negotiation', label: 'Negotiation', color: 'var(--color-amber-500)' },
  { id: 'won', label: 'Won', color: 'var(--color-green-500)' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const initialDeals: Deal[] = [
  { id: 'd1', name: 'Acme website', company: 'Acme Inc', value: 12000, stage: 'lead' },
  { id: 'd2', name: 'Globex platform', company: 'Globex', value: 48000, stage: 'qualified' },
  { id: 'd3', name: 'Initech migration', company: 'Initech', value: 30000, stage: 'qualified' },
  { id: 'd4', name: 'Umbrella retainer', company: 'Umbrella', value: 60000, stage: 'negotiation' },
  { id: 'd5', name: 'Soylent rebrand', company: 'Soylent', value: 18000, stage: 'won' },
];

export default function KanbanCustomCardExample() {
  const [deals, setDeals] = React.useState<Deal[]>(initialDeals);

  return (
    <Kanban<Deal>
      columns={columns}
      data={deals}
      onDataChange={setDeals}
      columnField="stage"
      renderCard={(deal) => (
        <div className="space-y-1">
          <p className="truncate text-sm font-medium">{deal.name}</p>
          <p className="truncate text-xs text-muted-foreground">{deal.company}</p>
          <p className="font-mono text-xs">{formatCurrency(deal.value)}</p>
        </div>
      )}
      renderColumnSummary={(items) => formatCurrency(items.reduce((sum, d) => sum + d.value, 0))}
      onCardMove={(e) => console.log(`${e.item.name}: ${e.fromColumn} -> ${e.toColumn} @ ${e.toIndex}`)}
    />
  );
}
```

- [ ] **Step 2: Generate and confirm the example is keyed**

Run: `bun registry:generate`
Then:

Run: `grep -c "kanban.custom-card.example" packages/registry/__index__.ts`
Expected: `1` (the variant example was registered).

- [ ] **Step 3: Typecheck**

Run: `cd packages/registry && bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/registry/items/blocks/kanban/custom-card.example.tsx
git commit -m "feat(kanban): add controlled custom-card example"
```

---

## Task 7: Write the block doc

**Files:**
- Create: `apps/docs/content/blocks/kanban.mdx`

- [ ] **Step 1: Write `apps/docs/content/blocks/kanban.mdx`**

````mdx
---
title: Kanban
description: A generic, drag-and-drop kanban board whose columns, card fields, and search are driven by your typed data model.
registryName: kanban
---

import { TypeTable } from 'fumadocs-ui/components/type-table';

`Kanban` is a generic board (`Kanban<T>`) that renders any array of typed items into draggable columns. Columns, the property fields shown on each card, and the searchable fields are all configured against your own data shape — nothing is hardcoded to a domain.

### Built-in features

- **Generic data model**: works with any item type `T` via `idField` / `columnField`.
- **Declarative cards**: drive the default card with a `fields` config, or take full control with `renderCard`.
- **Inter and intra-column drag-and-drop**: move cards between columns and reorder within a column.
- **Hybrid state**: works standalone from `defaultData`, or controlled via `data` + `onDataChange`.
- **Global search**: filter cards across `searchableFields`.
- **Per-column extras**: count, a `renderColumnSummary` slot, color accent, and an add button.

> The card order is implicit in the `data` array order. On any move, the board emits the reordered array via `onDataChange` (and a semantic `onCardMove` event); map that to your own persistence.

> Define your item type with a `type` alias, not an `interface` — `Kanban<T>` requires `T extends Record<string, unknown>`, which a TypeScript `interface` does not satisfy.

## Examples

<ItemExamples registryName={'kanban'} />

## Props

<TypeTable
  type={{
    columns: {
      description: 'Column definitions: { id, label, color? }.',
      type: 'KanbanColumn[]',
    },
    data: {
      description: 'Controlled items. When provided, you own the state via onDataChange.',
      type: 'T[]?',
    },
    defaultData: {
      description: 'Initial items for uncontrolled mode.',
      type: 'T[]?',
    },
    onDataChange: {
      description: 'Fires with the full reordered array after a move.',
      type: '(next: T[]) => void',
    },
    idField: {
      description: 'Field holding the stable card id.',
      type: 'keyof T',
      default: "'id'",
    },
    columnField: {
      description: 'Field holding the column id the card belongs to.',
      type: 'keyof T',
    },
    titleField: {
      description: 'Field rendered as the card title in the default card.',
      type: 'keyof T?',
    },
    fields: {
      description: 'Properties shown on the default card: { key, label?, render? }.',
      type: 'KanbanField<T>[]?',
    },
    renderCard: {
      description: 'Escape hatch to fully render a card; bypasses fields/titleField.',
      type: '(item: T) => ReactNode',
    },
    searchableFields: {
      description: 'Fields the internal search box matches against. Omit to hide search.',
      type: '(keyof T)[]?',
    },
    searchPlaceholder: {
      description: 'Placeholder for the search box.',
      type: 'string?',
      default: "'Search...'",
    },
    renderColumnSummary: {
      description: 'Renders an aggregate in the column header (e.g. a sum).',
      type: '(items: T[], column: KanbanColumn) => ReactNode',
    },
    onCardClick: {
      description: 'Called when a card body is clicked.',
      type: '(item: T) => void',
    },
    onCardAdd: {
      description: 'When set, shows a + button in the column header.',
      type: '(columnId: string) => void',
    },
    onCardMove: {
      description: 'Semantic move event: { item, fromColumn, toColumn, toIndex }.',
      type: '(e: KanbanMoveEvent<T>) => void',
    },
  }}
/>
````

- [ ] **Step 2: Commit**

```bash
git add apps/docs/content/blocks/kanban.mdx
git commit -m "docs(kanban): add kanban block documentation page"
```

---

## Task 8: Full build + manual verification

**Files:** none (verification only)

- [ ] **Step 1: Full docs build**

Run: `bun build:docs`
Expected: completes successfully. This chains `registry:generate` → `registry:build` → `next build`. Confirm `apps/docs/public/r/kanban.json` was produced:

Run: `test -f apps/docs/public/r/kanban.json && echo OK`
Expected: `OK`

- [ ] **Step 2: Inspect the published JSON**

Run: `node -e "const j=require('./apps/docs/public/r/kanban.json'); console.log(j.name, j.type, '| files:', j.files.map(f=>f.path)); console.log('deps:', j.dependencies, '| registryDeps:', j.registryDependencies)"`
Expected: `name` = `kanban`, `type` = `registry:block`, `dependencies` includes the three `@dnd-kit/*` packages + `lucide-react`, `registryDependencies` includes `button`, `card`, `input`.

- [ ] **Step 3: Manual browser preview**

Run: `bun dev:docs`
Open the kanban block doc page in the browser (the `blocks` collection route for `kanban`). Verify:
- Both example previews render (default tasks board + custom-card deals board).
- Drag a card to a **different** column — it moves and the counts/summaries update.
- Drag a card **within** a column to reorder it.
- Type in the search box on the default board — cards filter live; clearing restores them.
- On the custom-card (controlled) board, moves persist (state lives in the example via `onDataChange`) and the console logs the `onCardMove` line.

- [ ] **Step 4: Stop the dev server.**

There is no separate commit for this task (verification only). If any issue is found, fix it in the relevant task's file and re-run Steps 1–3.

---

## Self-Review notes (addressed in this plan)

- **Spec coverage:** hybrid state (Task 4 `items`/`draggingRef`/effect), array-implicit order (Task 4 `reorder`), `fields` + `renderCard` (Task 2 `CardBody`), search (Task 3), column count + summary + color + `onCardAdd` + `onCardClick` (Tasks 2/4), inter+intra DnD (Tasks 4/5), `onCardMove` (Task 4), examples default+variant (Tasks 2/6), block doc in `content/blocks` not `index.mdx` (Task 7), catalog setup (Task 1), verification via `build:docs` + manual (Task 8). All present.
- **`badge` primitive:** not in `packages/ui`; the count uses a token-styled `<span>` instead — no new primitive added.
- **Type names consistent across tasks:** `KanbanColumn`, `KanbanField<T>`, `KanbanProps<T>`, `Kanban`, `KanbanColumnView`, `SortableCard`, `CardBody`, `reorder`, `handleDragStart/Over/End/Cancel`, `getId`, `getColumn`, `itemsByColumn`, `visible`, `draggingRef`, `fromColumnRef`.
- **`KanbanMoveEvent<T>`** is referenced only in the doc's prop type string for readability; it is described inline by its shape `{ item, fromColumn, toColumn, toIndex }` (the code uses the inline object type, no exported alias required).
