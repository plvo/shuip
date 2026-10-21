import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import type { ComponentType } from 'react';
import {
  type BoardProps,
  type BoardTask,
  CARD_HEIGHT,
  createBoardHarness,
  INITIAL_COLUMNS,
  TASKS,
} from './board-behaviour-harness';
import { installDom, resolveCanonicalAliases } from './dom-environment';
import { VARIANTS, type Variant } from './react-mount';

export const WITH_POSITIONS = { positionField: 'rank' } as const;

export const ranked = (id: string, status: string, rank: number, sprint?: number): BoardTask => ({
  id,
  status,
  title: `Task ${id.toUpperCase()}`,
  rank,
  sprint,
});

type BoardDescriptor = {
  name: string;
  /** Matches the canonical source file, so that its aliases resolve to the Radix primitives. */
  canonicalSource: RegExp;
  columnSlot: string;
  dropSlot: string;
  bandSlot?: string;
  /** Imports the board once per variant, after the DOM is installed. */
  load: () => Promise<Record<Variant, unknown>>;
};

/**
 * Installs the DOM and the stub geometry for the calling test file, loads the board of each variant, and
 * registers the cases every board shares. The file adds its own cases with the returned helpers.
 */
export function defineBoardDragSuite({
  name,
  canonicalSource,
  columnSlot,
  dropSlot: dropSlotSelector,
  bandSlot,
  load,
}: BoardDescriptor) {
  const harness = createBoardHarness({ columnSlot, dropSlot: dropSlotSelector, bandSlot });
  const { stubGeometry, mount, handleOf, columnTitles, dropSlot, slotFades, dropSlotPlace, moveTo, hold, release } =
    harness;
  const { search, pressKey, drag, pickUpB, inAct } = harness;
  const boards = {} as Record<Variant, ComponentType<BoardProps>>;
  let uninstallDom: () => Promise<void>;
  let restoreGeometry: () => void;

  // The browser and the components are loaded here, not at the top of the file, so that no other test file sees them.
  beforeAll(async () => {
    uninstallDom = installDom();
    restoreGeometry = stubGeometry();
    resolveCanonicalAliases(canonicalSource);
    await harness.load();
    Object.assign(boards, (await load()) as Record<Variant, ComponentType<BoardProps>>);
  });

  afterAll(async () => {
    restoreGeometry();
    await uninstallDom();
  });

  afterEach(harness.cleanup);

  describe.each(VARIANTS)(`${name} drag on %s`, (variant) => {
    test('drops a card into a tall empty column', async () => {
      const { moves, dataChanges } = await mount(boards[variant]);
      expect(columnTitles()).toEqual(INITIAL_COLUMNS);

      await drag(handleOf('Task B'), [
        { x: 150, y: 200 },
        { x: 160, y: 215 },
        { x: 400, y: 600 },
        { x: 420, y: 900 },
      ]);

      expect(moves).toHaveLength(1);
      expect(moves[0]).toMatchObject({ item: { id: 'b' }, fromColumn: 'todo', toColumn: 'doing', toIndex: 0 });
      expect(dataChanges).toHaveLength(1);
      expect(columnTitles()).toEqual([['Task A', 'Task C'], ['Task B'], ['Task D']]);
    });

    test('holds a card between two columns over many move events without re-rendering in a loop', async () => {
      const { moves, errors } = await mount(boards[variant]);
      await pickUpB();

      for (let step = 0; step < 60; step++) {
        await moveTo({ x: 270 + (step % 4) * 20, y: 150 + ((step * 37) % 700) });
      }
      expect(errors).toEqual([]);
      expect(columnTitles()).toEqual(INITIAL_COLUMNS);

      await moveTo({ x: 290, y: 400 });
      await release({ x: 290, y: 400 });
      expect(errors).toEqual([]);
      expect(moves).toEqual([]);
      expect(columnTitles()).toEqual(INITIAL_COLUMNS);
    });

    test('leaves the other cards in place and shows a drop slot of the dragged card height', async () => {
      await mount(boards[variant]);
      await pickUpB();

      await moveTo({ x: 700, y: 170 });
      expect(columnTitles()).toEqual(INITIAL_COLUMNS);
      expect(dropSlotPlace()).toEqual({ column: 2, index: 1 });
      expect(slotFades()).toBe(true);
      const slot = dropSlot() as HTMLElement;
      expect(slot.style.height).toBe(`${CARD_HEIGHT}px`);
      expect(slot.getAttribute('aria-hidden')).toBe('true');
      expect(slot.hasAttribute('tabindex')).toBe(false);
      expect(slot.querySelector('button, a, input, [tabindex]')).toBeNull();

      await moveTo({ x: 700, y: 120 });
      expect(dropSlotPlace()).toEqual({ column: 2, index: 0 });
      expect(slotFades()).toBe(false);

      await moveTo({ x: 700, y: 400 });
      expect(dropSlotPlace()).toEqual({ column: 2, index: 1 });
      expect(slotFades()).toBe(false);

      await moveTo({ x: 150, y: 230 });
      expect(dropSlot()).toBeNull();
      expect(columnTitles()).toEqual(INITIAL_COLUMNS);

      await moveTo({ x: 700, y: 170 });
      expect(slotFades()).toBe(true);
    });

    test('shows the drop slot next to the dragged card, which stays rendered, inside its own column', async () => {
      await mount(boards[variant]);
      await pickUpB();

      await moveTo({ x: 150, y: 340 });
      expect(dropSlotPlace()).toEqual({ column: 0, index: 3 });
      expect(columnTitles()).toEqual(INITIAL_COLUMNS);

      await moveTo({ x: 150, y: 120 });
      expect(dropSlotPlace()).toEqual({ column: 0, index: 0 });
      expect(columnTitles()).toEqual(INITIAL_COLUMNS);
    });

    test('drops a card right after the card it is held below and right before the card it is held above', async () => {
      const { moves, dataChanges } = await mount(boards[variant]);

      await drag(handleOf('Task C'), [
        { x: 150, y: 290 },
        { x: 160, y: 270 },
        { x: 150, y: 170 },
      ]);
      expect(columnTitles()[0]).toEqual(['Task A', 'Task C', 'Task B']);
      expect(moves.map(({ toIndex }) => toIndex)).toEqual([1]);

      await drag(handleOf('Task A'), [
        { x: 150, y: 120 },
        { x: 160, y: 140 },
        { x: 150, y: 290 },
      ]);
      expect(columnTitles()[0]).toEqual(['Task C', 'Task A', 'Task B']);
      expect(moves.map(({ toIndex }) => toIndex)).toEqual([1, 1]);
      expect(dataChanges).toHaveLength(2);
    });

    test('drops a card from an earlier index below the card it is held over', async () => {
      const { moves } = await mount(boards[variant]);
      await drag(handleOf('Task A'), [
        { x: 150, y: 120 },
        { x: 160, y: 140 },
        { x: 150, y: 340 },
      ]);
      expect(columnTitles()[0]).toEqual(['Task B', 'Task C', 'Task A']);
      expect(moves.map(({ toIndex }) => toIndex)).toEqual([2]);
    });

    test('drops a card below the last card of a column after it', async () => {
      const { moves } = await mount(boards[variant]);
      await drag(handleOf('Task A'), [
        { x: 150, y: 120 },
        { x: 160, y: 140 },
        { x: 150, y: 450 },
      ]);
      expect(columnTitles()[0]).toEqual(['Task B', 'Task C', 'Task A']);
      expect(moves.map(({ toIndex }) => toIndex)).toEqual([2]);
    });

    test('drops a card from another column on the card it is held over', async () => {
      const { moves } = await mount(boards[variant]);
      await drag(handleOf('Task D'), [
        { x: 650, y: 120 },
        { x: 640, y: 140 },
        { x: 150, y: 150 },
      ]);
      expect(columnTitles()).toEqual([['Task A', 'Task D', 'Task B', 'Task C'], [], []]);
      expect(moves).toHaveLength(1);
      expect(moves[0]).toMatchObject({
        item: { id: 'd', status: 'todo' },
        fromColumn: 'done',
        toColumn: 'todo',
        toIndex: 1,
      });
    });

    test.each([
      ['on its original slot', { x: 150, y: 230 }],
      ['below the card above it', { x: 150, y: 180 }],
      ['above the card below it', { x: 150, y: 285 }],
      ['outside any column', { x: 290, y: 400 }],
      ['below the box of a column', { x: 150, y: 600 }],
    ])('leaves the board as it was when a card is dropped %s', async (_name, drop) => {
      const { moves, dataChanges, errors } = await mount(boards[variant]);
      await drag(handleOf('Task B'), [{ x: 150, y: 200 }, { x: 160, y: 215 }, drop]);

      expect(moves).toEqual([]);
      expect(dataChanges).toEqual([]);
      expect(errors).toEqual([]);
      expect(dropSlot()).toBeNull();
      expect(columnTitles()).toEqual(INITIAL_COLUMNS);
    });

    test('restores the board when Escape is pressed mid-drag', async () => {
      const { moves, dataChanges } = await mount(boards[variant]);
      await pickUpB();
      await moveTo({ x: 700, y: 120 });
      expect(dropSlot()).not.toBeNull();

      await pressKey('Escape');
      expect(dropSlot()).toBeNull();
      expect(columnTitles()).toEqual(INITIAL_COLUMNS);

      await release({ x: 700, y: 120 });
      expect(moves).toEqual([]);
      expect(dataChanges).toEqual([]);
    });

    test.each([
      ['Escape is pressed', () => pressKey('Escape')],
      ['the card is dropped on its original slot', () => release({ x: 150, y: 230 })],
    ])('applies a data update received mid-drag once %s', async (_name, finish) => {
      const { rerender, moves } = await mount(boards[variant]);
      await pickUpB();
      await moveTo({ x: 700, y: 120 });

      await rerender([...TASKS, { id: 'e', status: 'doing', title: 'Task E' }]);
      expect(columnTitles()[1]).toEqual([]);

      await moveTo({ x: 150, y: 230 });
      await finish();
      expect(columnTitles()).toEqual([['Task A', 'Task B', 'Task C'], ['Task E'], ['Task D']]);
      expect(moves).toEqual([]);
    });

    test('rebases the move onto a data update received mid-drag', async () => {
      const { rerender, moves, dataChanges } = await mount(boards[variant]);
      await pickUpB();
      await moveTo({ x: 700, y: 120 });

      await rerender([...TASKS, { id: 'e', status: 'doing', title: 'Task E' }]);
      await release({ x: 700, y: 120 });

      expect(moves).toHaveLength(1);
      expect(moves[0]).toMatchObject({ item: { id: 'b', status: 'done' }, toColumn: 'done', toIndex: 0 });
      expect(dataChanges).toHaveLength(1);
      expect(dataChanges[0]?.map(({ id, status }) => `${id}:${status}`)).toEqual([
        'a:todo',
        'c:todo',
        'b:done',
        'd:done',
        'e:doing',
      ]);
      expect(columnTitles()).toEqual([['Task A', 'Task C'], ['Task E'], ['Task B', 'Task D']]);
    });

    test('rebases the move between the neighbours it was previewed between', async () => {
      const { rerender, moves, dataChanges } = await mount(boards[variant]);
      await pickUpB();
      await moveTo({ x: 700, y: 170 });
      expect(dropSlotPlace()).toEqual({ column: 2, index: 1 });

      await rerender([...TASKS.slice(0, 3), { id: 'e', status: 'done', title: 'Task E' }, ...TASKS.slice(3)]);
      await release({ x: 700, y: 170 });

      expect(moves).toHaveLength(1);
      expect(dataChanges).toHaveLength(1);
      expect(columnTitles()).toEqual([['Task A', 'Task C'], [], ['Task E', 'Task D', 'Task B']]);
    });

    test('applies a data update that removed the dragged card and reports no move', async () => {
      const { rerender, moves, dataChanges } = await mount(boards[variant]);
      await pickUpB();
      await moveTo({ x: 700, y: 120 });

      await rerender(TASKS.filter(({ id }) => id !== 'b'));
      await release({ x: 700, y: 120 });

      expect(moves).toEqual([]);
      expect(dataChanges).toEqual([]);
      expect(columnTitles()).toEqual([['Task A', 'Task C'], [], ['Task D']]);
    });

    test('drops a card picked up and moved with the keyboard', async () => {
      const { moves, dataChanges } = await mount(boards[variant]);
      const handle = handleOf('Task B');
      await inAct(async () => {
        handle.focus();
      });

      await pressKey('Space', handle);
      expect(dropSlot()).toBeNull();

      await pressKey('ArrowRight');
      expect(columnTitles()).toEqual(INITIAL_COLUMNS);
      expect(dropSlotPlace()?.column).toBe(1);

      await pressKey('Space');
      expect(dropSlot()).toBeNull();
      expect(moves).toHaveLength(1);
      expect(moves[0]).toMatchObject({ item: { id: 'b' }, fromColumn: 'todo', toColumn: 'doing', toIndex: 0 });
      expect(dataChanges).toHaveLength(1);
      expect(columnTitles()).toEqual([['Task A', 'Task C'], ['Task B'], ['Task D']]);
    });

    test('drops a card below the last card shown by a search right after it, before the cards it hides', async () => {
      const data: BoardTask[] = [
        { id: 'a', status: 'todo', title: 'Alpha one' },
        { id: 'b', status: 'todo', title: 'Alpha two' },
        { id: 'c', status: 'todo', title: 'Beta three' },
        { id: 'd', status: 'done', title: 'Alpha four' },
      ];
      const { moves, dataChanges } = await mount(boards[variant], { data, searchableFields: ['title'] });
      await search('alpha');
      expect(columnTitles()).toEqual([['Alpha one', 'Alpha two'], [], ['Alpha four']]);

      await hold(handleOf('Alpha four'), [
        { x: 650, y: 120 },
        { x: 640, y: 140 },
        { x: 150, y: 400 },
      ]);
      expect(dropSlotPlace()).toEqual({ column: 0, index: 2 });
      await release({ x: 150, y: 400 });

      expect(moves).toHaveLength(1);
      expect(moves[0]).toMatchObject({ item: { id: 'd' }, toColumn: 'todo', toIndex: 2 });
      expect(dataChanges[0]?.map(({ id }) => id)).toEqual(['a', 'b', 'd', 'c']);
      expect(columnTitles()).toEqual([['Alpha one', 'Alpha two', 'Alpha four'], [], []]);
    });

    describe('with a positionField', () => {
      const RANKED: BoardTask[] = [
        ranked('a', 'todo', 3),
        ranked('b', 'todo', 1),
        ranked('c', 'todo', 2),
        ranked('d', 'done', 5),
      ];
      const rankOf = (task: BoardTask[] | undefined, id: string) => task?.find((item) => item.id === id)?.rank;

      test('renders each column by ascending position', async () => {
        await mount(boards[variant], { ...WITH_POSITIONS, data: RANKED });
        expect(columnTitles()).toEqual([['Task B', 'Task C', 'Task A'], [], ['Task D']]);
      });

      test('keeps the data order of cards of equal position', async () => {
        const tied = [ranked('a', 'todo', 1), ranked('b', 'todo', 0), ranked('c', 'todo', 1), ranked('d', 'todo', 0)];
        await mount(boards[variant], { ...WITH_POSITIONS, data: tied });
        expect(columnTitles()[0]).toEqual(['Task B', 'Task D', 'Task A', 'Task C']);
      });

      test('renders the order of the data when there is no positionField', async () => {
        await mount(boards[variant], { data: RANKED });
        expect(columnTitles()[0]).toEqual(['Task A', 'Task B', 'Task C']);
      });

      test('writes the midpoint of the neighbours into the dropped card and reports it', async () => {
        const { moves, dataChanges } = await mount(boards[variant], { ...WITH_POSITIONS, data: RANKED });

        await drag(handleOf('Task A'), [
          { x: 150, y: 318 },
          { x: 160, y: 300 },
          { x: 150, y: 200 },
        ]);

        expect(columnTitles()[0]).toEqual(['Task B', 'Task A', 'Task C']);
        expect(moves).toHaveLength(1);
        expect(moves[0]).toMatchObject({
          item: { id: 'a', rank: 1.5 },
          toIndex: 1,
          position: 1.5,
          beforeId: 'b',
          afterId: 'c',
        });
        expect(dataChanges).toHaveLength(1);
        expect(rankOf(dataChanges[0], 'a')).toBe(1.5);
        expect(dataChanges[0]?.map(({ id }) => id)).toEqual(['b', 'a', 'c', 'd']);
      });

      test('puts a card dropped in an empty column at position 0 without neighbours', async () => {
        const { moves } = await mount(boards[variant], { ...WITH_POSITIONS, data: RANKED });

        await drag(handleOf('Task B'), [
          { x: 150, y: 120 },
          { x: 160, y: 140 },
          { x: 420, y: 900 },
        ]);

        expect(moves).toHaveLength(1);
        expect(moves[0]).toMatchObject({
          item: { id: 'b', status: 'doing', rank: 0 },
          position: 0,
          beforeId: null,
          afterId: null,
        });
      });

      test('puts a card dropped below the last card one above it', async () => {
        const { moves, dataChanges } = await mount(boards[variant], { ...WITH_POSITIONS, data: RANKED });

        await drag(handleOf('Task D'), [
          { x: 650, y: 120 },
          { x: 640, y: 140 },
          { x: 150, y: 450 },
        ]);

        expect(moves[0]).toMatchObject({
          item: { id: 'd', rank: 4 },
          toIndex: 3,
          position: 4,
          beforeId: 'a',
          afterId: null,
        });
        expect(columnTitles()[0]).toEqual(['Task B', 'Task C', 'Task A', 'Task D']);
        expect(rankOf(dataChanges[0], 'd')).toBe(4);
      });

      test('puts a card dropped above the first card one below it', async () => {
        const { moves } = await mount(boards[variant], { ...WITH_POSITIONS, data: RANKED });

        await drag(handleOf('Task D'), [
          { x: 650, y: 120 },
          { x: 640, y: 140 },
          { x: 150, y: 120 },
        ]);

        expect(moves[0]).toMatchObject({
          item: { id: 'd', rank: 0 },
          toIndex: 0,
          position: 0,
          beforeId: null,
          afterId: 'b',
        });
        expect(columnTitles()[0]).toEqual(['Task D', 'Task B', 'Task C', 'Task A']);
      });

      test('keeps a card dropped between two cards of equal position between them', async () => {
        const tied = [ranked('a', 'todo', 7), ranked('b', 'todo', 7), ranked('c', 'todo', 7)];
        const { moves, dataChanges } = await mount(boards[variant], { ...WITH_POSITIONS, data: tied });

        await drag(handleOf('Task C'), [
          { x: 150, y: 290 },
          { x: 160, y: 270 },
          { x: 150, y: 200 },
        ]);

        expect(moves[0]).toMatchObject({ position: 7, beforeId: 'a', afterId: 'b' });
        expect(dataChanges[0]?.map(({ id }) => id)).toEqual(['a', 'c', 'b']);
        expect(columnTitles()[0]).toEqual(['Task A', 'Task C', 'Task B']);
      });

      test('lists the cards of onDataChange by position, not in the order of the data', async () => {
        const { moves, dataChanges } = await mount(boards[variant], { ...WITH_POSITIONS, data: RANKED });

        await drag(handleOf('Task D'), [
          { x: 650, y: 120 },
          { x: 640, y: 140 },
          { x: 150, y: 260 },
        ]);

        expect(moves[0]).toMatchObject({ position: 2.5, beforeId: 'c', afterId: 'a' });
        expect(dataChanges[0]?.map(({ id }) => id)).toEqual(['b', 'c', 'd', 'a']);
        expect(columnTitles()[0]).toEqual(['Task B', 'Task C', 'Task D', 'Task A']);
      });

      test('lists a card that took over an empty column at its new position', async () => {
        const { dataChanges } = await mount(boards[variant], { ...WITH_POSITIONS, data: RANKED });

        await drag(handleOf('Task C'), [
          { x: 150, y: 232 },
          { x: 160, y: 250 },
          { x: 420, y: 900 },
        ]);

        expect(dataChanges[0]?.map(({ id, rank }) => `${id}:${rank}`)).toEqual(['c:0', 'b:1', 'a:3', 'd:5']);
      });

      test('takes the neighbours and the position from a data update received mid-drag', async () => {
        const { rerender, moves, dataChanges } = await mount(boards[variant], { ...WITH_POSITIONS, data: RANKED });
        await hold(handleOf('Task D'), [
          { x: 650, y: 120 },
          { x: 640, y: 140 },
          { x: 150, y: 200 },
        ]);
        expect(dropSlotPlace()).toEqual({ column: 0, index: 1 });

        await rerender([...RANKED, ranked('n', 'todo', 1.75)]);
        expect(columnTitles()[0]).toEqual(['Task B', 'Task C', 'Task A']);
        await release({ x: 150, y: 200 });

        expect(moves).toHaveLength(1);
        expect(moves[0]).toMatchObject({
          item: { id: 'd', rank: 1.875 },
          toIndex: 2,
          position: 1.875,
          beforeId: 'n',
          afterId: 'c',
        });
        expect(dataChanges).toHaveLength(1);
        expect(dataChanges[0]?.map(({ id }) => id)).toEqual(['b', 'n', 'd', 'c', 'a']);
        expect(columnTitles()[0]).toEqual(['Task B', 'Task N', 'Task D', 'Task C', 'Task A']);
      });

      test('computes the position against the cards a search hides', async () => {
        const data: BoardTask[] = [
          { ...ranked('a', 'todo', 1), title: 'Alpha one' },
          { ...ranked('b', 'todo', 2), title: 'Beta two' },
          { ...ranked('c', 'todo', 3), title: 'Alpha three' },
          { ...ranked('d', 'done', 9), title: 'Alpha four' },
        ];
        const { moves } = await mount(boards[variant], { ...WITH_POSITIONS, data, searchableFields: ['title'] });
        await search('alpha');
        expect(columnTitles()[0]).toEqual(['Alpha one', 'Alpha three']);

        await drag(handleOf('Alpha four'), [
          { x: 650, y: 120 },
          { x: 640, y: 140 },
          { x: 150, y: 200 },
        ]);

        expect(moves[0]).toMatchObject({ position: 2.5, beforeId: 'b', afterId: 'c' });
      });
    });

    test('names the neighbours of a move and reports no position without a positionField', async () => {
      const { moves, dataChanges } = await mount(boards[variant]);
      await drag(handleOf('Task D'), [
        { x: 650, y: 120 },
        { x: 640, y: 140 },
        { x: 150, y: 150 },
      ]);

      expect(moves[0]).toMatchObject({ item: { id: 'd' }, toIndex: 1, beforeId: 'a', afterId: 'b' });
      expect(moves[0]?.position).toBeUndefined();
      expect(dataChanges[0]?.find(({ id }) => id === 'd')).not.toHaveProperty('rank');
    });
  });

  return { ...harness, boards };
}
