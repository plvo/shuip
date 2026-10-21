import { describe, expect, test } from 'bun:test';
import type { BoardTask } from './board-behaviour-harness';
import { defineBoardDragSuite, ranked, WITH_POSITIONS } from './board-drag-suite';
import { VARIANTS } from './react-mount';

const { boards, mount, handleOf, columnTitles, dropSlotPlace, hold, release, drag } = defineBoardDragSuite({
  name: 'data-board',
  canonicalSource: /data-board\/component\.radix\.tsx$/,
  columnSlot: '[data-slot="data-board-column-body"]',
  dropSlot: '[data-slot="data-board-drop-slot"]',
  bandSlot: '[data-slot="data-board-band-body"]',
  load: async () => {
    const radix = await import('../items/blocks/data-board/component.radix');
    const base = await import('../generated/base/items/blocks/data-board/component.base');
    return { Radix: radix.DataBoard, 'Base UI': base.DataBoard };
  },
});

describe.each(VARIANTS)('data-board drag on %s', (variant) => {
  test('drops a card below the last visible card of a paginated column right after it and reveals it', async () => {
    const { moves } = await mount(boards[variant], { pageSize: 2 });
    expect(columnTitles()[0]).toEqual(['Task A', 'Task B']);

    await hold(handleOf('Task D'), [
      { x: 650, y: 120 },
      { x: 640, y: 140 },
      { x: 150, y: 400 },
    ]);
    expect(dropSlotPlace()).toEqual({ column: 0, index: 2 });
    await release({ x: 150, y: 400 });

    expect(moves[0]).toMatchObject({ item: { id: 'd' }, toColumn: 'todo', toIndex: 2 });
    expect(columnTitles()[0]).toEqual(['Task A', 'Task B', 'Task D', 'Task C']);
  });

  test('drops a card into a cell of another band and writes the band value', async () => {
    const data: BoardTask[] = [
      { id: 'a', status: 'todo', title: 'Task A', sprint: 1 },
      { id: 'b', status: 'todo', title: 'Task B', sprint: 1 },
      { id: 'c', status: 'todo', title: 'Task C', sprint: 2 },
      { id: 'd', status: 'done', title: 'Task D', sprint: 2 },
    ];
    const { moves, dataChanges } = await mount(boards[variant], { data, groupBy: { field: 'sprint' } });
    expect(columnTitles()).toEqual([['Task A', 'Task B'], [], [], ['Task C'], [], ['Task D']]);

    await hold(handleOf('Task A'), [
      { x: 150, y: 120 },
      { x: 160, y: 140 },
      { x: 150, y: 620 },
    ]);
    expect(dropSlotPlace()).toEqual({ column: 3, index: 0 });
    expect(columnTitles()).toEqual([['Task A', 'Task B'], [], [], ['Task C'], [], ['Task D']]);

    await release({ x: 150, y: 620 });
    expect(columnTitles()).toEqual([['Task B'], [], [], ['Task A', 'Task C'], [], ['Task D']]);
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ item: { id: 'a', sprint: 2 }, fromGroup: '1', toGroup: '2', toIndex: 1 });
    expect(dataChanges).toHaveLength(1);
  });

  test('reveals a card dropped past the paginated window of a band', async () => {
    const data: BoardTask[] = [
      { id: 'a', status: 'todo', title: 'Task A', sprint: 1 },
      { id: 'c', status: 'todo', title: 'Task C', sprint: 2 },
      { id: 'e', status: 'todo', title: 'Task E', sprint: 2 },
    ];
    const { moves } = await mount(boards[variant], { data, groupBy: { field: 'sprint' }, pageSize: 1 });
    expect(columnTitles()).toEqual([['Task A'], [], [], ['Task C'], [], []]);

    await hold(handleOf('Task A'), [
      { x: 150, y: 120 },
      { x: 160, y: 140 },
      { x: 150, y: 800 },
    ]);
    expect(dropSlotPlace()).toEqual({ column: 3, index: 1 });
    await release({ x: 150, y: 800 });

    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ item: { id: 'a', sprint: 2 }, toGroup: '2', toIndex: 1 });
    expect(columnTitles()).toEqual([['Task C', 'Task A'], [], []]);
  });

  describe('with a positionField', () => {
    test('computes the position from the neighbours in the cell of a band only', async () => {
      const data = [
        ranked('a', 'todo', 5, 1),
        ranked('b', 'todo', 6, 1),
        ranked('c', 'todo', 100, 2),
        ranked('d', 'done', 7, 2),
      ];
      const { moves } = await mount(boards[variant], { ...WITH_POSITIONS, data, groupBy: { field: 'sprint' } });

      await drag(handleOf('Task A'), [
        { x: 150, y: 120 },
        { x: 160, y: 140 },
        { x: 150, y: 620 },
      ]);

      expect(moves).toHaveLength(1);
      expect(moves[0]).toMatchObject({
        item: { id: 'a', sprint: 2, rank: 99 },
        position: 99,
        beforeId: null,
        afterId: 'c',
      });
    });

    test('computes the position against the cards the pagination hides', async () => {
      const data = [ranked('a', 'todo', 1), ranked('b', 'todo', 2), ranked('c', 'todo', 3), ranked('d', 'done', 9)];
      const { moves } = await mount(boards[variant], { ...WITH_POSITIONS, data, pageSize: 2 });
      expect(columnTitles()[0]).toEqual(['Task A', 'Task B']);

      await drag(handleOf('Task D'), [
        { x: 650, y: 120 },
        { x: 640, y: 140 },
        { x: 150, y: 400 },
      ]);

      expect(moves[0]).toMatchObject({ item: { id: 'd', rank: 2.5 }, position: 2.5, beforeId: 'b', afterId: 'c' });
      expect(columnTitles()[0]).toEqual(['Task A', 'Task B', 'Task D', 'Task C']);
    });
  });
});
