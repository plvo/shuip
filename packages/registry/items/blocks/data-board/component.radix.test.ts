import { describe, expect, test } from 'bun:test';
import type { CollisionDetection } from '@dnd-kit/core';
import {
  buildGroups,
  detectBoardCollision,
  dropZoneData,
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
  applyCardMove,
  bandKey,
  type CardAccessors,
  cellIds,
  cellOrder,
  columnKey,
  type DropOver,
  type DropSlot,
  dropZoneId,
  isSameSlot,
  landingIndex,
  originSlot,
  previewTarget,
  rebaseSlot,
  revealStepsFor,
  slotNeighbours,
  slotPlacement,
  slotPosition,
  sortByPosition,
} from './component.radix';

describe('drop zone ids', () => {
  test('a flat zone id is the column id', () => {
    expect(dropZoneId('todo')).toBe('todo');
  });

  test('a grouped zone id names group and column', () => {
    expect(dropZoneId('todo', '3')).toBe('3::todo');
  });

  test('column and band pagination keys never collide', () => {
    expect(columnKey('x')).not.toBe(bandKey('x'));
  });
});

type Card = { id: string; status: string; team?: string };

const cardOf = (id: string, status: string, team?: string): Card => ({ id, status, team });

const accessors: CardAccessors<Card> = {
  getId: (item) => item.id,
  getColumn: (item) => item.status,
  getGroup: (item) => item.team,
};

const ids = (items: Card[]) => items.map((item) => item.id);

const over = (id: string, columnId: string, below: boolean, groupId?: string): DropOver => ({
  id,
  columnId,
  groupId,
  zone: false,
  below,
});

const zoneOver = (columnId: string, groupId?: string): DropOver => ({
  id: dropZoneId(columnId, groupId),
  columnId,
  groupId,
  zone: true,
  below: false,
});

describe('cellIds', () => {
  const items = [
    cardOf('a', 'todo', 's1'),
    cardOf('b', 'done', 's1'),
    cardOf('c', 'todo', 's2'),
    cardOf('d', 'todo', 's1'),
  ];

  test('spans the whole column when no band is given', () => {
    expect(cellIds(items, { columnId: 'todo' }, accessors)).toEqual(['a', 'c', 'd']);
  });

  test('spans one band of the column when a band is given', () => {
    expect(cellIds(items, { columnId: 'todo', groupId: 's1' }, accessors)).toEqual(['a', 'd']);
  });
});

describe('cellOrder', () => {
  test('is the cell without the dragged card', () => {
    const items = [cardOf('a', 'todo'), cardOf('b', 'todo'), cardOf('c', 'done')];
    expect(cellOrder(items, { columnId: 'todo' }, 'a', accessors)).toEqual(['b']);
    expect(cellOrder(items, { columnId: 'done' }, 'a', accessors)).toEqual(['c']);
  });
});

describe('landingIndex', () => {
  const order = ['a', 'b', 'c'];

  test('lands right before the card it is held above', () => {
    expect(landingIndex({ order, overId: 'b', below: false })).toBe(1);
    expect(landingIndex({ order, overId: 'a', below: false })).toBe(0);
  });

  test('lands right after the card it is held below', () => {
    expect(landingIndex({ order, overId: 'b', below: true })).toBe(2);
    expect(landingIndex({ order, overId: 'c', below: true })).toBe(3);
  });

  test('lands at the end of the cell when dropped on the column itself', () => {
    expect(landingIndex({ order, overId: null, below: false })).toBe(3);
    expect(landingIndex({ order: [], overId: null, below: false })).toBe(0);
  });

  test('lands at the end of the cell when the card is not in it', () => {
    expect(landingIndex({ order, overId: 'zzz', below: false })).toBe(3);
  });

  describe('with cards left out of the rendered list', () => {
    const cell = ['a', 'b', 'c', 'd'];

    test('a drop on the column lands right after the last rendered card, before the hidden ones', () => {
      expect(landingIndex({ order: cell, overId: null, below: false, renderedIds: new Set(['a', 'b']) })).toBe(2);
    });

    test('cards hidden before the last rendered card do not count', () => {
      expect(landingIndex({ order: cell, overId: null, below: false, renderedIds: new Set(['a', 'c']) })).toBe(3);
    });

    test('a drop on a column with nothing rendered lands at the end of the cell', () => {
      expect(landingIndex({ order: cell, overId: null, below: false, renderedIds: new Set() })).toBe(4);
    });

    test('boundary: a drop on a column with every card rendered lands at the end of the cell', () => {
      expect(landingIndex({ order: cell, overId: null, below: false, renderedIds: new Set(cell) })).toBe(4);
    });
  });
});

describe('previewTarget', () => {
  const items = [cardOf('a', 'todo'), cardOf('b', 'todo'), cardOf('c', 'todo'), cardOf('d', 'done')];
  const preview = (activeId: string, hovered: DropOver | null) =>
    previewTarget({ items, activeId, over: hovered, accessors });

  test('previews nothing when the pointer is over no target', () => {
    expect(preview('a', null)).toBeNull();
  });

  test('previews the slot right after the card held below, counted without the dragged card', () => {
    expect(preview('a', over('c', 'todo', true))).toEqual({ columnId: 'todo', index: 2 });
    expect(preview('d', over('a', 'todo', true))).toEqual({ columnId: 'todo', index: 1 });
  });

  test('previews the slot right before the card held above', () => {
    expect(preview('c', over('a', 'todo', false))).toEqual({ columnId: 'todo', index: 0 });
    expect(preview('d', over('c', 'todo', false))).toEqual({ columnId: 'todo', index: 2 });
  });

  test('previews the end of the cell when over the column itself', () => {
    expect(preview('d', zoneOver('todo'))).toEqual({ columnId: 'todo', index: 3 });
    expect(preview('a', zoneOver('todo'))).toEqual({ columnId: 'todo', index: 2 });
    expect(preview('a', zoneOver('doing'))).toEqual({ columnId: 'doing', index: 0 });
  });

  test('previews the slot right after the last rendered card when the cell has hidden cards', () => {
    const renderedIds = new Set(['a', 'b']);
    expect(previewTarget({ items, activeId: 'd', over: zoneOver('todo'), accessors, renderedIds })).toEqual({
      columnId: 'todo',
      index: 2,
    });
  });

  test('previews that slot in a band as well', () => {
    const banded = [
      cardOf('a', 'todo', 's1'),
      cardOf('b', 'todo', 's1'),
      cardOf('c', 'todo', 's1'),
      cardOf('d', 'done', 's1'),
    ];
    expect(
      previewTarget({
        items: banded,
        activeId: 'd',
        over: zoneOver('todo', 's1'),
        accessors,
        renderedIds: new Set(['a']),
      }),
    ).toEqual({ columnId: 'todo', groupId: 's1', index: 1 });
  });

  test('previews the original slot when over the dragged card itself', () => {
    expect(preview('b', over('b', 'todo', true))).toEqual({ columnId: 'todo', index: 1 });
  });

  test('both neighbours of the dragged card preview its original slot', () => {
    const origin = originSlot(items, 'b', accessors);
    expect(isSameSlot(preview('b', over('a', 'todo', true)), origin)).toBe(true);
    expect(isSameSlot(preview('b', over('c', 'todo', false)), origin)).toBe(true);
    expect(isSameSlot(preview('b', zoneOver('todo')), origin)).toBe(false);
  });

  test('keeps the band of the target cell', () => {
    const banded = [cardOf('a', 'todo', 's1'), cardOf('b', 'todo', 's2'), cardOf('c', 'todo', 's2')];
    expect(previewTarget({ items: banded, activeId: 'a', over: over('b', 'todo', true, 's2'), accessors })).toEqual({
      columnId: 'todo',
      groupId: 's2',
      index: 1,
    });
    expect(previewTarget({ items: banded, activeId: 'a', over: zoneOver('todo', 's2'), accessors })).toEqual({
      columnId: 'todo',
      groupId: 's2',
      index: 2,
    });
  });
});

describe('originSlot', () => {
  test('is the rank of the card inside its own cell', () => {
    const items = [cardOf('a', 'todo', 's1'), cardOf('b', 'todo', 's2'), cardOf('c', 'todo', 's2')];
    expect(originSlot(items, 'c', accessors)).toEqual({ columnId: 'todo', groupId: 's2', index: 1 });
  });

  test('is null for an unknown card', () => {
    expect(originSlot([cardOf('a', 'todo')], 'zzz', accessors)).toBeNull();
  });
});

describe('isSameSlot', () => {
  test('compares column, band and index', () => {
    const slot = { columnId: 'todo', groupId: 's1', index: 2 };
    expect(isSameSlot(slot, { ...slot })).toBe(true);
    expect(isSameSlot(slot, { ...slot, index: 1 })).toBe(false);
    expect(isSameSlot(slot, { ...slot, groupId: 's2' })).toBe(false);
    expect(isSameSlot(slot, { ...slot, columnId: 'done' })).toBe(false);
  });

  test('two missing slots are the same, a missing and a present one are not', () => {
    expect(isSameSlot(null, null)).toBe(true);
    expect(isSameSlot(null, { columnId: 'todo', index: 0 })).toBe(false);
  });
});

describe('applyCardMove', () => {
  const withLanding = (item: Card, cell: { columnId: string; groupId?: string }): Card => ({
    ...item,
    status: cell.columnId,
    team: cell.groupId ?? item.team,
  });
  const move = (items: Card[], activeId: string, target: { columnId: string; groupId?: string; index: number }) =>
    applyCardMove({ items, activeId, target, accessors, withLanding });

  const items = [cardOf('a', 'todo'), cardOf('b', 'todo'), cardOf('c', 'todo'), cardOf('d', 'done')];

  test('a card from an earlier index lands right after the card it was held below', () => {
    const next = move(items, 'a', { columnId: 'todo', index: 2 });
    expect(cellIds(next, { columnId: 'todo' }, accessors)).toEqual(['b', 'c', 'a']);
  });

  test('a card from an earlier index lands right before the card it was held above', () => {
    const next = move(items, 'a', { columnId: 'todo', index: 1 });
    expect(cellIds(next, { columnId: 'todo' }, accessors)).toEqual(['b', 'a', 'c']);
  });

  test('a card from a later index lands right after the card it was held below', () => {
    const next = move(items, 'c', { columnId: 'todo', index: 1 });
    expect(cellIds(next, { columnId: 'todo' }, accessors)).toEqual(['a', 'c', 'b']);
  });

  test('a card from a later index lands right before the card it was held above', () => {
    const next = move(items, 'c', { columnId: 'todo', index: 0 });
    expect(cellIds(next, { columnId: 'todo' }, accessors)).toEqual(['c', 'a', 'b']);
  });

  test('a card from another column lands in the slot whatever its place in the data', () => {
    const before = move(items, 'd', { columnId: 'todo', index: 1 });
    expect(ids(before)).toEqual(['a', 'd', 'b', 'c']);
    expect(before.find((item) => item.id === 'd')?.status).toBe('todo');
    const after = move([cardOf('d', 'done'), ...items.slice(0, 3)], 'd', { columnId: 'todo', index: 3 });
    expect(cellIds(after, { columnId: 'todo' }, accessors)).toEqual(['a', 'b', 'c', 'd']);
  });

  test('a card dropped on a column itself lands at the end of the cell', () => {
    const next = move([cardOf('x', 'done'), ...items], 'x', { columnId: 'todo', index: 3 });
    expect(cellIds(next, { columnId: 'todo' }, accessors)).toEqual(['a', 'b', 'c', 'x']);
  });

  test('a card dropped in an empty cell takes it over without moving in the data', () => {
    const next = move(items, 'b', { columnId: 'doing', index: 0 });
    expect(ids(next)).toEqual(['a', 'b', 'c', 'd']);
    expect(next.find((item) => item.id === 'b')?.status).toBe('doing');
  });

  test('only the cell of the target counts for the rank', () => {
    const banded = [
      cardOf('a', 'todo', 's1'),
      cardOf('b', 'todo', 's2'),
      cardOf('c', 'todo', 's1'),
      cardOf('d', 'todo', 's2'),
    ];
    const next = move(banded, 'a', { columnId: 'todo', groupId: 's2', index: 1 });
    expect(cellIds(next, { columnId: 'todo', groupId: 's2' }, accessors)).toEqual(['b', 'a', 'd']);
    expect(cellIds(next, { columnId: 'todo', groupId: 's1' }, accessors)).toEqual(['c']);
  });

  test('leaves the other cards and the input list untouched', () => {
    const next = move(items, 'a', { columnId: 'done', index: 0 });
    expect(items.map((item) => item.status)).toEqual(['todo', 'todo', 'todo', 'done']);
    expect(next.find((item) => item.id === 'b')).toBe(items[1]);
  });
});

describe('rebaseSlot', () => {
  const todo = (...names: string[]) => names.map((name) => cardOf(name, 'todo'));
  const dropped = { columnId: 'todo', index: 2 };
  const rebase = (fresh: Card[], target = dropped) =>
    rebaseSlot({ items: [...todo('a', 'b', 'c'), cardOf('d', 'done')], fresh, activeId: 'd', target, accessors });

  test('keeps the slot between the neighbours it was previewed between', () => {
    expect(rebase([...todo('x', 'a', 'b', 'c'), cardOf('d', 'done')])).toEqual({ columnId: 'todo', index: 3 });
  });

  test('lands before the card it was held above, whatever was added before it', () => {
    expect(rebase([...todo('a', 'b', 'n', 'c'), cardOf('d', 'done')])).toEqual({ columnId: 'todo', index: 3 });
  });

  test('follows the card before the slot when the card after it is gone', () => {
    expect(rebase([...todo('a', 'b'), cardOf('d', 'done')])).toEqual({ columnId: 'todo', index: 2 });
  });

  test('lands after the card before the slot, whatever was added ahead of it', () => {
    expect(rebase([...todo('n1', 'n2', 'a', 'b'), cardOf('d', 'done')])).toEqual({ columnId: 'todo', index: 4 });
  });

  test('follows the last card of the cell when the slot was at its end', () => {
    expect(rebase([...todo('a', 'b', 'c', 'z'), cardOf('d', 'done')], { columnId: 'todo', index: 3 })).toEqual({
      columnId: 'todo',
      index: 3,
    });
  });

  test('clamps the rank when both neighbours are gone', () => {
    expect(rebase([...todo('a'), cardOf('d', 'done')])).toEqual({ columnId: 'todo', index: 1 });
  });

  test('keeps the band of the slot', () => {
    const banded = [cardOf('a', 'todo', 's1'), cardOf('d', 'done', 's2')];
    expect(
      rebaseSlot({
        items: banded,
        fresh: banded,
        activeId: 'd',
        target: { columnId: 'todo', groupId: 's1', index: 1 },
        accessors,
      }),
    ).toEqual({ columnId: 'todo', groupId: 's1', index: 1 });
  });
});

type Ranked = { id: string; status: string; team?: string; position?: number | null };

const ranked = (id: string, position: number | null | undefined, status = 'todo', team?: string): Ranked => ({
  id,
  status,
  team,
  position,
});

describe('sortByPosition', () => {
  const order = (items: Ranked[]) => sortByPosition(items, 'position').map((item) => item.id);

  test('orders cards by ascending position, negative and zero included', () => {
    expect(order([ranked('a', 3), ranked('b', -2), ranked('c', 0), ranked('d', 1.5)])).toEqual(['b', 'c', 'd', 'a']);
  });

  test('keeps the order of the data between cards of equal position', () => {
    expect(order([ranked('a', 1), ranked('b', 0), ranked('c', 1), ranked('d', 0), ranked('e', 1)])).toEqual([
      'b',
      'd',
      'a',
      'c',
      'e',
    ]);
  });

  test('counts a position that is not a finite number as zero', () => {
    const items = [ranked('a', 1), ranked('b', undefined), ranked('c', Number.NaN), ranked('d', null), ranked('e', -1)];
    expect(order(items)).toEqual(['e', 'b', 'c', 'd', 'a']);
    expect(order([ranked('a', Number.POSITIVE_INFINITY), ranked('b', 0)])).toEqual(['a', 'b']);
  });

  test('leaves the input list untouched', () => {
    const items = [ranked('a', 2), ranked('b', 1)];
    sortByPosition(items, 'position');
    expect(items.map((item) => item.id)).toEqual(['a', 'b']);
  });
});

const neighbourIds = (args: { items: Ranked[]; activeId: string; target: DropSlot }) => {
  const { before, after } = slotNeighbours({ ...args, accessors });
  return { beforeId: before?.id ?? null, afterId: after?.id ?? null };
};

describe('slotNeighbours', () => {
  const items = [ranked('a', 1), ranked('b', 2), ranked('c', 3), ranked('x', 0, 'done')];
  const neighbours = (activeId: string, index: number, columnId = 'todo') =>
    neighbourIds({ items, activeId, target: { columnId, index } });

  test('names the cards on both sides of the slot', () => {
    expect(neighbours('x', 1)).toEqual({ beforeId: 'a', afterId: 'b' });
    expect(neighbours('x', 2)).toEqual({ beforeId: 'b', afterId: 'c' });
  });

  test('is null on the side where the slot meets the edge of the cell', () => {
    expect(neighbours('x', 0)).toEqual({ beforeId: null, afterId: 'a' });
    expect(neighbours('x', 3)).toEqual({ beforeId: 'c', afterId: null });
  });

  test('is null on both sides in an empty cell', () => {
    expect(neighbours('a', 0, 'doing')).toEqual({ beforeId: null, afterId: null });
  });

  test('leaves the dragged card out of the cell it is dragged inside', () => {
    expect(neighbours('b', 1)).toEqual({ beforeId: 'a', afterId: 'c' });
  });

  test('only counts the cards of the band of the slot', () => {
    const banded = [ranked('a', 1, 'todo', 's1'), ranked('b', 2, 'todo', 's2'), ranked('c', 3, 'todo', 's1')];
    expect(
      neighbourIds({ items: banded, activeId: 'c', target: { columnId: 'todo', groupId: 's2', index: 1 } }),
    ).toEqual({ beforeId: 'b', afterId: null });
  });
});

describe('slotPosition', () => {
  const position = (items: Ranked[], activeId: string, target: { columnId: string; groupId?: string; index: number }) =>
    slotPosition(slotNeighbours({ items, activeId, target, accessors }), 'position');
  const cell = (...positions: number[]) => positions.map((value, index) => ranked(`c${index}`, value));
  const incoming = ranked('x', 99, 'done');

  test('is 0 in an empty cell', () => {
    expect(position([incoming], 'x', { columnId: 'todo', index: 0 })).toBe(0);
  });

  test('is one below the first card in the first slot', () => {
    const items = [...cell(5, 6), incoming];
    expect(position(items, 'x', { columnId: 'todo', index: 0 })).toBe(4);
  });

  test('is one above the last card in the last slot', () => {
    const items = [...cell(5, 6), incoming];
    expect(position(items, 'x', { columnId: 'todo', index: 2 })).toBe(7);
  });

  test('is the midpoint of the two neighbours in a middle slot', () => {
    const items = [...cell(1, 2, 6), incoming];
    expect(position(items, 'x', { columnId: 'todo', index: 1 })).toBe(1.5);
    expect(position(items, 'x', { columnId: 'todo', index: 2 })).toBe(4);
  });

  test('works with zero and negative positions', () => {
    expect(position([...cell(0), incoming], 'x', { columnId: 'todo', index: 0 })).toBe(-1);
    expect(position([...cell(0), incoming], 'x', { columnId: 'todo', index: 1 })).toBe(1);
    expect(position([...cell(-3), incoming], 'x', { columnId: 'todo', index: 0 })).toBe(-4);
    expect(position([...cell(-3), incoming], 'x', { columnId: 'todo', index: 1 })).toBe(-2);
    expect(position([...cell(-4, -2), incoming], 'x', { columnId: 'todo', index: 1 })).toBe(-3);
    expect(position([...cell(-1, 1), incoming], 'x', { columnId: 'todo', index: 1 })).toBe(0);
  });

  test('is that value between two neighbours of equal position', () => {
    expect(position([...cell(2, 2), incoming], 'x', { columnId: 'todo', index: 1 })).toBe(2);
    expect(position([...cell(0, 0), incoming], 'x', { columnId: 'todo', index: 1 })).toBe(0);
  });

  test('steps off the edge card when the cards next to it are tied', () => {
    expect(position([...cell(2, 2), incoming], 'x', { columnId: 'todo', index: 0 })).toBe(1);
    expect(position([...cell(2, 2), incoming], 'x', { columnId: 'todo', index: 2 })).toBe(3);
  });

  test('reads the cell in the order of the positions, not of the data', () => {
    const items = [ranked('c', 3), ranked('a', 1), ranked('b', 2), incoming];
    expect(position(sortByPosition(items, 'position'), 'x', { columnId: 'todo', index: 1 })).toBe(1.5);
  });

  test('leaves the dragged card out of its own cell', () => {
    const items = [ranked('a', 1), ranked('b', 2), ranked('c', 3)];
    expect(position(items, 'a', { columnId: 'todo', index: 2 })).toBe(4);
    expect(position(items, 'c', { columnId: 'todo', index: 0 })).toBe(0);
    expect(position(items, 'b', { columnId: 'todo', index: 1 })).toBe(2);
  });

  test('counts a neighbour whose position is not a finite number as zero', () => {
    const items = [ranked('a', undefined), ranked('b', null), incoming];
    expect(position(items, 'x', { columnId: 'todo', index: 1 })).toBe(0);
    expect(position(items, 'x', { columnId: 'todo', index: 2 })).toBe(1);
  });

  test('scopes the neighbours to the band of the slot', () => {
    const banded = [
      ranked('a', 10, 'todo', 's1'),
      ranked('b', 20, 'todo', 's2'),
      ranked('c', 30, 'todo', 's1'),
      ranked('d', 40, 'todo', 's2'),
      ranked('x', 99, 'done', 's1'),
    ];
    expect(position(banded, 'x', { columnId: 'todo', groupId: 's2', index: 1 })).toBe(30);
    expect(position(banded, 'x', { columnId: 'todo', groupId: 's1', index: 1 })).toBe(20);
    expect(position(banded, 'x', { columnId: 'done', groupId: 's2', index: 0 })).toBe(0);
  });

  describe('against the full cell', () => {
    const items = [ranked('a', 1), ranked('b', 2), ranked('c', 3), ranked('d', 4), ranked('x', 99, 'done')];
    const slotAt = (renderedIds: string[], hovered: DropOver) => {
      const target = previewTarget({
        items,
        activeId: 'x',
        over: hovered,
        accessors,
        renderedIds: new Set(renderedIds),
      });
      if (!target) throw new Error('no slot');
      return {
        target,
        ...neighbourIds({ items, activeId: 'x', target }),
        position: position(items, 'x', target),
      };
    };

    test('a drop below the last card shown by the pagination lands between it and the first hidden one', () => {
      expect(slotAt(['a', 'b'], zoneOver('todo'))).toMatchObject({ beforeId: 'b', afterId: 'c', position: 2.5 });
      expect(slotAt(['a', 'b'], over('b', 'todo', true))).toMatchObject({ beforeId: 'b', afterId: 'c', position: 2.5 });
    });

    test('a drop on the column with nothing shown lands at the end of the cell', () => {
      expect(slotAt([], zoneOver('todo'))).toMatchObject({ beforeId: 'd', afterId: null, position: 5 });
    });

    test('a drop above a card shown after cards hidden by a search lands behind those cards', () => {
      expect(slotAt(['a', 'd'], over('d', 'todo', false))).toMatchObject({
        beforeId: 'c',
        afterId: 'd',
        position: 3.5,
      });
    });

    test('a drop below a card shown before cards hidden by a search lands in front of those cards', () => {
      expect(slotAt(['a', 'd'], over('a', 'todo', true))).toMatchObject({ beforeId: 'a', afterId: 'b', position: 1.5 });
    });
  });
});

describe('a move rebased onto a newer list', () => {
  test('names the neighbours and the position of the newer list', () => {
    const previous = [ranked('a', 1), ranked('b', 2), ranked('c', 3), ranked('x', 99, 'done')];
    const fresh = [ranked('a', 1), ranked('b', 2), ranked('n', 2.25), ranked('c', 3), ranked('x', 99, 'done')];
    const previewed = { columnId: 'todo', index: 2 };
    const target = rebaseSlot({ items: previous, fresh, activeId: 'x', target: previewed, accessors });

    expect(neighbourIds({ items: previous, activeId: 'x', target: previewed })).toEqual({
      beforeId: 'b',
      afterId: 'c',
    });
    expect(neighbourIds({ items: fresh, activeId: 'x', target })).toEqual({ beforeId: 'n', afterId: 'c' });
    expect(slotPosition(slotNeighbours({ items: fresh, activeId: 'x', target, accessors }), 'position')).toBe(2.625);
  });
});

describe('slotPlacement', () => {
  const order = ['b', 'c', 'd'];
  const renderedIds = ['a', 'b', 'c', 'd'];

  test('goes before the first rendered card that ranks at or after the index', () => {
    expect(slotPlacement({ order, renderedIds, activeId: 'a', index: 1 })).toBe('c');
    expect(slotPlacement({ order, renderedIds, activeId: 'a', index: 0 })).toBe('b');
  });

  test('goes at the end when every rendered card ranks before the index', () => {
    expect(slotPlacement({ order, renderedIds, activeId: 'a', index: 3 })).toBeNull();
  });

  test('ignores the dragged card, which stays rendered in its own place', () => {
    expect(slotPlacement({ order: ['a', 'c'], renderedIds: ['a', 'b', 'c'], activeId: 'b', index: 1 })).toBe('c');
  });

  test('goes at the end of the rendered cards when the index is past the paginated window', () => {
    expect(slotPlacement({ order: ['a', 'b', 'c', 'd'], renderedIds: ['a', 'b'], activeId: 'x', index: 4 })).toBeNull();
  });

  test('goes before the first rendered card when search hides the cards before the index', () => {
    expect(slotPlacement({ order: ['a', 'b', 'c'], renderedIds: ['c'], activeId: 'x', index: 2 })).toBe('c');
    expect(slotPlacement({ order: ['a', 'b', 'c'], renderedIds: ['c'], activeId: 'x', index: 1 })).toBe('c');
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
  type Droppable = { id: string; rect: Rect; data: { columnId: string; groupId?: string; zone?: boolean } };

  const toClientRect = ({ top, left, width, height }: Rect) => ({
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  });

  const zone = (columnId: string, rect: Rect, groupId?: string): Droppable => ({
    id: dropZoneId(columnId, groupId),
    rect,
    data: dropZoneData(columnId, groupId),
  });
  const card = (id: string, columnId: string, rect: Rect, groupId?: string): Droppable => ({
    id,
    rect,
    data: { columnId, groupId },
  });

  const detect = (droppables: Droppable[], input: { pointer?: { x: number; y: number }; collisionRect?: Rect }) => {
    const args = {
      droppableContainers: droppables.map(({ id, data }) => ({
        id,
        data: { current: data },
        disabled: false,
      })),
      droppableRects: new Map(droppables.map(({ id, rect }) => [id, toClientRect(rect)])),
      pointerCoordinates: input.pointer ?? null,
      collisionRect: toClientRect(input.collisionRect ?? { top: 0, left: 0, width: 0, height: 0 }),
    };
    return detectBoardCollision(args as unknown as Parameters<CollisionDetection>[0]);
  };

  const collide = (
    droppables: Droppable[],
    input: { pointer?: { x: number; y: number }; collisionRect?: Rect },
  ): string[] => detect(droppables, input).map(({ id }) => String(id));

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
      zone('todo', { left: 0, top: 0, width: 300, height: 400 }, 's1'),
      card('a', 'todo', cardRect(10, 10), 's1'),
      card('b', 'todo', cardRect(10, 100), 's1'),
      card('c', 'todo', cardRect(10, 190), 's1'),
      card('d', 'todo', cardRect(10, 280), 's1'),
      zone('done', { left: 320, top: 0, width: 300, height: 400 }, 's1'),
      zone('todo', { left: 0, top: 420, width: 300, height: 100 }, 's2'),
      card('e', 'todo', cardRect(10, 430), 's2'),
    ];
    expect(collide(grouped, { pointer: { x: 400, y: 300 } })).toEqual(['s1::done']);
    expect(collide(grouped, { pointer: { x: 100, y: 440 } })).toEqual(['e']);
    expect(collide(grouped, { pointer: { x: 100, y: 120 } })).toEqual(['b']);
  });

  test('ignores the cards of the same column in another band', () => {
    const bands = [
      zone('done', { left: 0, top: 0, width: 300, height: 400 }, 's1'),
      zone('done', { left: 0, top: 420, width: 300, height: 200 }, 's2'),
      card('f', 'done', cardRect(10, 430), 's2'),
    ];
    expect(collide(bands, { pointer: { x: 100, y: 300 } })).toEqual(['s1::done']);
    expect(collide(bands, { pointer: { x: 100, y: 440 } })).toEqual(['f']);
  });

  test('matches the cards of a band whose id contains the zone separator', () => {
    const band = 'a::b';
    const separated = [
      zone('todo', { left: 0, top: 0, width: 300, height: 400 }, band),
      card('x', 'todo', cardRect(10, 10), band),
      card('y', 'todo', cardRect(10, 100), band),
    ];
    expect(collide(separated, { pointer: { x: 100, y: 120 } })).toEqual(['y']);
  });

  test('resolves the column by rectangle intersection without a pointer', () => {
    expect(collide(flat, { collisionRect: { left: 330, top: 600, width: 280, height: 80 } })).toEqual(['done']);
  });

  test('picks the column the dragged rectangle overlaps most without a pointer', () => {
    expect(collide(flat, { collisionRect: { left: 100, top: 100, width: 280, height: 80 } })).toEqual(['b']);
    expect(collide(flat, { collisionRect: { left: 290, top: 100, width: 280, height: 80 } })).toEqual(['done']);
  });

  test('tells whether the pointer is below the vertical centre of the card it targets', () => {
    expect(detect(flat, { pointer: { x: 100, y: 120 } }).map(({ data }) => data?.below)).toEqual([false]);
    expect(detect(flat, { pointer: { x: 100, y: 150 } }).map(({ data }) => data?.below)).toEqual([true]);
    expect(detect(flat, { pointer: { x: 100, y: 3 } }).map(({ data }) => data?.below)).toEqual([false]);
  });
});
