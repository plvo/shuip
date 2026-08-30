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
