'use client';

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

export const columnKey = (columnId: string) => `col:${columnId}`;

// Pagination applies per cell (column x band) but the key is the band's:
// one "show more" raises every column in the band at once.
export const bandKey = (groupId: string) => `band:${groupId}`;

export function dropZoneId(columnId: string, groupId?: string): string {
  return groupId == null ? columnId : `${groupId}${DROP_SEPARATOR}${columnId}`;
}

export function parseDropZoneId(id: string): { columnId: string; groupId?: string } {
  const at = id.indexOf(DROP_SEPARATOR);
  if (at === -1) return { columnId: id };
  return { groupId: id.slice(0, at), columnId: id.slice(at + DROP_SEPARATOR.length) };
}

// The hovered zone when there is one, otherwise the cell of the hovered card.
// `groupId` stays absent outside grouped mode.
export function resolveDropTarget({
  overId,
  zones,
  overItem,
}: {
  overId: string;
  zones: Set<string>;
  overItem: { columnId: string; groupId?: string } | null;
}): { columnId: string; groupId?: string } | null {
  if (zones.has(overId)) return parseDropZoneId(overId);
  if (overItem) return { ...overItem };
  return null;
}

// A move that changes neither column, rank nor band has nothing to report.
// `fromGroup` and `toGroup` are both undefined outside grouped mode, which
// neutralises their comparison.
export function isSamePosition(move: {
  fromColumn: string;
  toColumn: string;
  fromIndex: number | null;
  toIndex: number;
  fromGroup?: string;
  toGroup?: string;
}): boolean {
  return move.fromColumn === move.toColumn && move.fromIndex === move.toIndex && move.fromGroup === move.toGroup;
}

// A card dropped outside the paginated slice must stay mounted: unmounting it
// mid-drag would make it vanish until the next "show more" and would deprive
// dnd-kit of its active node. `shown` is a prefix of `all`, so appending the
// card preserves order.
export function withActiveCard<T>(
  all: T[],
  shown: T[],
  hidden: number,
  activeId: string | null,
  getId: (item: T) => string,
): { rendered: T[]; remaining: number } {
  if (activeId == null || shown.some((item) => getId(item) === activeId)) return { rendered: shown, remaining: hidden };
  const active = all.find((item) => getId(item) === activeId);
  if (!active) return { rendered: shown, remaining: hidden };
  return { rendered: [...shown, active], remaining: hidden - 1 };
}

// A band emptied mid-drag would disappear under the cursor: the layout would
// jump, dnd-kit's measurements would go stale, and the card could no longer
// return to its original band. Bands present at drag start stay rendered —
// empty, in place — until the drag ends. A band born during the drag is added.
export function withPinnedBands<T>(bands: DataBoardBand<T>[], pinned: DataBoardBand<T>[] | null): DataBoardBand<T>[] {
  if (!pinned) return bands;
  const live = new Map(bands.map((band) => [band.id, band]));
  const pinnedIds = new Set(pinned.map((band) => band.id));
  const kept = pinned.map((band) => live.get(band.id) ?? { ...band, items: [] });
  return [...kept, ...bands.filter((band) => !pinnedIds.has(band.id))];
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { columnId, groupId },
    disabled: !draggable,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50')}>
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
  zoneId,
  scrollable,
  children,
}: {
  zoneId: string;
  scrollable?: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });
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
            className='pl-8'
          />
        </div>
      ) : null}
      {showPageSize ? (
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger size='sm' className='ml-auto w-36' aria-label={labels.pageSizeLabel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
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
};

/**
 * The board's live card list and the drag state machine that mutates it.
 *
 * Hovering reorders optimistically; `onCardMove` fires on drop and only when
 * the position actually changed. Every decision that does not need the DOM
 * lives in the pure helpers above and is tested separately.
 */
function useDataBoardDrag<T extends object>({
  data,
  defaultData,
  columnField,
  groupBy,
  ungroupedLabel,
  getId,
  getColumn,
  getGroup,
  shownColumns,
  view,
  onDataChange,
  onCardMove,
}: {
  data?: T[];
  defaultData?: T[];
  columnField: keyof T;
  groupBy?: DataBoardGroupBy<T>;
  ungroupedLabel: string;
  getId: (item: T) => string;
  getColumn: (item: T) => string;
  getGroup: (item: T) => string | undefined;
  shownColumns: DataBoardColumn[];
  view: DataBoardView;
  onDataChange?: (items: T[]) => void;
  onCardMove?: (event: DataBoardMoveEvent<T>) => void;
}) {
  const [items, setItems] = React.useState<T[]>(() => data ?? defaultData ?? []);
  const draggingRef = React.useRef(false);
  const fromColumnRef = React.useRef<string | null>(null);
  const fromIndexRef = React.useRef<number | null>(null);
  const fromGroupRef = React.useRef<string | undefined>(undefined);
  const startItemsRef = React.useRef<T[] | null>(null);
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

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pinnedBands, setPinnedBands] = React.useState<DataBoardBand<T>[] | null>(null);

  const bands = React.useMemo(
    () => (groupBy ? withPinnedBands(buildGroups(items, groupBy, ungroupedLabel), pinnedBands) : null),
    [items, groupBy, ungroupedLabel, pinnedBands],
  );

  const zoneIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const column of shownColumns) {
      if (bands) for (const band of bands) ids.add(dropZoneId(column.id, band.id));
      else ids.add(dropZoneId(column.id));
    }
    return ids;
  }, [shownColumns, bands]);

  // With no `groupId`, the index spans the whole column (flat mode); with one,
  // it spans only the column x band cell, which is the paginated unit.
  const cellIndexOf = React.useCallback(
    (list: T[], columnId: string, groupId: string | undefined, cardId: string) =>
      list
        .filter((item) => getColumn(item) === columnId && (groupId == null || getGroup(item) === groupId))
        .findIndex((item) => getId(item) === cardId),
    [getColumn, getGroup, getId],
  );

  // Applied when the drag produced no change. On the success path the board
  // emits `onDataChange` instead, which makes the parent the source of truth
  // and leaves any value held here stale.
  const drainPendingData = (apply: boolean) => {
    const pending = pendingDataRef.current;
    pendingDataRef.current = null;
    if (apply && pending) setItems(pending);
  };

  function handleDragStart(event: DragStartEvent) {
    draggingRef.current = true;
    const id = String(event.active.id);
    const startItem = items.find((item) => getId(item) === id);
    const startColumn = startItem ? getColumn(startItem) : null;
    fromColumnRef.current = startColumn;
    fromIndexRef.current = startColumn == null ? null : cellIndexOf(items, startColumn, undefined, id);
    fromGroupRef.current = startItem ? getGroup(startItem) : undefined;
    startItemsRef.current = items;
    setPinnedBands(bands);
    setActiveId(id);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeCardId = String(active.id);
    const overId = String(over.id);
    if (activeCardId === overId) return;

    setItems((prev) => {
      const activeIndex = prev.findIndex((item) => getId(item) === activeCardId);
      if (activeIndex < 0) return prev;

      const overIsZone = zoneIds.has(overId);
      const overItem = overIsZone ? undefined : prev.find((item) => getId(item) === overId);
      const target = resolveDropTarget({
        overId,
        zones: zoneIds,
        overItem: overItem ? { columnId: getColumn(overItem), groupId: getGroup(overItem) } : null,
      });
      if (!target) return prev;

      const current = prev[activeIndex];
      const columnChanged = getColumn(current) !== target.columnId;
      const groupChanged = target.groupId != null && getGroup(current) !== target.groupId;
      // Write the band's value, not its id: a board grouped by a numeric field
      // expects the number back, not its string form.
      const bandValue = bands?.find((band) => band.id === target.groupId)?.value ?? null;

      const updated =
        columnChanged || groupChanged
          ? prev.map((item, index) => {
              if (index !== activeIndex) return item;
              const next = { ...item } as Record<string, unknown>;
              if (columnChanged) next[columnField as string] = target.columnId;
              if (groupChanged && groupBy) next[groupBy.field as string] = bandValue;
              return next as T;
            })
          : prev;
      const activeIndexNow =
        columnChanged || groupChanged ? updated.findIndex((item) => getId(item) === activeCardId) : activeIndex;

      const inTargetCell = (item: T) =>
        getColumn(item) === target.columnId && (target.groupId == null || getGroup(item) === target.groupId);

      let overIndex = activeIndexNow;
      if (overIsZone) {
        for (let index = 0; index < updated.length; index++) {
          if (getId(updated[index]) !== activeCardId && inTargetCell(updated[index])) overIndex = index;
        }
      } else {
        overIndex = updated.findIndex((item) => getId(item) === overId);
      }

      if (overIndex < 0 || (!columnChanged && !groupChanged && overIndex === activeIndexNow)) return updated;
      return arrayMove(updated, activeIndexNow, overIndex);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    draggingRef.current = false;
    setActiveId(null);
    setPinnedBands(null);
    const fromColumn = fromColumnRef.current;
    const fromIndex = fromIndexRef.current;
    const fromGroup = fromGroupRef.current;
    fromColumnRef.current = null;
    fromIndexRef.current = null;
    fromGroupRef.current = undefined;
    if (fromColumn == null) {
      drainPendingData(true);
      return;
    }

    const activeCardId = String(event.active.id);
    const movedItem = items.find((item) => getId(item) === activeCardId);
    if (!movedItem) {
      drainPendingData(true);
      return;
    }

    const toColumn = getColumn(movedItem);
    const toIndex = cellIndexOf(items, toColumn, undefined, activeCardId);
    const toGroup = getGroup(movedItem);
    startItemsRef.current = null;
    if (isSamePosition({ fromColumn, toColumn, fromIndex, toIndex, fromGroup, toGroup })) {
      drainPendingData(true);
      return;
    }

    // A card dropped past its target cell's paginated window would be invisible
    // until the next "show more": open just enough steps to reveal it.
    const key = toGroup == null ? columnKey(toColumn) : bandKey(toGroup);
    const indexInCell = toGroup == null ? toIndex : cellIndexOf(items, toColumn, toGroup, activeCardId);
    const steps = revealStepsFor(view.pageSize, view.revealedFor(key), indexInCell);
    for (let step = 0; step < steps; step++) view.revealMore(key);

    drainPendingData(false);
    onDataChange?.(items);
    onCardMove?.({ item: movedItem, fromColumn, toColumn, toIndex, fromGroup, toGroup });
  }

  function handleDragCancel() {
    draggingRef.current = false;
    const snapshot = startItemsRef.current;
    startItemsRef.current = null;
    fromColumnRef.current = null;
    fromIndexRef.current = null;
    fromGroupRef.current = undefined;
    setActiveId(null);
    setPinnedBands(null);
    if (snapshot) setItems(snapshot);
    drainPendingData(true);
  }

  return {
    items,
    activeId,
    bands,
    handlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
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

  const { items, activeId, bands, handlers } = useDataBoardDrag<T>({
    data,
    defaultData,
    columnField,
    groupBy,
    ungroupedLabel: labels.ungrouped,
    getId,
    getColumn,
    getGroup,
    shownColumns,
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

  // The rendered slice of a cell. `key` carries the pagination: a column in
  // flat mode, a whole band in grouped mode.
  const sliceOf = (all: T[], key: string) => {
    const { shown, hidden } = paginate(all, limitFor(view.pageSize, view.revealedFor(key)));
    return withActiveCard(all, shown, hidden, activeId, getId);
  };

  const renderCards = (list: T[], column: DataBoardColumn, groupId?: string) =>
    list.map((item) => {
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
      return <React.Fragment key={getId(item)}>{wrapCard ? wrapCard(item, card) : card}</React.Fragment>;
    });

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
  // a grouped-mode cell delegates both to its band.
  const renderColumnBody = (
    column: DataBoardColumn,
    rendered: T[],
    remaining: number,
    key: string,
    groupId?: string,
  ) => (
    <DataBoardColumnBody key={column.id} zoneId={dropZoneId(column.id, groupId)} scrollable={groupId == null}>
      <SortableContext items={rendered.map(getId)} strategy={verticalListSortingStrategy}>
        {rendered.length === 0 ? (
          <p className='rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground'>
            {labels.empty}
          </p>
        ) : (
          renderCards(rendered, column, groupId)
        )}
      </SortableContext>
      {groupId == null && remaining > 0 ? renderMoreButton(key, remaining, 'w-full') : null}
    </DataBoardColumnBody>
  );

  const rootStyle: React.CSSProperties =
    height == null ? {} : { height: typeof height === 'number' ? `${height}px` : height };

  return (
    <div data-slot='data-board' style={rootStyle} className={cn('flex min-h-0 flex-col gap-3', className)}>
      <DataBoardToolbar
        query={query}
        onQueryChange={setQuery}
        searchable={searchable}
        pageSize={view.pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={view.setPageSize}
        labels={labels}
      />

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCorners} {...handlers}>
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
                    {bands.map((band) => {
                      const key = bandKey(band.id);
                      const fallback = groupBy?.defaultCollapsed?.(band.id) ?? false;
                      // Narrowed by both search and column visibility so the header count always
                      // agrees with the cells rendered beneath it.
                      const bandItems = band.items.filter(
                        (item) => visibleIds.has(getId(item)) && shownColumnIds.has(getColumn(item)),
                      );
                      const cells = shownColumns.map((column) => {
                        const all = bandItems.filter((item) => getColumn(item) === column.id);
                        return { column, ...sliceOf(all, key) };
                      });
                      const remainingInBand = cells.reduce((total, cell) => total + cell.remaining, 0);
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
                          {cells.map((cell) =>
                            renderColumnBody(cell.column, cell.rendered, cell.remaining, key, band.id),
                          )}
                        </DataBoardBandRow>
                      );
                    })}
                  </div>
                ) : (
                  <div className='flex min-h-0 flex-1 gap-2 pt-2'>
                    {shownColumns.map((column) => {
                      const all = itemsByColumn.get(column.id) ?? [];
                      const key = columnKey(column.id);
                      const { rendered, remaining } = sliceOf(all, key);
                      return renderColumnBody(column, rendered, remaining, key);
                    })}
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
