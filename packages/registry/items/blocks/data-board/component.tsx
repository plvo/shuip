'use client';

import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
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
        aria-controls={bodyId}
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
