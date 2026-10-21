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
import { ChevronDown, CircleDashed, Eye, EyeOff, GripVertical, type LucideIcon, Plus, Search } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type DataBoardColumn = {
  id: string;
  label: string;
  icon?: LucideIcon;
  accentClassName?: string;
};

export type DataBoardGroup = {
  id: string;
  label: string;
};

export type DataBoardGroupBy<T> = {
  field: keyof T;
  label?: (value: unknown) => string;
  description?: (value: unknown) => React.ReactNode;
  groups?: DataBoardGroup[];
  defaultCollapsed?: (groupId: string) => boolean;
};

export type DataBoardBand<T> = {
  id: string;
  label: string;
  value: unknown;
  items: T[];
};

export type DataBoardField<T> = {
  key: keyof T;
  label?: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

export const UNGROUPED_ID = '__none__';

export function groupIdOf(value: unknown): string {
  return value == null ? UNGROUPED_ID : String(value);
}

function compareGroupIds(a: string, b: string): number {
  if (a === UNGROUPED_ID) return 1;
  if (b === UNGROUPED_ID) return -1;
  const na = Number(a);
  const nb = Number(b);
  if (a !== '' && b !== '' && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

export function buildGroups<T extends object>(
  items: T[],
  groupBy: DataBoardGroupBy<T>,
  ungroupedLabel: string,
): DataBoardBand<T>[] {
  const explicit = new Map(groupBy.groups?.map((group) => [group.id, group.label]));
  const buckets = new Map<string, { value: unknown; items: T[] }>();

  for (const group of groupBy.groups ?? []) {
    buckets.set(group.id, { value: group.id, items: [] });
  }

  for (const item of items) {
    const value = item[groupBy.field];
    const id = groupIdOf(value);
    const bucket = buckets.get(id);
    if (bucket) {
      bucket.items.push(item);
      // An explicitly declared group starts with its id as a placeholder value;
      // the first real item replaces it so drops write back the original type.
      if (bucket.items.length === 1) bucket.value = value;
    } else {
      buckets.set(id, { value, items: [item] });
    }
  }

  const ids = [...buckets.keys()];
  if (groupBy.groups) {
    const rank = new Map(groupBy.groups.map((group, index) => [group.id, index]));
    ids.sort((a, b) => {
      const ra = rank.get(a);
      const rb = rank.get(b);
      if (ra != null && rb != null) return ra - rb;
      if (ra != null) return -1;
      if (rb != null) return 1;
      return compareGroupIds(a, b);
    });
  } else {
    ids.sort(compareGroupIds);
  }

  return ids.map((id) => {
    const bucket = buckets.get(id) as { value: unknown; items: T[] };
    const value = id === UNGROUPED_ID ? null : bucket.value;
    return {
      id,
      label: explicit.get(id) ?? (id === UNGROUPED_ID ? ungroupedLabel : (groupBy.label?.(value) ?? String(value))),
      value,
      items: bucket.items,
    };
  });
}

export function paginate<T>(items: T[], limit: number): { shown: T[]; hidden: number } {
  if (!Number.isFinite(limit) || limit >= items.length) return { shown: items, hidden: 0 };
  const shown = items.slice(0, Math.max(0, limit));
  return { shown, hidden: items.length - shown.length };
}

export function limitFor(pageSize: number | false, revealed: number): number {
  if (pageSize === false || pageSize <= 0) return Number.POSITIVE_INFINITY;
  return pageSize * (revealed + 1);
}

export function visibleColumns(columns: DataBoardColumn[], hidden: string[]): DataBoardColumn[] {
  if (hidden.length === 0) return columns;
  const hiddenSet = new Set(hidden);
  return columns.filter((column) => !hiddenSet.has(column.id));
}

const DROP_SEPARATOR = '::';

const DROP_SLOT_KEY = '__drop-slot__';

export const columnKey = (columnId: string) => `col:${columnId}`;

// Pagination applies per cell (column x band) but the key is the band's:
// one "show more" raises every column in the band at once.
export const bandKey = (groupId: string) => `band:${groupId}`;

export function dropZoneId(columnId: string, groupId?: string): string {
  return groupId == null ? columnId : `${groupId}${DROP_SEPARATOR}${columnId}`;
}

type BoardDroppableData = { zone?: boolean; columnId: string; groupId?: string };

// What a drop zone registers with dnd-kit, so that a collision knows which cards belong to it.
export const dropZoneData = (columnId: string, groupId?: string): BoardDroppableData => ({
  zone: true,
  columnId,
  groupId,
});

const dataOf = (container: { data: { current?: unknown } }) => container.data.current as BoardDroppableData | undefined;

// The target is the column (or grouped cell) under the pointer, then the card
// closest to the pointer in it, or the column itself when it is empty or the
// pointer is below its last card. Without a pointer (keyboard sensor) the
// column is the one the dragged rectangle overlaps most, and the centre of
// that rectangle stands for the pointer. A pointer outside every column
// targets nothing. The collision data tells whether the point is below the
// vertical centre of the targeted card.
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
  const zoneData = zone.data.current as BoardDroppableData;

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

type CardCell = { columnId: string; groupId?: string };

function isSameCell(a: CardCell, b: CardCell): boolean {
  return a.columnId === b.columnId && a.groupId === b.groupId;
}

// Where a dragged card would land: the cell, and the rank it takes among the
// cards of that cell once the dragged card has left it.
export type DropSlot = CardCell & { index: number };

// What the pointer is over: a column zone or a card, and whether the pointer is
// below the vertical centre of that card.
export type DropOver = CardCell & { id: string; zone: boolean; below: boolean };

export type CardAccessors<T> = {
  getId: (item: T) => string;
  getColumn: (item: T) => string;
  getGroup: (item: T) => string | undefined;
};

// With no `groupId`, the cell spans the whole column (flat mode); with one, it
// spans only the column x band cell, which is the paginated unit.
function inCell<T>(item: T, cell: CardCell, { getColumn, getGroup }: CardAccessors<T>): boolean {
  return getColumn(item) === cell.columnId && (cell.groupId == null || getGroup(item) === cell.groupId);
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
// `renderedIds`, before the cards the pagination or the search left out, so that
// the card lands where the drop slot is drawn. Without `renderedIds` every card
// counts.
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
  const cell = { columnId: accessors.getColumn(active), groupId: accessors.getGroup(active) };
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
  return { columnId: over.columnId, groupId: over.groupId, index };
}

// Read from the collisions, which belong to the render the pointer is in: the
// `over` of an event can be one render behind them.
function dropOverOf({ collisions }: { collisions: Collision[] | null }): DropOver | null {
  const hit = collisions?.[0];
  const cell = (hit?.data?.droppableContainer as DroppableContainer | undefined)?.data.current as
    | BoardDroppableData
    | undefined;
  if (!hit || !cell) return null;
  return {
    id: String(hit.id),
    columnId: cell.columnId,
    groupId: cell.groupId,
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
  return { columnId: target.columnId, groupId: target.groupId, index };
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
export type DataBoardPositionField<T> = {
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
// pagination or the search left out of `renderedIds` still count for their
// rank, and the dragged card, which stays rendered in place, does not.
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

// How many steps to open so the card at `index` enters the paginated window.
// Zero when it is already inside — the common case must not inflate pagination.
export function revealStepsFor(pageSize: number | false, revealed: number, index: number): number {
  if (pageSize === false || pageSize <= 0 || index < 0) return 0;
  if (index < limitFor(pageSize, revealed)) return 0;
  return Math.floor(index / pageSize) - revealed;
}

export type DataBoardLabels = {
  empty: string;
  ungrouped: string;
  allColumnsHidden: string;
  searchPlaceholder: string;
  showMore: (remaining: number) => string;
  pageSizeOption: (size: number) => string;
  pageSizeLabel: string;
  addToColumn: (label: string) => string;
  hideColumn: (label: string) => string;
  showColumn: (label: string) => string;
};

export const DEFAULT_LABELS: DataBoardLabels = {
  empty: 'No items',
  ungrouped: 'Ungrouped',
  allColumnsHidden: 'All columns are hidden',
  searchPlaceholder: 'Search...',
  showMore: (remaining) => `Show ${remaining} more`,
  pageSizeOption: (size) => `${size} per column`,
  pageSizeLabel: 'Cards per column',
  addToColumn: (label) => `Add to ${label}`,
  hideColumn: (label) => `Hide ${label}`,
  showColumn: (label) => `Show ${label}`,
};

export const STORAGE_PREFIX = 'shuip-data-board:';

export type StoredView = {
  hidden: string[];
  pageSize: number | false;
  collapsed: Record<string, boolean>;
};

export function parseStoredView(raw: string | null, knownColumnIds: string[]): Partial<StoredView> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null) return {};
  const source = parsed as Partial<StoredView>;
  const out: Partial<StoredView> = {};

  if (Array.isArray(source.hidden)) {
    const known = new Set(knownColumnIds);
    out.hidden = source.hidden.filter((id): id is string => typeof id === 'string' && known.has(id));
  }
  if (source.pageSize === false || (typeof source.pageSize === 'number' && source.pageSize > 0)) {
    out.pageSize = source.pageSize;
  }
  if (source.collapsed && typeof source.collapsed === 'object' && !Array.isArray(source.collapsed)) {
    out.collapsed = source.collapsed;
  }
  return out;
}

function writeStoredView(persistKey: string | undefined, view: StoredView): void {
  if (!persistKey || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + persistKey, JSON.stringify(view));
  } catch {
    // Storage full or unavailable: the view stays in memory for this session.
  }
}

export type DataBoardView = {
  hidden: string[];
  toggleHidden: (columnId: string) => void;
  pageSize: number | false;
  setPageSize: (next: number | false) => void;
  revealedFor: (key: string) => number;
  revealMore: (key: string) => void;
  isCollapsed: (groupId: string, fallback: boolean) => boolean;
  toggleCollapsed: (groupId: string, fallback: boolean) => void;
};

export function useDataBoardView({
  persistKey,
  columnIds,
  defaultPageSize,
  hiddenColumns,
  onHiddenColumnsChange,
}: {
  persistKey?: string;
  columnIds: string[];
  defaultPageSize: number | false;
  hiddenColumns?: string[];
  onHiddenColumnsChange?: (ids: string[]) => void;
}): DataBoardView {
  const columnIdsRef = React.useRef(columnIds);

  const [ownHidden, setOwnHidden] = React.useState<string[]>([]);
  const [pageSize, setPageSizeState] = React.useState<number | false>(defaultPageSize);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = React.useState<Record<string, number>>({});
  const hydrated = React.useRef(false);

  const controlled = hiddenColumns != null;
  const hidden = controlled ? hiddenColumns : ownHidden;

  // Always-current reflection of what belongs in storage. Unlike the state
  // values, which only change on the next render, this ref is also rewritten
  // by each mutator: two mutations batched into one render must both reach
  // storage.
  const storedRef = React.useRef<StoredView>({ hidden, pageSize, collapsed });

  // Resynchronised on commit, never during render: React can replay or discard
  // a render, and a ref written in a discarded render would leak state that was
  // never displayed.
  React.useEffect(() => {
    columnIdsRef.current = columnIds;
    storedRef.current = { hidden, pageSize, collapsed };
  });

  // Read after mount only: reading during render would make the server HTML
  // diverge from the first client render. `columnIds` is deliberately not a
  // dependency — adding a column must not re-read storage and clobber the
  // current view.
  React.useEffect(() => {
    hydrated.current = true;
    if (!persistKey || typeof window === 'undefined') return;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(STORAGE_PREFIX + persistKey);
    } catch {
      return;
    }
    const stored = parseStoredView(raw, columnIdsRef.current);
    if (stored.hidden) setOwnHidden(stored.hidden);
    if (stored.pageSize !== undefined) setPageSizeState(stored.pageSize);
    if (stored.collapsed) setCollapsed(stored.collapsed);
  }, [persistKey]);

  const persist = (patch: Partial<StoredView>) => {
    const next = { ...storedRef.current, ...patch };
    storedRef.current = next;
    if (!hydrated.current) return;
    writeStoredView(persistKey, next);
  };

  const toggleHidden = (columnId: string) => {
    const base = storedRef.current.hidden;
    const next = base.includes(columnId) ? base.filter((id) => id !== columnId) : [...base, columnId];
    if (controlled) {
      onHiddenColumnsChange?.(next);
      return;
    }
    setOwnHidden(next);
    persist({ hidden: next });
  };

  const setPageSize = (next: number | false) => {
    setPageSizeState(next);
    setRevealed({});
    persist({ pageSize: next });
  };

  const revealedFor = (key: string) => revealed[key] ?? 0;

  const revealMore = (key: string) => {
    setRevealed((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
  };

  const isCollapsed = (groupId: string, fallback: boolean) => collapsed[groupId] ?? fallback;

  const toggleCollapsed = (groupId: string, fallback: boolean) => {
    const base = storedRef.current.collapsed;
    const next = { ...base, [groupId]: !(base[groupId] ?? fallback) };
    setCollapsed(next);
    persist({ collapsed: next });
  };

  return {
    hidden,
    toggleHidden,
    pageSize,
    setPageSize,
    revealedFor,
    revealMore,
    isCollapsed,
    toggleCollapsed,
  };
}

export function DataBoardCardFace({
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
  return (
    <Card className={cn('gap-0 py-0', onClick && 'cursor-pointer', className)} onClick={onClick}>
      <div className='flex items-start gap-2 p-3'>
        {handle}
        <div className='min-w-0 flex-1 space-y-1'>
          {title != null ? <div className='text-sm font-medium leading-snug'>{title}</div> : null}
          {body}
        </div>
      </div>
    </Card>
  );
}

export function DataBoardCard({
  id,
  columnId,
  groupId,
  draggable,
  title,
  body,
  onClick,
  className,
}: {
  id: string;
  columnId: string;
  groupId?: string;
  draggable: boolean;
  title?: React.ReactNode;
  body?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({ id, disabled: !draggable });
  const { setNodeRef: setDroppableRef } = useDroppable({ id, data: { columnId, groupId }, disabled: !draggable });
  const setNodeRef = useCombinedRefs(setDraggableRef, setDroppableRef);
  return (
    <div ref={setNodeRef} className={cn(isDragging && 'opacity-50')}>
      <DataBoardCardFace
        title={title}
        body={body}
        onClick={onClick}
        className={className}
        handle={
          draggable ? (
            <button
              type='button'
              className='mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing'
              onClick={(event) => event.stopPropagation()}
              {...attributes}
              {...listeners}
            >
              <GripVertical className='size-4' />
            </button>
          ) : null
        }
      />
    </div>
  );
}

// The placeholder for the card being dragged, at the place where it would land.
// Its height is the one measured on the source card, not on the overlay.
export function DataBoardDropSlot({ fade }: { fade: boolean }) {
  const { activeNodeRect } = useDndContext();
  return (
    <div
      aria-hidden='true'
      data-slot='data-board-drop-slot'
      style={{ height: activeNodeRect?.height }}
      className={cn(
        'min-h-10 shrink-0 rounded-xl border border-dashed border-primary bg-primary/10',
        fade && 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150',
      )}
    />
  );
}

export function DataBoardColumnHeader({
  column,
  count,
  summary,
  labels,
  onAdd,
  onHide,
}: {
  column: DataBoardColumn;
  count: number;
  summary?: React.ReactNode;
  labels: DataBoardLabels;
  onAdd?: () => void;
  onHide?: () => void;
}) {
  const Icon = column.icon ?? CircleDashed;
  return (
    <div data-slot='data-board-column-header' className='group/col flex w-72 shrink-0 items-center gap-1.5 px-1.5 py-1'>
      <Icon className={cn('size-4 shrink-0 text-muted-foreground', column.accentClassName)} />
      <span className='min-w-0 truncate text-sm font-medium'>{column.label}</span>
      <span className='shrink-0 text-xs tabular-nums text-muted-foreground'>{count}</span>
      {summary != null ? (
        <span className='ml-auto shrink-0 text-xs tabular-nums text-muted-foreground'>{summary}</span>
      ) : null}
      <div className={cn('flex shrink-0 items-center', summary == null && 'ml-auto')}>
        {onAdd ? (
          <Button
            variant='ghost'
            size='icon'
            className='size-6'
            onClick={onAdd}
            aria-label={labels.addToColumn(column.label)}
          >
            <Plus className='size-4' />
          </Button>
        ) : null}
        {onHide ? (
          <Button
            variant='ghost'
            size='icon'
            className='size-6 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/col:opacity-100'
            onClick={onHide}
            aria-label={labels.hideColumn(column.label)}
          >
            <EyeOff className='size-4' />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function DataBoardColumnBody({
  columnId,
  groupId,
  scrollable,
  children,
}: {
  columnId: string;
  groupId?: string;
  scrollable?: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropZoneId(columnId, groupId),
    data: dropZoneData(columnId, groupId),
  });
  return (
    <div
      ref={setNodeRef}
      data-slot='data-board-column-body'
      className={cn(
        // `p-1.5` leaves room for a badge a consumer positions at
        // `-top-1.5 -right-1.5` on a card; without it the scrollport clips it.
        'flex w-72 shrink-0 flex-col gap-1.5 rounded-lg border border-transparent p-1.5 transition-colors',
        scrollable && 'min-h-0 overflow-x-hidden overflow-y-auto',
        isOver && 'border-border bg-muted/50',
      )}
    >
      {children}
    </div>
  );
}

export function DataBoardBandRow({
  label,
  count,
  description,
  collapsed,
  onToggle,
  footer,
  children,
}: {
  label: string;
  count: number;
  description?: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const bodyId = React.useId();
  return (
    <section className='border-b last:border-b-0'>
      <button
        type='button'
        onClick={onToggle}
        aria-expanded={!collapsed}
        // The body is unmounted when collapsed, so `aria-controls` must not
        // reference an id that is absent from the DOM.
        aria-controls={collapsed ? undefined : bodyId}
        // Sticky within the band scroller, so a band header stays visible for
        // as long as you are reading its cards.
        className='sticky top-0 z-10 flex w-full items-center gap-2 bg-background py-2 text-left'
      >
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', collapsed && '-rotate-90')}
        />
        <span data-slot='data-board-band-label' className='shrink-0 text-sm font-medium'>
          {label}
        </span>
        <span className='shrink-0 text-xs tabular-nums text-muted-foreground'>{count}</span>
        {description != null ? (
          <span
            data-slot='data-board-band-description'
            className='hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:block'
          >
            {description}
          </span>
        ) : null}
      </button>
      {collapsed ? null : (
        <>
          <div id={bodyId} data-slot='data-board-band-body' className='pb-3'>
            <div className='flex gap-2'>{children}</div>
          </div>
          {footer ? <div className='flex pb-3'>{footer}</div> : null}
        </>
      )}
    </section>
  );
}

export function DataBoardHiddenRail({
  columns,
  counts,
  labels,
  onShow,
}: {
  columns: DataBoardColumn[];
  counts: Record<string, number>;
  labels: DataBoardLabels;
  onShow: (columnId: string) => void;
}) {
  if (columns.length === 0) return null;
  return (
    <div className='flex w-12 shrink-0 flex-col items-center gap-2 border-l bg-muted/40 py-3'>
      {columns.map((column) => (
        <Tooltip key={column.id}>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              className='h-auto w-8 flex-col gap-2 px-1 py-2.5 has-[>svg]:px-1'
              onClick={() => onShow(column.id)}
              aria-label={labels.showColumn(column.label)}
            >
              <span className='max-h-40 truncate text-xs font-medium [writing-mode:vertical-rl]'>{column.label}</span>
              <Eye className={cn('size-3.5 text-muted-foreground', column.accentClassName)} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side='left'>
            {labels.showColumn(column.label)} · {counts[column.id] ?? 0}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function DataBoardToolbar({
  query,
  onQueryChange,
  searchable,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  labels,
}: {
  query: string;
  onQueryChange: (next: string) => void;
  searchable: boolean;
  pageSize: number | false;
  pageSizeOptions: number[];
  onPageSizeChange: (next: number) => void;
  labels: DataBoardLabels;
}) {
  const showPageSize = pageSizeOptions.length > 1 && pageSize !== false;
  // `pageSize` and `pageSizeOptions` default independently, so a consumer who
  // overrides only one leaves the select holding a value that matches no item,
  // which renders as an empty trigger. Fold the active size in.
  const options = React.useMemo(() => {
    if (pageSize === false || pageSizeOptions.includes(pageSize)) return pageSizeOptions;
    return [...pageSizeOptions, pageSize].sort((a, b) => a - b);
  }, [pageSizeOptions, pageSize]);
  if (!searchable && !showPageSize) return null;
  return (
    <div className='flex shrink-0 items-center gap-2'>
      {searchable ? (
        <div className='relative w-full max-w-xs'>
          <Search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            className='pl-8'
          />
        </div>
      ) : null}
      {showPageSize ? (
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger size='sm' className='ml-auto w-36' aria-label={labels.pageSizeLabel}>
            <SelectValue>{labels.pageSizeOption(pageSize)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {labels.pageSizeOption(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}

export type DataBoardMoveEvent<T> = {
  item: T;
  fromColumn: string;
  toColumn: string;
  toIndex: number;
  fromGroup?: string;
  toGroup?: string;
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
function useDataBoardDrag<T extends object>({
  data,
  defaultData,
  columnField,
  positionField,
  groupBy,
  ungroupedLabel,
  accessors,
  renderedIdsRef,
  view,
  onDataChange,
  onCardMove,
}: {
  data?: T[];
  defaultData?: T[];
  columnField: keyof T;
  positionField?: keyof T;
  groupBy?: DataBoardGroupBy<T>;
  ungroupedLabel: string;
  accessors: CardAccessors<T>;
  renderedIdsRef: React.RefObject<ReadonlySet<string>>;
  view: DataBoardView;
  onDataChange?: (items: T[]) => void;
  onCardMove?: (event: DataBoardMoveEvent<T>) => void;
}) {
  const { getId, getColumn, getGroup } = accessors;
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
  // `entering` tells that the slot just came into its cell, as opposed to having
  // moved inside it.
  const [previewState, setPreviewState] = React.useState<{ slot: DropSlot; entering: boolean } | null>(null);

  const bands = React.useMemo(
    () => (groupBy ? buildGroups(items, groupBy, ungroupedLabel) : null),
    [items, groupBy, ungroupedLabel],
  );

  // Writes the target cell into the card. The band's value is written, not its
  // id: a board grouped by a numeric field expects the number back, not its
  // string form.
  const withCell = (item: T, cell: CardCell): T => {
    const columnChanged = getColumn(item) !== cell.columnId;
    const groupChanged = cell.groupId != null && getGroup(item) !== cell.groupId;
    if (!columnChanged && !groupChanged) return item;
    const next = { ...item } as Record<string, unknown>;
    if (columnChanged) next[columnField as string] = cell.columnId;
    if (groupChanged && groupBy) {
      next[groupBy.field as string] = bands?.find((band) => band.id === cell.groupId)?.value ?? null;
    }
    return next as T;
  };

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
    const toGroup = getGroup(movedItem);
    const toIndex = cellIds(next, { columnId: toColumn }, accessors).indexOf(activeCardId);

    // A card dropped past its target cell's paginated window would be invisible
    // until the next "show more": open just enough steps to reveal it.
    const key = toGroup == null ? columnKey(toColumn) : bandKey(toGroup);
    const indexInCell =
      toGroup == null
        ? toIndex
        : cellIds(next, { columnId: toColumn, groupId: toGroup }, accessors).indexOf(activeCardId);
    const steps = revealStepsFor(view.pageSize, view.revealedFor(key), indexInCell);
    for (let step = 0; step < steps; step++) view.revealMore(key);

    setItems(next);
    drainPendingData(false);
    onDataChange?.(next);
    onCardMove?.({
      item: movedItem,
      fromColumn: origin.columnId,
      toColumn,
      toIndex,
      fromGroup: origin.groupId,
      toGroup,
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
    bands,
    handlers: {
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
    },
  };
}

export type DataBoardProps<T extends object> = {
  columns: DataBoardColumn[];
  data?: T[];
  defaultData?: T[];
  onDataChange?: (next: T[]) => void;
  idField?: keyof T;
  columnField: keyof T;
  positionField?: DataBoardPositionField<T>;
  title?: (item: T) => React.ReactNode;
  fields?: DataBoardField<T>[];
  cardContent?: (item: T) => React.ReactNode;
  cardClassName?: (item: T) => string | undefined;
  wrapCard?: (item: T, card: React.ReactNode) => React.ReactNode;
  renderColumnSummary?: (items: T[], column: DataBoardColumn) => React.ReactNode;
  onCardAdd?: (columnId: string) => void;
  onCardClick?: (item: T) => void;
  onCardMove?: (event: DataBoardMoveEvent<T>) => void;
  searchableFields?: (keyof T)[];
  groupBy?: DataBoardGroupBy<T>;
  pageSize?: number | false;
  pageSizeOptions?: number[];
  hiddenColumns?: string[];
  onHiddenColumnsChange?: (ids: string[]) => void;
  persistKey?: string;
  height?: number | string;
  labels?: Partial<DataBoardLabels>;
  className?: string;
};

export function DataBoard<T extends object>({
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
  cardClassName,
  wrapCard,
  renderColumnSummary,
  onCardAdd,
  onCardClick,
  onCardMove,
  searchableFields,
  groupBy,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50],
  hiddenColumns,
  onHiddenColumnsChange,
  persistKey,
  height,
  labels: labelOverrides,
  className,
}: DataBoardProps<T>) {
  const dndId = React.useId();
  const labels = React.useMemo(() => ({ ...DEFAULT_LABELS, ...labelOverrides }), [labelOverrides]);

  const getId = React.useCallback((item: T) => String(item[idField]), [idField]);
  const getColumn = React.useCallback((item: T) => String(item[columnField]), [columnField]);
  const getGroup = React.useCallback(
    (item: T): string | undefined => (groupBy ? groupIdOf(item[groupBy.field]) : undefined),
    [groupBy],
  );

  // A drag with no handler cannot accomplish anything: it would mutate local
  // state without persisting, and the consumer's next refetch would undo it.
  // Either handler is enough — a read-only board passes neither.
  const draggable = onCardMove != null || onDataChange != null;

  const view = useDataBoardView({
    persistKey,
    columnIds: columns.map((column) => column.id),
    defaultPageSize: pageSize,
    hiddenColumns,
    onHiddenColumnsChange,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const shownColumns = React.useMemo(() => visibleColumns(columns, view.hidden), [columns, view.hidden]);
  const hiddenColumnList = React.useMemo(() => {
    const hiddenSet = new Set(view.hidden);
    return columns.filter((column) => hiddenSet.has(column.id));
  }, [columns, view.hidden]);

  const accessors = React.useMemo<CardAccessors<T>>(
    () => ({ getId, getColumn, getGroup }),
    [getId, getColumn, getGroup],
  );

  const renderedIdsRef = React.useRef<ReadonlySet<string>>(new Set());

  const { items, activeId, preview, slotEntering, bands, handlers } = useDataBoardDrag<T>({
    data,
    defaultData,
    columnField,
    positionField,
    groupBy,
    ungroupedLabel: labels.ungrouped,
    accessors,
    renderedIdsRef,
    view,
    onDataChange,
    onCardMove,
  });

  const [query, setQuery] = React.useState('');
  const deferredQuery = React.useDeferredValue(query);

  // Search is purely visual: it narrows what is rendered and never mutates the
  // card list the drag machine owns.
  const searchable = Boolean(searchableFields?.length);
  const visibleItems = React.useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle || !searchableFields?.length) return items;
    return items.filter((item) =>
      searchableFields.some((field) =>
        String(item[field] ?? '')
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [items, deferredQuery, searchableFields]);

  // Bands are built from the unfiltered list so a band never disappears
  // mid-search; this set is what narrows each cell.
  const visibleIds = React.useMemo(() => new Set(visibleItems.map(getId)), [visibleItems, getId]);
  const shownColumnIds = React.useMemo(() => new Set(shownColumns.map((column) => column.id)), [shownColumns]);

  const itemsByColumn = React.useMemo(() => {
    const grouped = new Map<string, T[]>(columns.map((column) => [column.id, []]));
    for (const item of visibleItems) grouped.get(getColumn(item))?.push(item);
    return grouped;
  }, [columns, visibleItems, getColumn]);

  const counts = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const column of columns) out[column.id] = (itemsByColumn.get(column.id) ?? []).length;
    return out;
  }, [columns, itemsByColumn]);

  const activeItem = activeId ? (items.find((item) => getId(item) === activeId) ?? null) : null;

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

  // The cell the drop slot is in, without the dragged card.
  const previewOrder = React.useMemo(
    () => (preview && activeId ? cellOrder(items, preview, activeId, accessors) : []),
    [items, preview, activeId, accessors],
  );

  // `key` carries the pagination: a column in flat mode, a whole band in grouped mode.
  const pageOf = (all: T[], key: string) => paginate(all, limitFor(view.pageSize, view.revealedFor(key)));

  // The cells as rendered: what the pagination and the search leave of each one.
  const columnCells = bands
    ? []
    : shownColumns.map((column) => {
        const key = columnKey(column.id);
        return { column, key, ...pageOf(itemsByColumn.get(column.id) ?? [], key) };
      });
  const bandRows = (bands ?? []).map((band) => {
    const key = bandKey(band.id);
    // Narrowed by both search and column visibility so the header count always
    // agrees with the cells rendered beneath it.
    const bandItems = band.items.filter((item) => visibleIds.has(getId(item)) && shownColumnIds.has(getColumn(item)));
    const cells = shownColumns.map((column) => ({
      column,
      ...pageOf(
        bandItems.filter((item) => getColumn(item) === column.id),
        key,
      ),
    }));
    return { band, key, bandItems, cells };
  });

  // Read by the drag handlers to land a card where the drop slot is drawn.
  // Resynchronised on commit, never during render.
  const renderedIds = new Set(
    [...columnCells, ...bandRows.flatMap(({ cells }) => cells)].flatMap(({ shown }) => shown.map(getId)),
  );
  React.useEffect(() => {
    renderedIdsRef.current = renderedIds;
  });

  const renderCards = (
    list: T[],
    column: DataBoardColumn,
    groupId: string | undefined,
    slotBeforeId: string | null | undefined,
  ) => {
    const cards = list.map((item) => {
      const card = (
        <DataBoardCard
          id={getId(item)}
          columnId={column.id}
          groupId={groupId}
          draggable={draggable}
          title={renderTitle(item)}
          body={renderBody(item)}
          className={cardClassName?.(item)}
          onClick={onCardClick ? () => onCardClick(item) : undefined}
        />
      );
      return (
        <React.Fragment key={getId(item)}>
          {slotBeforeId === getId(item) ? <DataBoardDropSlot fade={slotEntering} /> : null}
          {wrapCard ? wrapCard(item, card) : card}
        </React.Fragment>
      );
    });
    return slotBeforeId === null ? [...cards, <DataBoardDropSlot key={DROP_SLOT_KEY} fade={slotEntering} />] : cards;
  };

  const renderMoreButton = (key: string, remaining: number, buttonClassName: string) => (
    <Button
      variant='outline'
      size='sm'
      className={cn(buttonClassName, 'text-muted-foreground')}
      onClick={() => view.revealMore(key)}
    >
      {labels.showMore(remaining)}
    </Button>
  );

  // A flat-mode column scrolls on its own and carries its own "show more";
  // a grouped-mode cell delegates both to its band. `slotBeforeId` is the card
  // the drop slot goes before, null for the end of the cell, and undefined when
  // the slot is in another cell.
  const renderColumnBody = (
    column: DataBoardColumn,
    rendered: T[],
    remaining: number,
    key: string,
    groupId?: string,
  ) => {
    const slotBeforeId =
      activeId != null && preview != null && isSameCell(preview, { columnId: column.id, groupId })
        ? slotPlacement({ order: previewOrder, renderedIds: rendered.map(getId), activeId, index: preview.index })
        : undefined;
    return (
      <DataBoardColumnBody key={column.id} columnId={column.id} groupId={groupId} scrollable={groupId == null}>
        {rendered.length === 0 && slotBeforeId === undefined ? (
          <p className='rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground'>
            {labels.empty}
          </p>
        ) : (
          renderCards(rendered, column, groupId, slotBeforeId)
        )}
        {groupId == null && remaining > 0 ? renderMoreButton(key, remaining, 'w-full') : null}
      </DataBoardColumnBody>
    );
  };

  const rootStyle: React.CSSProperties =
    height == null ? {} : { height: typeof height === 'number' ? `${height}px` : height };

  return (
    <div
      data-slot='data-board'
      style={rootStyle}
      className={cn('flex w-full min-w-0 min-h-0 flex-col gap-3', className)}
    >
      <DataBoardToolbar
        query={query}
        onQueryChange={setQuery}
        searchable={searchable}
        pageSize={view.pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={view.setPageSize}
        labels={labels}
      />

      <DndContext id={dndId} sensors={sensors} collisionDetection={detectBoardCollision} {...handlers}>
        <div className='flex min-h-0 flex-1'>
          <div className='min-h-0 flex-1 overflow-x-auto overflow-y-hidden'>
            {shownColumns.length === 0 ? (
              <p className='grid h-full place-items-center text-sm text-muted-foreground'>{labels.allColumnsHidden}</p>
            ) : (
              <div className='flex h-full w-max min-w-full flex-col'>
                <div className='flex shrink-0 gap-2 border-b pb-2'>
                  {shownColumns.map((column) => (
                    <DataBoardColumnHeader
                      key={column.id}
                      column={column}
                      count={counts[column.id] ?? 0}
                      summary={renderColumnSummary?.(itemsByColumn.get(column.id) ?? [], column)}
                      labels={labels}
                      onAdd={onCardAdd ? () => onCardAdd(column.id) : undefined}
                      onHide={() => view.toggleHidden(column.id)}
                    />
                  ))}
                </div>
                {bands ? (
                  <div className='min-h-0 flex-1 overflow-y-auto'>
                    {bandRows.map(({ band, key, bandItems, cells }) => {
                      const fallback = groupBy?.defaultCollapsed?.(band.id) ?? false;
                      const remainingInBand = cells.reduce((total, cell) => total + cell.hidden, 0);
                      return (
                        <DataBoardBandRow
                          key={band.id}
                          label={band.label}
                          count={bandItems.length}
                          description={groupBy?.description?.(band.value)}
                          collapsed={view.isCollapsed(band.id, fallback)}
                          onToggle={() => view.toggleCollapsed(band.id, fallback)}
                          footer={remainingInBand > 0 ? renderMoreButton(key, remainingInBand, 'self-start') : null}
                        >
                          {cells.map((cell) => renderColumnBody(cell.column, cell.shown, cell.hidden, key, band.id))}
                        </DataBoardBandRow>
                      );
                    })}
                  </div>
                ) : (
                  <div className='flex min-h-0 flex-1 gap-2 pt-2'>
                    {columnCells.map(({ column, key, shown, hidden }) => renderColumnBody(column, shown, hidden, key))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DataBoardHiddenRail columns={hiddenColumnList} counts={counts} labels={labels} onShow={view.toggleHidden} />
        </div>

        <DragOverlay>
          {activeItem ? (
            <DataBoardCardFace
              title={renderTitle(activeItem)}
              body={renderBody(activeItem)}
              className={cn('rotate-3 shadow-lg', cardClassName?.(activeItem))}
              handle={<GripVertical className='mt-0.5 size-4 shrink-0 text-muted-foreground' />}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
