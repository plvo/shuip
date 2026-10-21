'use client';

import {
  type Collision,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  DragOverlay,
  type DragStartEvent,
  type DroppableContainer,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCombinedRefs } from '@dnd-kit/utilities';
import { GripVertical, Plus, Search } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const DROP_SLOT_KEY = '__drop-slot__';

type KanbanDroppableData = { zone?: boolean; columnId: string };

// What a drop zone registers with dnd-kit, so that a collision knows which cards belong to it.
export const dropZoneData = (columnId: string): KanbanDroppableData => ({ zone: true, columnId });

const dataOf = (container: { data: { current?: unknown } }) =>
  container.data.current as KanbanDroppableData | undefined;

// The target is the column under the pointer, then the card closest to the
// pointer in it, or the column itself when it is empty or the pointer is below
// its last card. Without a pointer (keyboard sensor) the column is the one the
// dragged rectangle overlaps most, and the centre of that rectangle stands for
// the pointer. A pointer outside every column targets nothing. The collision
// data tells whether the point is below the vertical centre of the targeted card.
export const detectBoardCollision: CollisionDetection = (args) => {
  const { droppableContainers, droppableRects, pointerCoordinates, collisionRect } = args;
  const zones = droppableContainers.filter((container) => dataOf(container)?.zone === true);

  const point = pointerCoordinates ?? {
    x: collisionRect.left + collisionRect.width / 2,
    y: collisionRect.top + collisionRect.height / 2,
  };
  const [hit] = (pointerCoordinates ? pointerWithin : rectIntersection)({ ...args, droppableContainers: zones });
  const zone = hit?.data?.droppableContainer as (typeof zones)[number] | undefined;
  if (!zone) return [];
  const zoneData = zone.data.current as KanbanDroppableData;

  let closest: { id: string | number; distance: number; below: boolean } | null = null;
  let lowestEdge = Number.NEGATIVE_INFINITY;
  for (const container of droppableContainers) {
    const rect = droppableRects.get(container.id);
    const data = dataOf(container);
    if (!rect || !data || data.zone) continue;
    if (!isSameCell(data, zoneData)) continue;
    lowestEdge = Math.max(lowestEdge, rect.bottom);
    const offset = point.y - (rect.top + rect.height / 2);
    const distance = Math.abs(offset);
    if (!closest || distance < closest.distance) closest = { id: container.id, distance, below: offset > 0 };
  }

  const target = closest && point.y <= lowestEdge ? closest : { id: zone.id, distance: 0, below: false };
  const container = droppableContainers.find(({ id }) => id === target.id);
  return [{ id: target.id, data: { droppableContainer: container, value: target.distance, below: target.below } }];
};

type CardCell = { columnId: string };

function isSameCell(a: CardCell, b: CardCell): boolean {
  return a.columnId === b.columnId;
}

// Where a dragged card would land: the column, and the rank it takes among the
// cards of that column once the dragged card has left it.
export type DropSlot = CardCell & { index: number };

// What the pointer is over: a column zone or a card, and whether the pointer is
// below the vertical centre of that card.
export type DropOver = CardCell & { id: string; zone: boolean; below: boolean };

export type CardAccessors<T> = {
  getId: (item: T) => string;
  getColumn: (item: T) => string;
};

function inCell<T>(item: T, cell: CardCell, { getColumn }: CardAccessors<T>): boolean {
  return getColumn(item) === cell.columnId;
}

function cellCards<T>(items: T[], cell: CardCell, accessors: CardAccessors<T>): T[] {
  return items.filter((item) => inCell(item, cell, accessors));
}

export function cellIds<T>(items: T[], cell: CardCell, accessors: CardAccessors<T>): string[] {
  return cellCards(items, cell, accessors).map((item) => accessors.getId(item));
}

// `order` is the cell without the dragged card. A card held above another lands
// before it, below lands after it, and a drop on the column itself (no `overId`)
// lands at the end of what is rendered of the cell: right after the last card of
// `renderedIds`, before the cards the search left out, so that the card lands
// where the drop slot is drawn. Without `renderedIds` every card counts.
export function landingIndex({
  order,
  overId,
  below,
  renderedIds,
}: {
  order: string[];
  overId: string | null;
  below: boolean;
  renderedIds?: ReadonlySet<string>;
}): number {
  const at = overId == null ? -1 : order.indexOf(overId);
  if (at >= 0) return below ? at + 1 : at;
  if (!renderedIds) return order.length;
  const lastRendered = order.findLastIndex((id) => renderedIds.has(id));
  return lastRendered < 0 ? order.length : lastRendered + 1;
}

// The cards of the cell without the dragged one: the cards the slot rank counts.
function othersInCell<T>(items: T[], cell: CardCell, activeId: string, accessors: CardAccessors<T>): T[] {
  return cellCards(items, cell, accessors).filter((item) => accessors.getId(item) !== activeId);
}

// The ids of those cards, in order.
export function cellOrder<T>(items: T[], cell: CardCell, activeId: string, accessors: CardAccessors<T>): string[] {
  return othersInCell(items, cell, activeId, accessors).map((item) => accessors.getId(item));
}

export function originSlot<T>(items: T[], activeId: string, accessors: CardAccessors<T>): DropSlot | null {
  const active = items.find((item) => accessors.getId(item) === activeId);
  if (!active) return null;
  const cell = { columnId: accessors.getColumn(active) };
  return { ...cell, index: cellIds(items, cell, accessors).indexOf(activeId) };
}

// Hovering the dragged card, or its neighbours on their facing side, previews
// the slot it already occupies.
export function previewTarget<T>({
  items,
  activeId,
  over,
  accessors,
  renderedIds,
}: {
  items: T[];
  activeId: string;
  over: DropOver | null;
  accessors: CardAccessors<T>;
  renderedIds?: ReadonlySet<string>;
}): DropSlot | null {
  if (!over) return null;
  if (over.id === activeId) return originSlot(items, activeId, accessors);
  const order = cellOrder(items, over, activeId, accessors);
  const index = landingIndex({ order, overId: over.zone ? null : over.id, below: over.below, renderedIds });
  return { columnId: over.columnId, index };
}

// Read from the collisions, which belong to the render the pointer is in: the
// `over` of an event can be one render behind them.
function dropOverOf({ collisions }: { collisions: Collision[] | null }): DropOver | null {
  const hit = collisions?.[0];
  const cell = (hit?.data?.droppableContainer as DroppableContainer | undefined)?.data.current as
    | KanbanDroppableData
    | undefined;
  if (!hit || !cell) return null;
  return {
    id: String(hit.id),
    columnId: cell.columnId,
    zone: cell.zone === true,
    below: hit.data?.below === true,
  };
}

export function isSameSlot(a: DropSlot | null, b: DropSlot | null): boolean {
  if (a == null || b == null) return a === b;
  return isSameCell(a, b) && a.index === b.index;
}

// Finds in `fresh`, a newer list than `items`, the slot between the cards that
// `target` was previewed between: right before the card that followed it, else
// right after the card that preceded it, else at the same rank clamped to the
// cell. On identical lists the slot is `target` itself.
export function rebaseSlot<T>({
  items,
  fresh,
  activeId,
  target,
  accessors,
}: {
  items: T[];
  fresh: T[];
  activeId: string;
  target: DropSlot;
  accessors: CardAccessors<T>;
}): DropSlot {
  const previousOrder = cellOrder(items, target, activeId, accessors);
  const freshOrder = cellOrder(fresh, target, activeId, accessors);
  const before = previousOrder[target.index - 1];
  const after = previousOrder[target.index];
  const afterAt = after === undefined ? -1 : freshOrder.indexOf(after);
  const beforeAt = before === undefined ? -1 : freshOrder.indexOf(before);
  let index = Math.min(target.index, freshOrder.length);
  if (afterAt >= 0) index = afterAt;
  else if (beforeAt >= 0) index = beforeAt + 1;
  return { columnId: target.columnId, index };
}

// Places the card in `target`, right before the card that holds that rank
// among the others, or right after the last one. A card moving to an empty
// cell keeps its place in the list. `withLanding` returns the card as it stands
// once it has landed in `target`: the cell, and whatever else the landing writes.
export function applyCardMove<T>({
  items,
  activeId,
  target,
  accessors,
  withLanding,
}: {
  items: T[];
  activeId: string;
  target: DropSlot;
  accessors: CardAccessors<T>;
  withLanding: (item: T, cell: CardCell) => T;
}): T[] {
  const active = items.find((item) => accessors.getId(item) === activeId);
  if (!active) return items;
  const others = items.filter((item) => item !== active);
  const order = others.filter((item) => inCell(item, target, accessors));
  const anchor = order[target.index];
  const last = order.at(-1);
  let at = items.indexOf(active);
  if (anchor !== undefined) at = others.indexOf(anchor);
  else if (last !== undefined) at = others.indexOf(last) + 1;
  return [...others.slice(0, at), withLanding(active, target), ...others.slice(at)];
}

// The fields of `T` that hold a position: numbers, possibly absent.
export type KanbanPositionField<T> = {
  [K in keyof T]-?: T[K] extends number | null | undefined ? K : never;
}[keyof T];

// A position that is not a finite number counts as 0, for the order and for the
// neighbours of a slot alike, so that every slot of a cell can be told apart.
export function positionOf<T>(item: T, field: keyof T): number {
  const value = item[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

// The one order cards are read in when the board has a `positionField`: by
// ascending position, cards of equal position in the order of `items`.
export function sortByPosition<T>(items: T[], field: keyof T): T[] {
  return items
    .map((item, rank) => ({ item, rank, position: positionOf(item, field) }))
    .sort((a, b) => a.position - b.position || a.rank - b.rank)
    .map(({ item }) => item);
}

export type SlotNeighbours<T> = { before: T | null; after: T | null };

// The cards on both sides of `target` in the full order of its cell, the
// dragged card left out; null where the slot meets an edge of the cell.
export function slotNeighbours<T>({
  items,
  activeId,
  target,
  accessors,
}: {
  items: T[];
  activeId: string;
  target: DropSlot;
  accessors: CardAccessors<T>;
}): SlotNeighbours<T> {
  const order = othersInCell(items, target, activeId, accessors);
  return { before: order[target.index - 1] ?? null, after: order[target.index] ?? null };
}

// The position that puts a card between two neighbours: 0 in an empty cell, one
// step off the only neighbour at an edge, the midpoint between two neighbours.
export function slotPosition<T>({ before, after }: SlotNeighbours<T>, positionField: keyof T): number {
  if (before && after) {
    const from = positionOf(before, positionField);
    return from + (positionOf(after, positionField) - from) / 2;
  }
  if (before) return positionOf(before, positionField) + 1;
  if (after) return positionOf(after, positionField) - 1;
  return 0;
}

// The rendered card the drop slot goes before, or null for the end. Cards the
// search left out of `renderedIds` still count for their rank, and the dragged
// card, which stays rendered in place, does not.
export function slotPlacement({
  order,
  renderedIds,
  activeId,
  index,
}: {
  order: string[];
  renderedIds: string[];
  activeId: string;
  index: number;
}): string | null {
  const rank = new Map(order.map((id, position) => [id, position]));
  return renderedIds.find((id) => id !== activeId && (rank.get(id) ?? -1) >= index) ?? null;
}

export type KanbanMoveEvent<T> = {
  item: T;
  fromColumn: string;
  toColumn: string;
  toIndex: number;
  position?: number;
  beforeId: string | null;
  afterId: string | null;
};

/**
 * The board's live card list and the drag state machine that mutates it.
 *
 * Hovering only previews where the card would land; the list changes once, on
 * drop, and `onCardMove` fires then, only when the card actually moved. Every
 * decision that does not need the DOM lives in the pure helpers above and is
 * tested separately.
 */
function useKanbanDrag<T extends Record<string, unknown>>({
  data,
  defaultData,
  columnField,
  positionField,
  accessors,
  renderedIdsRef,
  onDataChange,
  onCardMove,
}: {
  data?: T[];
  defaultData?: T[];
  columnField: keyof T;
  positionField?: keyof T;
  accessors: CardAccessors<T>;
  renderedIdsRef: React.RefObject<ReadonlySet<string>>;
  onDataChange?: (next: T[]) => void;
  onCardMove?: (event: KanbanMoveEvent<T>) => void;
}) {
  const { getId, getColumn } = accessors;
  const [storedItems, setItems] = React.useState<T[]>(() => data ?? defaultData ?? []);
  const draggingRef = React.useRef(false);
  const originRef = React.useRef<DropSlot | null>(null);
  const pendingDataRef = React.useRef<T[] | null>(null);

  // A `data` update that lands mid-drag must not be dropped: the guard is a
  // ref, so this effect will not re-run when the drag ends. Hold the value and
  // drain it on the paths where the drag changed nothing.
  React.useEffect(() => {
    if (!data) return;
    if (draggingRef.current) {
      pendingDataRef.current = data;
      return;
    }
    setItems(data);
  }, [data]);

  // The one order the board reads its cards in: the preview, the landing, the
  // neighbours and the rendering all follow it.
  const inBoardOrder = React.useCallback(
    (list: T[]) => (positionField ? sortByPosition(list, positionField) : list),
    [positionField],
  );
  const items = React.useMemo(() => inBoardOrder(storedItems), [storedItems, inBoardOrder]);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  // `entering` tells that the slot just came into its column, as opposed to
  // having moved inside it.
  const [previewState, setPreviewState] = React.useState<{ slot: DropSlot; entering: boolean } | null>(null);

  const withCell = (item: T, cell: CardCell): T =>
    getColumn(item) === cell.columnId ? item : ({ ...item, [columnField]: cell.columnId } as T);

  // Applied when the drag produced no change. A drop that moves a card applies
  // its move to the held value instead, and emits the result.
  const drainPendingData = (apply: boolean) => {
    const pending = pendingDataRef.current;
    pendingDataRef.current = null;
    if (apply && pending) setItems(pending);
  };

  function endDrag() {
    draggingRef.current = false;
    originRef.current = null;
    setActiveId(null);
    setPreviewState(null);
  }

  function handleDragStart(event: DragStartEvent) {
    draggingRef.current = true;
    const id = String(event.active.id);
    originRef.current = originSlot(items, id, accessors);
    setActiveId(id);
  }

  function handleDragMove(event: DragMoveEvent) {
    const target = previewTarget({
      items,
      activeId: String(event.active.id),
      over: dropOverOf(event),
      accessors,
      renderedIds: renderedIdsRef.current,
    });
    const next = isSameSlot(target, originRef.current) ? null : target;
    setPreviewState((current) => {
      if (!next) return null;
      if (current && isSameSlot(current.slot, next)) return current;
      const entering = !current || !isSameCell(current.slot, next);
      return { slot: next, entering };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const origin = originRef.current;
    endDrag();

    const activeCardId = String(event.active.id);
    const target = previewTarget({
      items,
      activeId: activeCardId,
      over: dropOverOf(event),
      accessors,
      renderedIds: renderedIdsRef.current,
    });
    if (!origin || !target || isSameSlot(origin, target)) {
      drainPendingData(true);
      return;
    }

    const fresh = pendingDataRef.current ? inBoardOrder(pendingDataRef.current) : items;
    const slot = rebaseSlot({ items, fresh, activeId: activeCardId, target, accessors });
    const neighbours = slotNeighbours({ items: fresh, activeId: activeCardId, target: slot, accessors });
    const position = positionField ? slotPosition(neighbours, positionField) : undefined;
    const withLanding = (item: T, cell: CardCell): T => {
      const landed = withCell(item, cell);
      return positionField ? ({ ...landed, [positionField]: position } as T) : landed;
    };
    const next = inBoardOrder(
      applyCardMove({ items: fresh, activeId: activeCardId, target: slot, accessors, withLanding }),
    );
    const movedItem = next.find((item) => getId(item) === activeCardId);
    if (!movedItem) {
      drainPendingData(true);
      return;
    }

    const toColumn = getColumn(movedItem);
    const toIndex = cellIds(next, { columnId: toColumn }, accessors).indexOf(activeCardId);

    setItems(next);
    drainPendingData(false);
    onDataChange?.(next);
    onCardMove?.({
      item: movedItem,
      fromColumn: origin.columnId,
      toColumn,
      toIndex,
      position,
      beforeId: neighbours.before ? getId(neighbours.before) : null,
      afterId: neighbours.after ? getId(neighbours.after) : null,
    });
  }

  function handleDragCancel() {
    endDrag();
    drainPendingData(true);
  }

  return {
    items,
    activeId,
    preview: previewState?.slot ?? null,
    slotEntering: previewState?.entering ?? false,
    handlers: {
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
    },
  };
}

export type KanbanProps<T extends Record<string, unknown>> = {
  columns: KanbanColumn[];
  data?: T[];
  defaultData?: T[];
  onDataChange?: (next: T[]) => void;
  idField?: keyof T;
  columnField: keyof T;
  positionField?: KanbanPositionField<T>;
  title?: (item: T) => React.ReactNode;
  fields?: KanbanField<T>[];
  cardContent?: (item: T) => React.ReactNode;
  searchableFields?: (keyof T)[];
  searchPlaceholder?: string;
  renderColumnSummary?: (items: T[], column: KanbanColumn) => React.ReactNode;
  onCardClick?: (item: T) => void;
  onCardAdd?: (columnId: string) => void;
  onCardMove?: (event: KanbanMoveEvent<T>) => void;
  className?: string;
};

export function Kanban<T extends Record<string, unknown>>({
  columns,
  data,
  defaultData,
  onDataChange,
  idField = 'id' as keyof T,
  columnField,
  positionField,
  title,
  fields,
  cardContent,
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

  const accessors = React.useMemo<CardAccessors<T>>(() => ({ getId, getColumn }), [getId, getColumn]);

  const renderedIdsRef = React.useRef<ReadonlySet<string>>(new Set());

  const { items, activeId, preview, slotEntering, handlers } = useKanbanDrag<T>({
    data,
    defaultData,
    columnField,
    positionField,
    accessors,
    renderedIdsRef,
    onDataChange,
    onCardMove,
  });

  const [query, setQuery] = React.useState('');
  const deferredQuery = React.useDeferredValue(query);

  const dndId = React.useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Search is purely visual: it narrows what is rendered and never mutates the
  // card list the drag machine owns.
  const visible = React.useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q || !searchableFields?.length) return items;
    return items.filter((it) =>
      searchableFields.some((f) =>
        String(it[f] ?? '')
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [items, deferredQuery, searchableFields]);

  const itemsByColumn = React.useMemo(() => {
    const grouped = new Map<string, T[]>(columns.map((column) => [column.id, []]));
    for (const item of visible) {
      grouped.get(getColumn(item))?.push(item);
    }
    return grouped;
  }, [columns, visible, getColumn]);

  // Read by the drag handlers to land a card where the drop slot is drawn.
  // Resynchronised on commit, never during render.
  const renderedIds = new Set(visible.map(getId));
  React.useEffect(() => {
    renderedIdsRef.current = renderedIds;
  });

  // The column the drop slot is in, without the dragged card.
  const previewOrder = React.useMemo(
    () => (preview && activeId ? cellOrder(items, preview, activeId, accessors) : []),
    [items, preview, activeId, accessors],
  );

  const activeItem = activeId ? (items.find((it) => getId(it) === activeId) ?? null) : null;

  const renderTitle = React.useCallback((item: T): React.ReactNode => (title ? title(item) : null), [title]);

  const renderBody = React.useCallback(
    (item: T): React.ReactNode => {
      if (cardContent) return cardContent(item);
      if (!fields?.length) return null;
      return (
        <div className='flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground'>
          {fields.map((field) => {
            const value = item[field.key];
            return (
              <span key={String(field.key)} className='whitespace-nowrap'>
                {field.label ? <span className='font-medium'>{field.label}: </span> : null}
                {field.render ? field.render(value, item) : String(value ?? '')}
              </span>
            );
          })}
        </div>
      );
    },
    [cardContent, fields],
  );

  // `slotBeforeId` is the card the drop slot goes before, null for the end of
  // the column, and undefined when the slot is in another column.
  const renderCards = (list: T[], column: KanbanColumn, slotBeforeId: string | null | undefined) => {
    const cards = list.map((item) => (
      <React.Fragment key={getId(item)}>
        {slotBeforeId === getId(item) ? <KanbanDropSlot fade={slotEntering} /> : null}
        <KanbanCardView
          id={getId(item)}
          columnId={column.id}
          title={renderTitle(item)}
          body={renderBody(item)}
          onClick={onCardClick ? () => onCardClick(item) : undefined}
        />
      </React.Fragment>
    ));
    return slotBeforeId === null ? [...cards, <KanbanDropSlot key={DROP_SLOT_KEY} fade={slotEntering} />] : cards;
  };

  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-4', className)}>
      {searchableFields?.length ? (
        <div className='relative w-full max-w-xs'>
          <Search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className='pl-8'
          />
        </div>
      ) : null}

      <DndContext id={dndId} sensors={sensors} collisionDetection={detectBoardCollision} {...handlers}>
        <div className='flex flex-row gap-4 overflow-x-auto pb-2'>
          {columns.map((column) => {
            const columnItems = itemsByColumn.get(column.id) ?? [];
            const slotBeforeId =
              activeId != null && preview != null && isSameCell(preview, { columnId: column.id })
                ? slotPlacement({
                    order: previewOrder,
                    renderedIds: columnItems.map(getId),
                    activeId,
                    index: preview.index,
                  })
                : undefined;
            return (
              <KanbanColumnView
                key={column.id}
                column={column}
                count={columnItems.length}
                summary={renderColumnSummary?.(columnItems, column)}
                onAdd={onCardAdd ? () => onCardAdd(column.id) : undefined}
              >
                {columnItems.length === 0 && slotBeforeId === undefined ? (
                  <p className='rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground'>
                    No items
                  </p>
                ) : (
                  renderCards(columnItems, column, slotBeforeId)
                )}
              </KanbanColumnView>
            );
          })}
        </div>

        <DragOverlay>
          {activeItem ? (
            <KanbanCardFace
              title={renderTitle(activeItem)}
              body={renderBody(activeItem)}
              className='rotate-3 shadow-lg'
              handle={<GripVertical className='mt-0.5 size-4 shrink-0 text-muted-foreground' />}
            />
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
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: dropZoneData(column.id) });
  return (
    <div className='flex w-72 shrink-0 flex-col gap-3'>
      <div className='flex items-center gap-2'>
        {column.color ? <span className='size-2 rounded-full' style={{ backgroundColor: column.color }} /> : null}
        <span className='text-sm font-medium'>{column.label}</span>
        <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>{count}</span>
        {summary != null ? <span className='ml-auto text-xs text-muted-foreground'>{summary}</span> : null}
        {onAdd ? (
          <Button variant='ghost' size='icon' className={cn('size-6', summary == null && 'ml-auto')} onClick={onAdd}>
            <Plus className='size-4' />
          </Button>
        ) : null}
      </div>
      <div
        ref={setNodeRef}
        data-slot='kanban-column-body'
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

function KanbanCardView({
  id,
  columnId,
  title,
  body,
  onClick,
}: {
  id: string;
  columnId: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({ id });
  const { setNodeRef: setDroppableRef } = useDroppable({ id, data: { columnId } });
  const setNodeRef = useCombinedRefs(setDraggableRef, setDroppableRef);
  return (
    <div ref={setNodeRef} className={cn(isDragging && 'opacity-50')}>
      <KanbanCardFace
        title={title}
        body={body}
        onClick={onClick}
        handle={
          <button
            type='button'
            className='mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing'
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className='size-4' />
          </button>
        }
      />
    </div>
  );
}

// The placeholder for the card being dragged, at the place where it would land.
// Its height is the one measured on the source card, not on the overlay.
function KanbanDropSlot({ fade }: { fade: boolean }) {
  const { activeNodeRect } = useDndContext();
  return (
    <div
      aria-hidden='true'
      data-slot='kanban-drop-slot'
      data-entering={fade || undefined}
      style={{ height: activeNodeRect?.height }}
      className={cn(
        'min-h-10 shrink-0 rounded-xl border border-dashed border-primary bg-primary/10',
        fade && 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150',
      )}
    />
  );
}

function KanbanCardFace({
  title,
  body,
  onClick,
  handle,
  className,
}: {
  title?: React.ReactNode;
  body?: React.ReactNode;
  onClick?: () => void;
  handle?: React.ReactNode;
  className?: string;
}) {
  const hasBody = body != null;
  return (
    <Card className={cn('gap-0 py-0', onClick && 'cursor-pointer', className)} onClick={onClick}>
      <CardHeader className={cn('flex flex-row items-start gap-2 space-y-0 px-3 pt-3', hasBody ? 'pb-0' : 'pb-3')}>
        {handle}
        {title != null ? (
          <CardTitle className='flex-1 text-sm leading-snug'>{title}</CardTitle>
        ) : (
          <span className='flex-1' />
        )}
      </CardHeader>
      {hasBody ? <CardContent className='px-3 pb-3 pl-9 pt-1'>{body}</CardContent> : null}
    </Card>
  );
}
