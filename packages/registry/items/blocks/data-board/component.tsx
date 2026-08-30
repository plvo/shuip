'use client';

import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';

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
