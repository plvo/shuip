import { describe, expect, test } from 'bun:test';
import type { CollisionDetection } from '@dnd-kit/core';
import {
  applyCardMove,
  type CardAccessors,
  cellIds,
  cellOrder,
  type DropOver,
  type DropSlot,
  detectBoardCollision,
  dropZoneData,
  isSameSlot,
  landingIndex,
  originSlot,
  previewTarget,
  rebaseSlot,
  slotNeighbours,
  slotPlacement,
  slotPosition,
  sortByPosition,
} from './component.radix';

type Card = { id: string; status: string };

const cardOf = (id: string, status: string): Card => ({ id, status });

const accessors: CardAccessors<Card> = {
  getId: (item) => item.id,
  getColumn: (item) => item.status,
};

const ids = (items: Card[]) => items.map((item) => item.id);

const over = (id: string, columnId: string, below: boolean): DropOver => ({ id, columnId, zone: false, below });

const zoneOver = (columnId: string): DropOver => ({ id: columnId, columnId, zone: true, below: false });

describe('cellIds', () => {
  test('lists the cards of one column, in order', () => {
    const items = [cardOf('a', 'todo'), cardOf('b', 'done'), cardOf('c', 'todo')];
    expect(cellIds(items, { columnId: 'todo' }, accessors)).toEqual(['a', 'c']);
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

  test('previews the slot right after the last rendered card when the search hides cards', () => {
    const renderedIds = new Set(['a', 'b']);
    expect(previewTarget({ items, activeId: 'd', over: zoneOver('todo'), accessors, renderedIds })).toEqual({
      columnId: 'todo',
      index: 2,
    });
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
});

describe('originSlot', () => {
  test('is the rank of the card inside its own column', () => {
    const items = [cardOf('a', 'todo'), cardOf('b', 'done'), cardOf('c', 'todo')];
    expect(originSlot(items, 'c', accessors)).toEqual({ columnId: 'todo', index: 1 });
  });

  test('is null for an unknown card', () => {
    expect(originSlot([cardOf('a', 'todo')], 'zzz', accessors)).toBeNull();
  });
});

describe('isSameSlot', () => {
  test('compares column and index', () => {
    const slot = { columnId: 'todo', index: 2 };
    expect(isSameSlot(slot, { ...slot })).toBe(true);
    expect(isSameSlot(slot, { ...slot, index: 1 })).toBe(false);
    expect(isSameSlot(slot, { ...slot, columnId: 'done' })).toBe(false);
  });

  test('two missing slots are the same, a missing and a present one are not', () => {
    expect(isSameSlot(null, null)).toBe(true);
    expect(isSameSlot(null, { columnId: 'todo', index: 0 })).toBe(false);
  });
});

describe('applyCardMove', () => {
  const withLanding = (item: Card, cell: { columnId: string }): Card => ({ ...item, status: cell.columnId });
  const move = (items: Card[], activeId: string, target: { columnId: string; index: number }) =>
    applyCardMove({ items, activeId, target, accessors, withLanding });
  const statusOf = (items: Card[], id: string) => items.find((item) => item.id === id)?.status;

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
    expect(statusOf(before, 'd')).toBe('todo');
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
    expect(statusOf(next, 'b')).toBe('doing');
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
});

type Ranked = { id: string; status: string; position?: number | null };

const ranked = (id: string, position: number | null | undefined, status = 'todo'): Ranked => ({
  id,
  status,
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
});

describe('slotPosition', () => {
  const position = (items: Ranked[], activeId: string, target: { columnId: string; index: number }) =>
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

    test('a drop below the last card shown by a search lands between it and the first hidden one', () => {
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

  test('goes at the end of the rendered cards when the index is past what the search leaves', () => {
    expect(slotPlacement({ order: ['a', 'b', 'c', 'd'], renderedIds: ['a', 'b'], activeId: 'x', index: 4 })).toBeNull();
  });

  test('goes before the first rendered card when search hides the cards before the index', () => {
    expect(slotPlacement({ order: ['a', 'b', 'c'], renderedIds: ['c'], activeId: 'x', index: 2 })).toBe('c');
    expect(slotPlacement({ order: ['a', 'b', 'c'], renderedIds: ['c'], activeId: 'x', index: 1 })).toBe('c');
  });
});

describe('detectBoardCollision', () => {
  type Rect = { top: number; left: number; width: number; height: number };
  type Droppable = { id: string; rect: Rect; data: { columnId: string; zone?: boolean } };

  const toClientRect = ({ top, left, width, height }: Rect) => ({
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  });

  const zone = (columnId: string, rect: Rect): Droppable => ({
    id: columnId,
    rect,
    data: dropZoneData(columnId),
  });
  const card = (id: string, columnId: string, rect: Rect): Droppable => ({ id, rect, data: { columnId } });

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
  const columns = [
    zone('todo', { left: 0, top: 0, width: 300, height: 900 }),
    card('a', 'todo', cardRect(10, 10)),
    card('b', 'todo', cardRect(10, 100)),
    card('c', 'todo', cardRect(10, 190)),
    zone('done', { left: 320, top: 0, width: 300, height: 900 }),
  ];

  test('targets a tall empty column whatever the cards of its neighbour', () => {
    expect(collide(columns, { pointer: { x: 400, y: 700 } })).toEqual(['done']);
    expect(collide(columns, { pointer: { x: 400, y: 5 } })).toEqual(['done']);
  });

  test('targets the closest card of the column under the pointer', () => {
    expect(collide(columns, { pointer: { x: 100, y: 120 } })).toEqual(['b']);
    expect(collide(columns, { pointer: { x: 100, y: 3 } })).toEqual(['a']);
  });

  test('targets the closest card when the pointer is in the gap between two cards', () => {
    expect(collide(columns, { pointer: { x: 100, y: 92 } })).toEqual(['a']);
    expect(collide(columns, { pointer: { x: 100, y: 96 } })).toEqual(['b']);
  });

  test('targets the column itself when the pointer is below its last card', () => {
    expect(collide(columns, { pointer: { x: 100, y: 600 } })).toEqual(['todo']);
  });

  test('targets nothing when the pointer is outside every column', () => {
    expect(collide(columns, { pointer: { x: 310, y: 100 } })).toEqual([]);
    expect(collide(columns, { pointer: { x: 100, y: 950 } })).toEqual([]);
  });

  test('ignores the cards of another column', () => {
    const sideBySide = [
      zone('todo', { left: 0, top: 0, width: 300, height: 400 }),
      card('a', 'todo', cardRect(10, 10)),
      zone('done', { left: 320, top: 0, width: 300, height: 400 }),
      card('f', 'done', cardRect(330, 200)),
    ];
    expect(collide(sideBySide, { pointer: { x: 400, y: 20 } })).toEqual(['f']);
    expect(collide(sideBySide, { pointer: { x: 100, y: 300 } })).toEqual(['todo']);
  });

  test('resolves the column by rectangle intersection without a pointer', () => {
    expect(collide(columns, { collisionRect: { left: 330, top: 600, width: 280, height: 80 } })).toEqual(['done']);
  });

  test('picks the column the dragged rectangle overlaps most without a pointer', () => {
    expect(collide(columns, { collisionRect: { left: 100, top: 100, width: 280, height: 80 } })).toEqual(['b']);
    expect(collide(columns, { collisionRect: { left: 290, top: 100, width: 280, height: 80 } })).toEqual(['done']);
  });

  test('tells whether the pointer is below the vertical centre of the card it targets', () => {
    expect(detect(columns, { pointer: { x: 100, y: 120 } }).map(({ data }) => data?.below)).toEqual([false]);
    expect(detect(columns, { pointer: { x: 100, y: 150 } }).map(({ data }) => data?.below)).toEqual([true]);
    expect(detect(columns, { pointer: { x: 100, y: 3 } }).map(({ data }) => data?.below)).toEqual([false]);
  });
});
