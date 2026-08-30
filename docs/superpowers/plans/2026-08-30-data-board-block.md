# Data board block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a new shuip block, `data-board`, that renders typed items into draggable columns with bounded height, optional grouping into bands, per-column pagination, hideable columns, and a persisted view.

**Architecture:** One `component.tsx` under `packages/registry/items/blocks/data-board/`, built up across tasks in a fixed section order — pure helpers, then view state, then presentational subcomponents, then the drag state machine and orchestrator. The pure helpers are covered by `bun test`; everything above them is verified by `bun build:docs` and browser dogfooding.

**Tech Stack:** React 19, TypeScript 6, Tailwind v4 (CSS-only), `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`, `lucide-react`, shadcn primitives from `@/components/ui/*`, Bun's built-in test runner, Biome.

**Spec:** `docs/superpowers/specs/2026-08-30-data-board-block-design.md`

## Global Constraints

- **Branch:** `feat/data-board-block`. Already created and checked out.
- **This is a public open-source repo.** English only, in code, comments, commit messages and docs. Never reference a private or personal project in a commit message, comment, or doc.
- **Do not modify `packages/registry/items/blocks/kanban/`.** The only permitted edit to the existing block is one cross-reference sentence in `apps/docs/content/blocks/kanban.mdx` (Task 7).
- **Generated artifacts are gitignored and must never be staged.** `packages/registry/registry.json`, `packages/registry/__index__.ts` and `packages/registry/stubs/` are listed in `.gitignore` (lines 62-64). `git add` on any of them fails with exit 1; never reach for `git add -f`. Stage only sources under `items/` and `apps/docs/content/`. Reading these files to verify generator output is correct and expected.
- **Never edit generated artifacts:** `packages/registry/registry.json`, `packages/registry/__index__.ts`, `packages/registry/stubs/**`, `apps/docs/public/r/**`, `apps/docs/content/components/**` symlinks. Edit sources under `items/` and run `bun registry:generate`.
- **Item folder name is `data-board`, unprefixed.** The `blocks` category applies no prefix; registry name is `data-board`.
- **Exact filename `component.tsx`.** Anything else and the generator silently skips the item.
- **No `index.mdx` in the item folder.** Block docs are a real MDX file at `apps/docs/content/blocks/data-board.mdx`.
- **No new dependencies.** `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2` and `lucide-react` are already in the root `workspaces.catalog` and referenced by both `packages/registry` and `apps/docs`. Bun's test runner is built in.
- **`registryDependencies` are parsed only from `component.tsx`**, only from `@/components/ui/<name>` imports. Expected set: `button`, `card`, `input`, `select`, `tooltip`.
- **`component.tsx` must not import `@/components/ui/shuip/*`** — that would be a circular stub import.
- **Examples import via the stub alias** `@/components/block/shuip/data-board`, never `./component`.
- **Theme tokens only.** No hardcoded colors in the block. `accentClassName` is a consumer-supplied class string, passed through verbatim, never interpolated into a Tailwind class name.
- **All user-facing strings come from the `labels` object.** No bare English string literals in JSX.
- **`localeCompare` takes no locale argument.**
- **Naming:** no `New`, `V2`, `Enhanced`, `Improved`, `Legacy`, `Wrapper`, `Manager`, `Factory`. No comment may reference what the code used to be or compare it to another implementation.
- **Run `bun check` before every commit.** Biome: single quotes, 2-space indent, 120 columns, trailing commas. Lint-staged runs it on commit anyway.
- **Commit after every task.** Conventional commits, English, scope `data-board`.
- **Do not start a dev server.** The docs site is already served at https://docs.localhost:1355.

## File Structure

| File | Responsibility |
|------|----------------|
| `packages/registry/items/blocks/data-board/component.tsx` | The entire published block. Sections in order: types → labels → pure helpers → `useDataBoardView` → `useDataBoardDrag` → subcomponents → `DataBoard`. |
| `packages/registry/items/blocks/data-board/component.test.ts` | `bun test` coverage of the pure helpers only. Invisible to the generator. |
| `packages/registry/items/blocks/data-board/default.example.tsx` | Flat mode, uncontrolled, bounded height, pagination, search. |
| `packages/registry/items/blocks/data-board/grouped.example.tsx` | `groupBy` bands, explicit group order, `persistKey`. |
| `packages/registry/items/blocks/data-board/custom-card.example.tsx` | Controlled mode, `cardContent`, `cardClassName`, `wrapCard`, `renderColumnSummary`. |
| `apps/docs/content/blocks/data-board.mdx` | Doc page in the `blocks` fumadocs collection. |
| `apps/docs/content/blocks/kanban.mdx` | One added cross-reference sentence. Nothing else. |

Why one file: the sibling blocks are single files by convention (`data-table` 1584 lines, `calendar` 1389). A `shadcn add` drops one file, and the generator only scans `component.tsx` for dependencies — siblings under `extras/` would install to a different directory *and* have their `registryDependencies` silently dropped.

---

### Task 1: Grouping and pagination helpers

**Files:**
- Create: `packages/registry/items/blocks/data-board/component.tsx`
- Test: `packages/registry/items/blocks/data-board/component.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `UNGROUPED_ID: string`; types `DataBoardColumn`, `DataBoardGroup`, `DataBoardGroupBy<T>`, `DataBoardBand<T>`, `DataBoardField<T>`; functions `groupIdOf(value: unknown): string`, `buildGroups<T extends object>(items: T[], groupBy: DataBoardGroupBy<T>, ungroupedLabel: string): DataBoardBand<T>[]`, `paginate<T>(items: T[], limit: number): { shown: T[]; hidden: number }`, `limitFor(pageSize: number | false, revealed: number): number`, `visibleColumns(columns: DataBoardColumn[], hidden: string[]): DataBoardColumn[]`.

Note the third parameter on `buildGroups`: the "no group" label comes from the `labels` object (Task 3), not from `groupBy`, so the helper takes it explicitly and stays pure.

- [ ] **Step 1: Write the failing test**

Create `packages/registry/items/blocks/data-board/component.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';
import { buildGroups, groupIdOf, limitFor, paginate, UNGROUPED_ID, visibleColumns } from './component';

type Task = { id: string; status: string; sprint?: number | null; team?: string };

const task = (id: string, sprint?: number | null, team?: string): Task => ({ id, status: 'todo', sprint, team });

describe('groupIdOf', () => {
  test('maps null and undefined to the ungrouped bucket', () => {
    expect(groupIdOf(null)).toBe(UNGROUPED_ID);
    expect(groupIdOf(undefined)).toBe(UNGROUPED_ID);
  });

  test('stringifies any other value', () => {
    expect(groupIdOf(3)).toBe('3');
    expect(groupIdOf('alpha')).toBe('alpha');
    expect(groupIdOf(0)).toBe('0');
    expect(groupIdOf(false)).toBe('false');
  });
});

describe('buildGroups', () => {
  test('derives bands from the values present', () => {
    const bands = buildGroups([task('a', 1), task('b', 2), task('c', 1)], { field: 'sprint' }, 'Ungrouped');
    expect(bands.map((b) => b.id)).toEqual(['1', '2']);
    expect(bands[0].items.map((i) => i.id)).toEqual(['a', 'c']);
  });

  test('sorts numerically when every value is numeric', () => {
    const bands = buildGroups([task('a', 10), task('b', 2), task('c', 1)], { field: 'sprint' }, 'Ungrouped');
    expect(bands.map((b) => b.id)).toEqual(['1', '2', '10']);
  });

  test('sorts alphabetically when values are not numeric', () => {
    const items = [task('a', null, 'ops'), task('b', null, 'crm'), task('c', null, 'finance')];
    const bands = buildGroups(items, { field: 'team' }, 'Ungrouped');
    expect(bands.map((b) => b.id)).toEqual(['crm', 'finance', 'ops']);
  });

  test('puts null and undefined values last, under the ungrouped label', () => {
    const bands = buildGroups([task('a', null), task('b', 2), task('c')], { field: 'sprint' }, 'No sprint');
    expect(bands.map((b) => b.id)).toEqual(['2', UNGROUPED_ID]);
    expect(bands[1].label).toBe('No sprint');
    expect(bands[1].items.map((i) => i.id)).toEqual(['a', 'c']);
  });

  test('preserves the item value on the band, not the stringified id', () => {
    const bands = buildGroups([task('a', 7)], { field: 'sprint' }, 'Ungrouped');
    expect(bands[0].value).toBe(7);
  });

  test('an explicit groups array imposes order and keeps empty groups', () => {
    const bands = buildGroups([task('a', 2)], {
      field: 'sprint',
      groups: [
        { id: '2', label: 'Sprint 2' },
        { id: '1', label: 'Sprint 1' },
      ],
    }, 'Ungrouped');
    expect(bands.map((b) => b.id)).toEqual(['2', '1']);
    expect(bands.map((b) => b.label)).toEqual(['Sprint 2', 'Sprint 1']);
    expect(bands[1].items).toEqual([]);
  });

  test('values absent from an explicit groups array are appended after it', () => {
    const bands = buildGroups([task('a', 9), task('b', 1)], {
      field: 'sprint',
      groups: [{ id: '1', label: 'Sprint 1' }],
    }, 'Ungrouped');
    expect(bands.map((b) => b.id)).toEqual(['1', '9']);
  });

  test('the label callback renders the band label from the raw value', () => {
    const bands = buildGroups([task('a', 4)], {
      field: 'sprint',
      label: (value) => `Sprint ${String(value)}`,
    }, 'Ungrouped');
    expect(bands[0].label).toBe('Sprint 4');
  });
});

describe('paginate', () => {
  const items = [1, 2, 3, 4, 5];

  test('reports the hidden remainder', () => {
    expect(paginate(items, 2)).toEqual({ shown: [1, 2], hidden: 3 });
  });

  test('hides nothing when the limit reaches the length', () => {
    expect(paginate(items, 5)).toEqual({ shown: items, hidden: 0 });
    expect(paginate(items, 99)).toEqual({ shown: items, hidden: 0 });
  });

  test('hides nothing when the limit is infinite', () => {
    expect(paginate(items, Number.POSITIVE_INFINITY)).toEqual({ shown: items, hidden: 0 });
  });
});

describe('limitFor', () => {
  test('grows by one page size per revealed step', () => {
    expect(limitFor(20, 0)).toBe(20);
    expect(limitFor(20, 2)).toBe(60);
  });

  test('is infinite when pagination is disabled', () => {
    expect(limitFor(false, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(limitFor(0, 3)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('visibleColumns', () => {
  const columns = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ];

  test('returns the same array reference when nothing is hidden', () => {
    expect(visibleColumns(columns, [])).toBe(columns);
  });

  test('preserves the original order after unhiding', () => {
    expect(visibleColumns(columns, ['b']).map((c) => c.id)).toEqual(['a', 'c']);
    expect(visibleColumns(columns, []).map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/registry && bun test items/blocks/data-board/component.test.ts`
Expected: FAIL — the module `./component` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Create `packages/registry/items/blocks/data-board/component.tsx`:

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/registry && bun test items/blocks/data-board/component.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 5: Confirm the test file is invisible to the generator**

Run: `bun registry:generate`

Expected in the output: `[generate] N items processed` with N one higher than before this task, and **no** `skipping blocks/data-board` warning.

Then confirm the test file was not published:

```bash
grep -c 'component.test' packages/registry/registry.json
```

Expected: `0`. If it is not `0`, stop — the generator is picking up the test file and the plan's testing approach needs revisiting before going further.

Also confirm the stub exists:

```bash
cat packages/registry/stubs/blocks/data-board.tsx
```

Expected: `export * from '../../items/blocks/data-board/component';`

- [ ] **Step 6: Commit**

```bash
bun check
git add packages/registry/items/blocks/data-board
git commit -m "feat(data-board): grouping and pagination helpers"
```

---

### Task 2: Drop-target and drag-correctness helpers

**Files:**
- Modify: `packages/registry/items/blocks/data-board/component.tsx` (append after `visibleColumns`)
- Test: `packages/registry/items/blocks/data-board/component.test.ts` (append)

**Interfaces:**
- Consumes: `UNGROUPED_ID`, `limitFor`, `DataBoardBand<T>` from Task 1.
- Produces: `columnKey(columnId: string): string`, `bandKey(groupId: string): string`, `dropZoneId(columnId: string, groupId?: string): string`, `parseDropZoneId(id: string): { columnId: string; groupId?: string }`, `resolveDropTarget(args: { overId: string; zones: Set<string>; overItem: { columnId: string; groupId?: string } | null }): { columnId: string; groupId?: string } | null`, `isSamePosition(move: { fromColumn: string; toColumn: string; fromIndex: number | null; toIndex: number; fromGroup?: string; toGroup?: string }): boolean`, `withActiveCard<T>(all: T[], shown: T[], hidden: number, activeId: string | null, getId: (item: T) => string): { rendered: T[]; remaining: number }`, `withPinnedBands<T>(bands: DataBoardBand<T>[], pinned: DataBoardBand<T>[] | null): DataBoardBand<T>[]`, `revealStepsFor(pageSize: number | false, revealed: number, index: number): number`.

- [ ] **Step 1: Write the failing test**

Append to `packages/registry/items/blocks/data-board/component.test.ts`:

```ts
import {
  bandKey,
  columnKey,
  dropZoneId,
  isSamePosition,
  parseDropZoneId,
  resolveDropTarget,
  revealStepsFor,
  withActiveCard,
  withPinnedBands,
} from './component';

describe('drop zone ids', () => {
  test('a flat zone id is the column id', () => {
    expect(dropZoneId('todo')).toBe('todo');
    expect(parseDropZoneId('todo')).toEqual({ columnId: 'todo' });
  });

  test('a grouped zone id round-trips group and column', () => {
    const id = dropZoneId('todo', '3');
    expect(parseDropZoneId(id)).toEqual({ groupId: '3', columnId: 'todo' });
  });

  test('a group id containing the separator still round-trips the column', () => {
    const id = dropZoneId('todo', 'a::b');
    expect(parseDropZoneId(id)).toEqual({ groupId: 'a', columnId: 'b::todo' });
  });

  test('column and band pagination keys never collide', () => {
    expect(columnKey('x')).not.toBe(bandKey('x'));
  });
});

describe('resolveDropTarget', () => {
  const zones = new Set(['todo', 'done']);

  test('prefers the hovered zone', () => {
    expect(resolveDropTarget({ overId: 'done', zones, overItem: { columnId: 'todo' } })).toEqual({ columnId: 'done' });
  });

  test('falls back to the hovered card cell', () => {
    expect(resolveDropTarget({ overId: 'card-1', zones, overItem: { columnId: 'todo', groupId: '2' } })).toEqual({
      columnId: 'todo',
      groupId: '2',
    });
  });

  test('resolves nothing when hovering neither a zone nor a card', () => {
    expect(resolveDropTarget({ overId: 'elsewhere', zones, overItem: null })).toBeNull();
  });
});

describe('isSamePosition', () => {
  test('is true when column, index and band are unchanged', () => {
    expect(isSamePosition({ fromColumn: 'a', toColumn: 'a', fromIndex: 2, toIndex: 2 })).toBe(true);
  });

  test('is false when only the band changed', () => {
    expect(
      isSamePosition({ fromColumn: 'a', toColumn: 'a', fromIndex: 2, toIndex: 2, fromGroup: '1', toGroup: '2' }),
    ).toBe(false);
  });

  test('is false when only the index changed', () => {
    expect(isSamePosition({ fromColumn: 'a', toColumn: 'a', fromIndex: 1, toIndex: 2 })).toBe(false);
  });

  test('is false when the card had no known origin index', () => {
    expect(isSamePosition({ fromColumn: 'a', toColumn: 'a', fromIndex: null, toIndex: 0 })).toBe(false);
  });
});

describe('withActiveCard', () => {
  const all = ['a', 'b', 'c', 'd'];
  const id = (value: string) => value;

  test('appends the dragged card when it fell outside the slice', () => {
    expect(withActiveCard(all, ['a', 'b'], 2, 'd', id)).toEqual({ rendered: ['a', 'b', 'd'], remaining: 1 });
  });

  test('leaves the slice untouched when the dragged card is already in it', () => {
    expect(withActiveCard(all, ['a', 'b'], 2, 'a', id)).toEqual({ rendered: ['a', 'b'], remaining: 2 });
  });

  test('leaves the slice untouched when nothing is being dragged', () => {
    expect(withActiveCard(all, ['a', 'b'], 2, null, id)).toEqual({ rendered: ['a', 'b'], remaining: 2 });
  });

  test('leaves the slice untouched when the dragged card belongs to another cell', () => {
    expect(withActiveCard(all, ['a', 'b'], 2, 'zzz', id)).toEqual({ rendered: ['a', 'b'], remaining: 2 });
  });
});

describe('withPinnedBands', () => {
  const band = (id: string, items: string[] = []) => ({ id, label: id, value: id, items });

  test('is a passthrough when no drag is in progress', () => {
    const bands = [band('1'), band('2')];
    expect(withPinnedBands(bands, null)).toBe(bands);
  });

  test('keeps a band that emptied mid-drag, in place and empty', () => {
    const pinned = [band('1', ['x']), band('2', ['y'])];
    const live = [band('2', ['y', 'x'])];
    const result = withPinnedBands(live, pinned);
    expect(result.map((b) => b.id)).toEqual(['1', '2']);
    expect(result[0].items).toEqual([]);
    expect(result[1].items).toEqual(['y', 'x']);
  });

  test('appends a band born during the drag', () => {
    const pinned = [band('1', ['x'])];
    const live = [band('1'), band('2', ['x'])];
    expect(withPinnedBands(live, pinned).map((b) => b.id)).toEqual(['1', '2']);
  });
});

describe('revealStepsFor', () => {
  test('opens nothing when the card landed inside the window', () => {
    expect(revealStepsFor(20, 0, 5)).toBe(0);
    expect(revealStepsFor(20, 0, 19)).toBe(0);
  });

  test('opens exactly enough steps to reveal the card', () => {
    expect(revealStepsFor(20, 0, 20)).toBe(1);
    expect(revealStepsFor(20, 0, 45)).toBe(2);
    expect(revealStepsFor(20, 1, 45)).toBe(1);
  });

  test('opens nothing when pagination is disabled', () => {
    expect(revealStepsFor(false, 0, 500)).toBe(0);
  });

  test('opens nothing for an unknown index', () => {
    expect(revealStepsFor(20, 0, -1)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/registry && bun test items/blocks/data-board/component.test.ts`
Expected: FAIL — the new helpers are not exported.

- [ ] **Step 3: Write the minimal implementation**

Append to `packages/registry/items/blocks/data-board/component.tsx`, after `visibleColumns`:

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/registry && bun test items/blocks/data-board/component.test.ts`
Expected: PASS, all tests from Tasks 1 and 2.

- [ ] **Step 5: Commit**

```bash
bun check
git add packages/registry/items/blocks/data-board
git commit -m "feat(data-board): drop-target resolution and drag-correctness helpers"
```

---

### Task 3: Labels, stored-view parsing, and the view hook

**Files:**
- Modify: `packages/registry/items/blocks/data-board/component.tsx` (append)
- Test: `packages/registry/items/blocks/data-board/component.test.ts` (append)

**Interfaces:**
- Consumes: nothing from Tasks 1–2 except `limitFor` indirectly.
- Produces: type `DataBoardLabels`; `DEFAULT_LABELS: DataBoardLabels`; type `StoredView = { hidden: string[]; pageSize: number | false; collapsed: Record<string, boolean> }`; `parseStoredView(raw: string | null, knownColumnIds: string[]): Partial<StoredView>`; `STORAGE_PREFIX: string`; type `DataBoardView`; hook `useDataBoardView(args): DataBoardView`.

`DataBoardView` shape, relied on by Task 5:

```ts
type DataBoardView = {
  hidden: string[];
  toggleHidden: (columnId: string) => void;
  pageSize: number | false;
  setPageSize: (next: number | false) => void;
  revealedFor: (key: string) => number;
  revealMore: (key: string) => void;
  isCollapsed: (groupId: string, fallback: boolean) => boolean;
  toggleCollapsed: (groupId: string, fallback: boolean) => void;
};
```

- [ ] **Step 1: Write the failing test**

Append to `packages/registry/items/blocks/data-board/component.test.ts`:

```ts
import { DEFAULT_LABELS, parseStoredView } from './component';

describe('DEFAULT_LABELS', () => {
  test('every label is defined', () => {
    for (const [key, value] of Object.entries(DEFAULT_LABELS)) {
      expect(value, `label ${key}`).toBeDefined();
    }
  });

  test('the countable labels read naturally', () => {
    expect(DEFAULT_LABELS.showMore(3)).toBe('Show 3 more');
    expect(DEFAULT_LABELS.pageSizeOption(20)).toBe('20 per column');
    expect(DEFAULT_LABELS.hideColumn('Backlog')).toBe('Hide Backlog');
  });
});

describe('parseStoredView', () => {
  const known = ['a', 'b'];

  test('returns nothing for absent storage', () => {
    expect(parseStoredView(null, known)).toEqual({});
  });

  test('returns nothing for corrupt JSON instead of throwing', () => {
    expect(parseStoredView('{not json', known)).toEqual({});
  });

  test('drops hidden ids that no longer match a column', () => {
    expect(parseStoredView(JSON.stringify({ hidden: ['a', 'gone'] }), known)).toEqual({ hidden: ['a'] });
  });

  test('keeps a positive page size and the disabled sentinel', () => {
    expect(parseStoredView(JSON.stringify({ pageSize: 50 }), known).pageSize).toBe(50);
    expect(parseStoredView(JSON.stringify({ pageSize: false }), known).pageSize).toBe(false);
  });

  test('rejects a nonsensical page size', () => {
    expect(parseStoredView(JSON.stringify({ pageSize: 0 }), known).pageSize).toBeUndefined();
    expect(parseStoredView(JSON.stringify({ pageSize: -5 }), known).pageSize).toBeUndefined();
    expect(parseStoredView(JSON.stringify({ pageSize: 'big' }), known).pageSize).toBeUndefined();
  });

  test('accepts a collapsed map and rejects a non-object', () => {
    expect(parseStoredView(JSON.stringify({ collapsed: { '1': true } }), known).collapsed).toEqual({ '1': true });
    expect(parseStoredView(JSON.stringify({ collapsed: ['1'] }), known).collapsed).toBeUndefined();
  });

  test('ignores unknown keys', () => {
    expect(parseStoredView(JSON.stringify({ nope: 1 }), known)).toEqual({});
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/registry && bun test items/blocks/data-board/component.test.ts`
Expected: FAIL — `DEFAULT_LABELS` and `parseStoredView` are not exported.

- [ ] **Step 3: Write the minimal implementation**

First change the import line at the top of `component.tsx` from `import type * as React from 'react';` to a value import, since the hook needs it:

```tsx
import * as React from 'react';
```

Then append after `revealStepsFor`:

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/registry && bun test items/blocks/data-board/component.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `cd packages/registry && bunx tsc --noEmit`
Expected: no errors from `items/blocks/data-board/component.tsx`. A `TS5101` `baseUrl` deprecation warning is pre-existing and expected.

- [ ] **Step 6: Commit**

```bash
bun check
git add packages/registry/items/blocks/data-board
git commit -m "feat(data-board): overridable labels and persisted view state"
```

---

### Task 4: Presentational subcomponents

**Files:**
- Modify: `packages/registry/items/blocks/data-board/component.tsx` (append)

**Interfaces:**
- Consumes: `DataBoardColumn`, `DataBoardLabels` from Tasks 1 and 3.
- Produces, all exported: `DataBoardCardFace`, `DataBoardCard`, `DataBoardColumnHeader`, `DataBoardColumnBody`, `DataBoardBandRow`, `DataBoardHiddenRail`, `DataBoardToolbar`.

No test step: these render DOM, and the plan's testing scope is pure helpers only (spec, "Testing"). They are gated by `tsc` here and by browser dogfooding in Task 7.

- [ ] **Step 1: Extend the imports at the top of `component.tsx`**

Replace the import block with:

```tsx
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
```

These five `@/components/ui/*` imports are what the generator turns into `registryDependencies`.

- [ ] **Step 2: Append the subcomponents**

```tsx
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
```

- [ ] **Step 3: Typecheck and confirm the dependency detection**

```bash
cd packages/registry && bunx tsc --noEmit
cd /home/plv/lab/r/shuip && bun registry:generate
```

Then:

```bash
bun -e "const r=require('./packages/registry/registry.json');const i=r.items.find(x=>x.name==='data-board');console.log(JSON.stringify(i,null,2))"
```

Expected `registryDependencies`: `["button","card","input","select","tooltip"]`.
Expected `dependencies`: the three `@dnd-kit/*` packages and `lucide-react`.

If `tooltip` or `select` is missing, an import was written as a relative path or the wrong alias — fix the import, do not edit `registry.json`.

- [ ] **Step 4: Run the existing tests to confirm nothing regressed**

Run: `cd packages/registry && bun test items/blocks/data-board/component.test.ts`
Expected: PASS. The helpers are unchanged; this catches an accidental edit.

- [ ] **Step 5: Commit**

```bash
bun check
git add packages/registry/items/blocks/data-board
git commit -m "feat(data-board): column, band, card, rail and toolbar subcomponents"
```

---

### Task 5: Drag state machine and the DataBoard orchestrator

**Files:**
- Modify: `packages/registry/items/blocks/data-board/component.tsx` (append)

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: types `DataBoardMoveEvent<T>`, `DataBoardProps<T>`; `useDataBoardDrag<T>`; and the default-facing export `DataBoard<T>`.

- [ ] **Step 1: Extend the dnd-kit imports at the top of the file**

Replace the two dnd-kit import lines with:

```tsx
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
```

- [ ] **Step 2: Append the move event type and the drag hook**

```tsx
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

  React.useEffect(() => {
    if (data && !draggingRef.current) setItems(data);
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
    if (fromColumn == null) return;

    const activeCardId = String(event.active.id);
    const movedItem = items.find((item) => getId(item) === activeCardId);
    if (!movedItem) return;

    const toColumn = getColumn(movedItem);
    const toIndex = cellIndexOf(items, toColumn, undefined, activeCardId);
    const toGroup = getGroup(movedItem);
    startItemsRef.current = null;
    if (isSamePosition({ fromColumn, toColumn, fromIndex, toIndex, fromGroup, toGroup })) return;

    // A card dropped past its target cell's paginated window would be invisible
    // until the next "show more": open just enough steps to reveal it.
    const key = toGroup == null ? columnKey(toColumn) : bandKey(toGroup);
    const indexInCell = toGroup == null ? toIndex : cellIndexOf(items, toColumn, toGroup, activeCardId);
    const steps = revealStepsFor(view.pageSize, view.revealedFor(key), indexInCell);
    for (let step = 0; step < steps; step++) view.revealMore(key);

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
```

- [ ] **Step 3: Append the props type and the orchestrator**

```tsx
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
  const draggable = onCardMove != null;

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
                      const bandItems = band.items.filter((item) => visibleIds.has(getId(item)));
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
          <DataBoardHiddenRail
            columns={hiddenColumnList}
            counts={counts}
            labels={labels}
            onShow={view.toggleHidden}
          />
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
```

- [ ] **Step 4: Typecheck**

Run: `cd packages/registry && bunx tsc --noEmit`
Expected: no errors from `items/blocks/data-board/component.tsx`.

- [ ] **Step 5: Run the helper tests**

Run: `cd packages/registry && bun test items/blocks/data-board/component.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
bun check
git add packages/registry/items/blocks/data-board
git commit -m "feat(data-board): drag state machine and board orchestrator"
```

---

### Task 6: Examples

**Files:**
- Create: `packages/registry/items/blocks/data-board/default.example.tsx`
- Create: `packages/registry/items/blocks/data-board/grouped.example.tsx`
- Create: `packages/registry/items/blocks/data-board/custom-card.example.tsx`

**Interfaces:**
- Consumes: `DataBoard`, `DataBoardColumn`, `DataBoardMoveEvent` via the stub alias `@/components/block/shuip/data-board`.
- Produces: registry keys `data-board.example`, `data-board.grouped.example`, `data-board.custom-card.example`.

All three import via the stub alias, never `./component`. Item types are declared with `type`, never `interface`.

- [ ] **Step 1: Write `default.example.tsx`**

```tsx
'use client';

import { DataBoard, type DataBoardColumn } from '@/components/block/shuip/data-board';
import { CircleCheck, CircleDashed, CircleDot, CirclePause } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  assignee: string;
  points: number;
  status: string;
};

const COLUMNS: DataBoardColumn[] = [
  { id: 'backlog', label: 'Backlog', icon: CircleDashed },
  { id: 'in-progress', label: 'In progress', icon: CircleDot, accentClassName: 'text-primary' },
  { id: 'review', label: 'In review', icon: CirclePause, accentClassName: 'text-primary/70' },
  { id: 'done', label: 'Done', icon: CircleCheck, accentClassName: 'text-foreground' },
];

const ASSIGNEES = ['Ada', 'Grace', 'Alan', 'Katherine'];
const STATUSES = ['backlog', 'in-progress', 'review', 'done'];

const TASKS: Task[] = Array.from({ length: 34 }, (_, index) => ({
  id: `task-${index + 1}`,
  title: `Task ${index + 1}`,
  assignee: ASSIGNEES[index % ASSIGNEES.length],
  points: (index % 5) + 1,
  status: STATUSES[index % STATUSES.length],
}));

export default function DataBoardDefaultExample() {
  return (
    <div className='flex h-[32rem] flex-col'>
      <DataBoard<Task>
        columns={COLUMNS}
        defaultData={TASKS}
        columnField='status'
        title={(task) => task.title}
        fields={[
          { key: 'assignee' },
          { key: 'points', label: 'pts' },
        ]}
        searchableFields={['title', 'assignee']}
        renderColumnSummary={(tasks) => `${tasks.reduce((total, task) => total + task.points, 0)} pts`}
        pageSize={5}
        onCardMove={(event) => console.log('moved', event.item.id, '->', event.toColumn)}
        onCardAdd={(columnId) => console.log('add to', columnId)}
        onCardClick={(task) => console.log('open', task.id)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `grouped.example.tsx`**

```tsx
'use client';

import { DataBoard, type DataBoardColumn } from '@/components/block/shuip/data-board';
import { CircleCheck, CircleDashed, CircleDot } from 'lucide-react';

type Ticket = {
  id: string;
  title: string;
  owner: string;
  sprint: number | null;
  status: string;
};

const COLUMNS: DataBoardColumn[] = [
  { id: 'todo', label: 'To do', icon: CircleDashed },
  { id: 'doing', label: 'Doing', icon: CircleDot, accentClassName: 'text-primary' },
  { id: 'done', label: 'Done', icon: CircleCheck, accentClassName: 'text-foreground' },
];

const SPRINT_NOTES: Record<string, string> = {
  '12': 'Search relevance and indexing',
  '13': 'Billing migration',
  '14': 'Mobile polish',
};

const OWNERS = ['Ada', 'Grace', 'Alan'];
const STATUSES = ['todo', 'doing', 'done'];
const SPRINTS: (number | null)[] = [12, 13, 14, null];

const TICKETS: Ticket[] = Array.from({ length: 28 }, (_, index) => ({
  id: `ticket-${index + 1}`,
  title: `Ticket ${index + 1}`,
  owner: OWNERS[index % OWNERS.length],
  sprint: SPRINTS[index % SPRINTS.length],
  status: STATUSES[index % STATUSES.length],
}));

export default function DataBoardGroupedExample() {
  return (
    <div className='flex h-[36rem] flex-col'>
      <DataBoard<Ticket>
        columns={COLUMNS}
        defaultData={TICKETS}
        columnField='status'
        persistKey='docs-data-board-grouped'
        title={(ticket) => ticket.title}
        fields={[{ key: 'owner' }]}
        pageSize={4}
        groupBy={{
          field: 'sprint',
          groups: [
            { id: '14', label: 'Sprint 14' },
            { id: '13', label: 'Sprint 13' },
            { id: '12', label: 'Sprint 12' },
          ],
          description: (value) => SPRINT_NOTES[String(value)] ?? null,
          defaultCollapsed: (groupId) => groupId === '12',
        }}
        labels={{ ungrouped: 'No sprint' }}
        onCardMove={(event) => console.log('moved', event.item.id, event.toColumn, event.toGroup)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Write `custom-card.example.tsx`**

```tsx
'use client';

import { DataBoard, type DataBoardColumn } from '@/components/block/shuip/data-board';
import { Badge } from '@/components/ui/badge';
import { CircleCheck, CircleDashed, CircleDot } from 'lucide-react';
import * as React from 'react';

type Deal = {
  id: string;
  company: string;
  value: number;
  probability: number;
  stage: string;
};

const COLUMNS: DataBoardColumn[] = [
  { id: 'lead', label: 'Lead', icon: CircleDashed },
  { id: 'negotiation', label: 'Negotiation', icon: CircleDot, accentClassName: 'text-primary' },
  { id: 'won', label: 'Won', icon: CircleCheck, accentClassName: 'text-foreground' },
];

const DEALS: Deal[] = [
  { id: 'd1', company: 'Northwind', value: 24000, probability: 40, stage: 'lead' },
  { id: 'd2', company: 'Initech', value: 8000, probability: 60, stage: 'lead' },
  { id: 'd3', company: 'Contoso', value: 51000, probability: 75, stage: 'negotiation' },
  { id: 'd4', company: 'Umbrella', value: 12500, probability: 90, stage: 'negotiation' },
  { id: 'd5', company: 'Globex', value: 33000, probability: 100, stage: 'won' },
];

const money = (amount: number) => `$${amount.toLocaleString('en-US')}`;

export default function DataBoardCustomCardExample() {
  const [deals, setDeals] = React.useState(DEALS);

  return (
    <div className='flex h-[28rem] flex-col'>
      <DataBoard<Deal>
        columns={COLUMNS}
        data={deals}
        onDataChange={setDeals}
        columnField='stage'
        title={(deal) => deal.company}
        cardContent={(deal) => (
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium text-foreground'>{money(deal.value)}</span>
            <span>{deal.probability}%</span>
          </div>
        )}
        cardClassName={(deal) => (deal.probability >= 90 ? 'border-primary' : undefined)}
        wrapCard={(deal, card) => (
          <div className='relative'>
            {card}
            {deal.value >= 50000 ? (
              <Badge className='-top-1.5 -right-1.5 absolute'>Key</Badge>
            ) : null}
          </div>
        )}
        renderColumnSummary={(items) => money(items.reduce((total, deal) => total + deal.value, 0))}
        pageSizeOptions={[10]}
        onCardMove={(event) => console.log('moved', event.item.id, '->', event.toColumn)}
      />
    </div>
  );
}
```

Note: this example imports `@/components/ui/badge`, which adds `badge` to the item's `registryDependencies` **only if** the generator scanned examples — it does not; it scans `component.tsx` only. `badge` therefore will not appear in `registryDependencies`, which is correct: the block itself does not use it. `packages/ui` already ships `badge.tsx`, so the docs preview compiles.

- [ ] **Step 4: Regenerate and verify the example keys**

```bash
bun registry:generate
grep -n "data-board" packages/registry/__index__.ts
```

Expected three keys: `'data-board.example'`, `'data-board.grouped.example'`, `'data-board.custom-card.example'`.

- [ ] **Step 5: Typecheck**

Run: `cd packages/registry && bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
bun check
git add packages/registry/items/blocks/data-board
git commit -m "feat(data-board): default, grouped and custom-card examples"
```

---

### Task 7: Documentation and end-to-end verification

**Files:**
- Create: `apps/docs/content/blocks/data-board.mdx`
- Modify: `apps/docs/content/blocks/kanban.mdx` (one added sentence only)

**Interfaces:**
- Consumes: registry name `data-board` and the three example keys from Task 6.
- Produces: the published doc page at `/blocks/data-board`.

- [ ] **Step 1: Write `apps/docs/content/blocks/data-board.mdx`**

```mdx
---
title: Data Board
description: A drag-and-drop board with bounded height, generic grouping into bands, per-column pagination and hideable columns, all driven by your typed data model.
registryName: data-board
---

import { TypeTable } from 'fumadocs-ui/components/type-table';

`DataBoard` renders any array of typed items into draggable columns and stays usable when that
array grows: the board has a finite height with sticky column headers, each column scrolls on its
own, and cards are paginated per column. Columns, card fields, grouping and search are all
configured against your own data shape — nothing is hardcoded to a domain.

### Built-in features

- **Generic data model**: works with any item type `T` via `idField` / `columnField`.
- **Bounded height**: sticky column headers, one scroll container per column.
- **Grouping into bands**: `groupBy` any field to get collapsible horizontal bands; dropping a card
  in another band emits the new value.
- **Per-column pagination**: a "show more" step per column, or one per band when grouped.
- **Hideable columns**: hide from the header, recall from the right-hand rail.
- **Persisted view**: hidden columns, page size and collapsed bands survive a reload via `persistKey`.
- **Global search**: filter cards across `searchableFields`.
- **Hybrid state**: standalone from `defaultData`, or controlled via `data` + `onDataChange`.

> Cards are only draggable when you pass `onCardMove`. A board without it is genuinely read-only.

> Card order is implicit in the `data` array order. On any move the board emits the reordered array
> via `onDataChange` and a semantic `onCardMove` event; map either to your own persistence.

## Choosing between Kanban and Data Board

Both are drag-and-drop boards. Pick on volume and on how much view control your users need.

| | [`kanban`](/blocks/kanban) | `data-board` |
| --- | --- | --- |
| Height | grows with the tallest column | bounded, sticky headers, per-column scroll |
| Volume | tens of cards | hundreds, via pagination |
| Grouping | none | `groupBy` any field, collapsible bands |
| Columns | fixed | hideable, with a recall rail |
| View persistence | none | `localStorage` via `persistKey` |
| Size | small | larger surface, more props |

If a board fits on one screen and users never need to hide a column, `kanban` is the smaller and
simpler install.

## Sizing the board

The board is `flex min-h-0 flex-col` and fills the height its parent gives it — so it never needs
to know the page chrome around it, and there is no hardcoded `calc()`. The contract is on the
parent:

```tsx
<div className='flex h-[calc(100svh-4rem)] flex-col'>
  <DataBoard {...props} />
</div>
```

Where the parent constrains nothing, pass `height` instead. A number is read as pixels.

```tsx
<DataBoard height={520} {...props} />
```

## Column accents

The block ships no palette — it would impose a theme on your app. A column takes a Lucide `icon`
and an `accentClassName` applied to it, so the semantics stay yours:

```tsx
const columns: DataBoardColumn[] = [
  { id: 'todo', label: 'To do', icon: CircleDashed },
  { id: 'doing', label: 'Doing', icon: CircleDot, accentClassName: 'text-primary' },
  { id: 'blocked', label: 'Blocked', icon: CircleX, accentClassName: 'text-destructive' },
  { id: 'done', label: 'Done', icon: CircleCheck, accentClassName: 'text-emerald-600' },
];
```

## Examples

<ItemExamples registryName={'data-board'} />

## Props

<TypeTable
  type={{
    columns: {
      description: 'Column definitions.',
      type: 'DataBoardColumn[]',
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
    title: {
      description: 'Renders the card title. Return a string or any ReactNode.',
      type: '(item: T) => ReactNode',
    },
    fields: {
      description: 'Properties shown on the default card.',
      type: 'DataBoardField<T>[]?',
    },
    cardContent: {
      description: 'Replaces the card content area (the title still comes from `title`).',
      type: '(item: T) => ReactNode',
    },
    cardClassName: {
      description: 'Extra classes on a card, computed per item.',
      type: '(item: T) => string | undefined',
    },
    wrapCard: {
      description: 'Wraps a rendered card without replacing it — for a link, a context menu, a badge overlay.',
      type: '(item: T, card: ReactNode) => ReactNode',
    },
    renderColumnSummary: {
      description: 'Renders an aggregate in the column header (e.g. a sum).',
      type: '(items: T[], column: DataBoardColumn) => ReactNode',
    },
    onCardAdd: {
      description: 'When set, shows a + button in the column header.',
      type: '(columnId: string) => void',
    },
    onCardClick: {
      description: 'Called when a card body is clicked.',
      type: '(item: T) => void',
    },
    onCardMove: {
      description: 'Semantic move event. Also gates dragging: without it, cards are not draggable.',
      type: '(e: DataBoardMoveEvent<T>) => void',
    },
    searchableFields: {
      description: 'Fields the search box matches against (the raw stored value, not a custom-rendered label). Omit to hide search.',
      type: '(keyof T)[]?',
    },
    groupBy: {
      description: 'Groups cards into collapsible horizontal bands by any field.',
      type: 'DataBoardGroupBy<T>?',
    },
    pageSize: {
      description: 'Cards shown per column before "show more". Pass false to disable pagination.',
      type: 'number | false',
      default: '20',
    },
    pageSizeOptions: {
      description: 'Choices in the page-size select. A single value hides the select.',
      type: 'number[]',
      default: '[10, 20, 50]',
    },
    hiddenColumns: {
      description: 'Controlled hidden column ids. Omit to let the board own them.',
      type: 'string[]?',
    },
    onHiddenColumnsChange: {
      description: 'Fires with the next hidden set in controlled mode.',
      type: '(ids: string[]) => void',
    },
    persistKey: {
      description: 'Persists hidden columns, page size and collapsed bands to localStorage under this key.',
      type: 'string?',
    },
    height: {
      description: 'Bounds the board where the parent constrains nothing. A number is read as pixels.',
      type: 'number | string',
    },
    labels: {
      description: 'Overrides any built-in string, aria-labels included.',
      type: 'Partial<DataBoardLabels>?',
    },
  }}
/>

### DataBoardColumn

<TypeTable
  type={{
    id: { description: 'Matches the value stored in `columnField`.', type: 'string' },
    label: { description: 'Shown in the header and the recall rail.', type: 'string' },
    icon: { description: 'Lucide icon shown before the label.', type: 'LucideIcon?', default: 'CircleDashed' },
    accentClassName: { description: 'Classes applied to the icon. Your tokens, not ours.', type: 'string?' },
  }}
/>

### DataBoardGroupBy

<TypeTable
  type={{
    field: { description: 'Field whose value defines the band.', type: 'keyof T' },
    label: { description: 'Renders a band label from the raw value.', type: '((value: unknown) => string)?' },
    description: { description: 'Secondary text on the band header.', type: '((value: unknown) => ReactNode)?' },
    groups: {
      description: 'Explicit band order. Bands listed here stay visible even when empty; unlisted values are appended.',
      type: 'DataBoardGroup[]?',
    },
    defaultCollapsed: { description: 'Bands starting collapsed, by id.', type: '((groupId: string) => boolean)?' },
  }}
/>
```

- [ ] **Step 2: Add the cross-reference to `apps/docs/content/blocks/kanban.mdx`**

Insert this line immediately after the second blockquote (the one starting "Define your item type with a `type` alias"), and change nothing else in the file:

```mdx
> For boards that outgrow one screen — hundreds of cards, grouping into bands, hideable columns, a
> persisted view — see [Data Board](/blocks/data-board).
```

- [ ] **Step 3: Regenerate and confirm no symlink was created for the block**

```bash
bun registry:generate
ls apps/docs/content/components/blocks/ 2>/dev/null || echo 'no blocks symlink dir — correct'
```

Expected: no `data-board.mdx` symlink anywhere under `apps/docs/content/components/`. Block docs live only in `apps/docs/content/blocks/`.

- [ ] **Step 4: Regenerate the fumadocs types**

```bash
cd apps/docs && bunx fumadocs-mdx
```

- [ ] **Step 5: Full build**

```bash
cd /home/plv/lab/r/shuip && NODE_OPTIONS=--max-old-space-size=6144 bun build:docs
```

Expected: success. This chains `registry:generate` → `registry:build` → `next build` and is the authoritative type gate.

Then confirm the published registry file exists:

```bash
cat apps/docs/public/r/data-board.json | head -20
```

- [ ] **Step 6: Run the full test suite and the linter**

```bash
cd packages/registry && bun test
cd /home/plv/lab/r/shuip && bun check
```

Expected: all tests pass (the pre-existing `scripts/skills.test.ts` included), Biome clean.

- [ ] **Step 7: Dogfood in the browser**

The docs site is already served at https://docs.localhost:1355 — **do not start a dev server**.
Open https://docs.localhost:1355/blocks/data-board and verify, on the default example:

1. Column headers stay put while a column scrolls.
2. Drag within a column, and between two columns.
3. Type in the search box; cards filter, and the counts follow.
4. Click "show more" on a paginated column; only that column expands.
5. Drag a card to the bottom of a column whose ceiling is reached — it must stay visible after the drop, not vanish.
6. Hide every column from the headers; the message appears; recall each from the right rail.
7. Change the page size; the reveal steps reset.

On the grouped example:

8. Bands render in the declared order, Sprint 12 starts collapsed, "No sprint" is last.
9. Collapse and expand a band; band headers stay sticky while scrolling.
10. Drag a card into another band — the sprint value changes, and the origin band does not collapse under the cursor mid-drag.
11. Hide a column, reload the page: the hidden column and the collapsed band are still there.

On the custom-card example:

12. `wrapCard` badge renders and is not clipped by the column scrollport.
13. The board is controlled — moves persist in the parent state.

Finally, toggle the docs theme and confirm both light and dark render correctly.

- [ ] **Step 8: Commit**

```bash
git add apps/docs/content/blocks/data-board.mdx apps/docs/content/blocks/kanban.mdx
git commit -m "docs(data-board): block documentation and kanban cross-reference"
```

---

## Definition of done

- `bun test` green in `packages/registry`, including the pre-existing suite.
- `bun check` clean.
- `NODE_OPTIONS=--max-old-space-size=6144 bun build:docs` succeeds.
- `apps/docs/public/r/data-board.json` exists with `registryDependencies` `["button","card","input","select","tooltip"]`.
- `/blocks/data-board` renders three working examples, and all 13 dogfooding checks pass.
- `packages/registry/items/blocks/kanban/` is untouched; `git diff main --stat -- packages/registry/items/blocks/kanban` is empty.
