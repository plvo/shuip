import { describe, expect, test } from 'bun:test';
import type { CollisionDetection } from '@dnd-kit/core';
import {
  buildGroups,
  detectBoardCollision,
  groupIdOf,
  limitFor,
  paginate,
  UNGROUPED_ID,
  visibleColumns,
} from './component.radix';

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
    const bands = buildGroups(
      [task('a', 2)],
      {
        field: 'sprint',
        groups: [
          { id: '2', label: 'Sprint 2' },
          { id: '1', label: 'Sprint 1' },
        ],
      },
      'Ungrouped',
    );
    expect(bands.map((b) => b.id)).toEqual(['2', '1']);
    expect(bands.map((b) => b.label)).toEqual(['Sprint 2', 'Sprint 1']);
    expect(bands[1].items).toEqual([]);
  });

  test('values absent from an explicit groups array are appended after it', () => {
    const bands = buildGroups(
      [task('a', 9), task('b', 1)],
      {
        field: 'sprint',
        groups: [{ id: '1', label: 'Sprint 1' }],
      },
      'Ungrouped',
    );
    expect(bands.map((b) => b.id)).toEqual(['1', '9']);
  });

  test('the label callback renders the band label from the raw value', () => {
    const bands = buildGroups(
      [task('a', 4)],
      {
        field: 'sprint',
        label: (value) => `Sprint ${String(value)}`,
      },
      'Ungrouped',
    );
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
} from './component.radix';

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

import { DEFAULT_LABELS, parseStoredView } from './component.radix';

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

describe('detectBoardCollision', () => {
  type Rect = { top: number; left: number; width: number; height: number };
  type Droppable = { id: string; rect: Rect; data?: { columnId: string; groupId?: string } };

  const toClientRect = ({ top, left, width, height }: Rect) => ({
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  });

  const zone = (id: string, rect: Rect): Droppable => ({ id, rect });
  const card = (id: string, columnId: string, rect: Rect, groupId?: string): Droppable => ({
    id,
    rect,
    data: { columnId, groupId },
  });

  const collide = (
    droppables: Droppable[],
    input: { pointer?: { x: number; y: number }; collisionRect?: Rect },
  ): string[] => {
    const args = {
      droppableContainers: droppables.map(({ id, data }) => ({
        id,
        data: { current: data ?? { zone: true, ...parseDropZoneId(id) } },
        disabled: false,
      })),
      droppableRects: new Map(droppables.map(({ id, rect }) => [id, toClientRect(rect)])),
      pointerCoordinates: input.pointer ?? null,
      collisionRect: toClientRect(input.collisionRect ?? { top: 0, left: 0, width: 0, height: 0 }),
    };
    return detectBoardCollision(args as unknown as Parameters<CollisionDetection>[0]).map(({ id }) => String(id));
  };

  const cardRect = (left: number, top: number): Rect => ({ left, top, width: 280, height: 80 });

  // Column `todo` holds three cards, column `done` beside it is empty and 900px tall.
  const flat = [
    zone('todo', { left: 0, top: 0, width: 300, height: 900 }),
    card('a', 'todo', cardRect(10, 10)),
    card('b', 'todo', cardRect(10, 100)),
    card('c', 'todo', cardRect(10, 190)),
    zone('done', { left: 320, top: 0, width: 300, height: 900 }),
  ];

  test('targets a tall empty column whatever the cards of its neighbour', () => {
    expect(collide(flat, { pointer: { x: 400, y: 700 } })).toEqual(['done']);
    expect(collide(flat, { pointer: { x: 400, y: 5 } })).toEqual(['done']);
  });

  test('targets the closest card of the column under the pointer', () => {
    expect(collide(flat, { pointer: { x: 100, y: 120 } })).toEqual(['b']);
    expect(collide(flat, { pointer: { x: 100, y: 3 } })).toEqual(['a']);
  });

  test('targets the closest card when the pointer is in the gap between two cards', () => {
    expect(collide(flat, { pointer: { x: 100, y: 92 } })).toEqual(['a']);
    expect(collide(flat, { pointer: { x: 100, y: 96 } })).toEqual(['b']);
  });

  test('targets the column itself when the pointer is below its last card', () => {
    expect(collide(flat, { pointer: { x: 100, y: 600 } })).toEqual(['todo']);
  });

  test('targets nothing when the pointer is outside every column', () => {
    expect(collide(flat, { pointer: { x: 310, y: 100 } })).toEqual([]);
    expect(collide(flat, { pointer: { x: 100, y: 950 } })).toEqual([]);
  });

  test('targets an empty cell of a band whose other cells are full', () => {
    const grouped = [
      zone('s1::todo', { left: 0, top: 0, width: 300, height: 400 }),
      card('a', 'todo', cardRect(10, 10), 's1'),
      card('b', 'todo', cardRect(10, 100), 's1'),
      card('c', 'todo', cardRect(10, 190), 's1'),
      card('d', 'todo', cardRect(10, 280), 's1'),
      zone('s1::done', { left: 320, top: 0, width: 300, height: 400 }),
      zone('s2::todo', { left: 0, top: 420, width: 300, height: 100 }),
      card('e', 'todo', cardRect(10, 430), 's2'),
    ];
    expect(collide(grouped, { pointer: { x: 400, y: 300 } })).toEqual(['s1::done']);
    expect(collide(grouped, { pointer: { x: 100, y: 440 } })).toEqual(['e']);
    expect(collide(grouped, { pointer: { x: 100, y: 120 } })).toEqual(['b']);
  });

  test('ignores the cards of the same column in another band', () => {
    const bands = [
      zone('s1::done', { left: 0, top: 0, width: 300, height: 400 }),
      zone('s2::done', { left: 0, top: 420, width: 300, height: 200 }),
      card('f', 'done', cardRect(10, 430), 's2'),
    ];
    expect(collide(bands, { pointer: { x: 100, y: 300 } })).toEqual(['s1::done']);
    expect(collide(bands, { pointer: { x: 100, y: 440 } })).toEqual(['f']);
  });

  test('resolves the column by rectangle intersection without a pointer', () => {
    expect(collide(flat, { collisionRect: { left: 330, top: 600, width: 280, height: 80 } })).toEqual(['done']);
  });

  test('picks the column the dragged rectangle overlaps most without a pointer', () => {
    expect(collide(flat, { collisionRect: { left: 100, top: 100, width: 280, height: 80 } })).toEqual(['b']);
    expect(collide(flat, { collisionRect: { left: 290, top: 100, width: 280, height: 80 } })).toEqual(['done']);
  });
});
