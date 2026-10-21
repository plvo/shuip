import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import type { ComponentType } from 'react';
import type { Root } from 'react-dom/client';
import { installDom, resolveCanonicalAliases } from './dom-environment';

type Task = { id: string; status: string; title: string; sprint?: number };
type MoveEvent = {
  item: Task;
  fromColumn: string;
  toColumn: string;
  toIndex: number;
  fromGroup?: string;
  toGroup?: string;
};
type BoardProps = {
  columns: { id: string; label: string }[];
  data: Task[];
  columnField: keyof Task;
  title: (task: Task) => string;
  onCardMove: (event: MoveEvent) => void;
  onDataChange: (data: Task[]) => void;
  pageSize?: number | false;
  groupBy?: { field: keyof Task };
};

const COLUMNS = [
  { id: 'todo', label: 'To do' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' },
];

const TASKS: Task[] = [
  { id: 'a', status: 'todo', title: 'Task A' },
  { id: 'b', status: 'todo', title: 'Task B' },
  { id: 'c', status: 'todo', title: 'Task C' },
  { id: 'd', status: 'done', title: 'Task D' },
];

const INITIAL_COLUMNS = [['Task A', 'Task B', 'Task C'], [], ['Task D']];

const VARIANTS = ['Radix', 'Base UI'] as const;
type Variant = (typeof VARIANTS)[number];

const boards = {} as Record<Variant, ComponentType<BoardProps>>;
const roots: Root[] = [];
const originalConsoleError = console.error;
let uninstallDom: () => Promise<void>;
let restoreGeometry: () => void;
let act: typeof import('react').act;
let createElement: typeof import('react').createElement;
let createRoot: typeof import('react-dom/client').createRoot;

type Rect = { top: number; left: number; width: number; height: number };

const COLUMN_SLOT = '[data-slot="data-board-column-body"]';
const BAND_SLOT = '[data-slot="data-board-band-body"]';
const DROP_SLOT = '[data-slot="data-board-drop-slot"]';
const COLUMN_WIDTH = 300;
const COLUMN_TOP = 100;
const COLUMN_HEIGHTS = [400, 1000, 400];
const BAND_STRIDE = 500;
const BAND_HEIGHT = 400;
const CARD_HEIGHT = 80;
const CARD_STRIDE = 86;
const NO_RECT: Rect = { top: 0, left: 0, width: 0, height: 0 };

/**
 * dnd-kit measures every droppable and draggable with `getBoundingClientRect`, which a DOM without a layout
 * engine answers with zeros. The board is laid out here as a browser would: three columns side by side, the
 * second one far taller than the others, and the cards stacked in the column that holds them. A grouped board
 * stacks its bands, each one a row of three cells of the same height.
 */
function rectOf(element: Element): Rect {
  const band = element.closest(BAND_SLOT);
  if (band && element.matches(COLUMN_SLOT)) {
    return {
      left: [...band.querySelectorAll(COLUMN_SLOT)].indexOf(element) * COLUMN_WIDTH,
      top: COLUMN_TOP + [...document.querySelectorAll(BAND_SLOT)].indexOf(band) * BAND_STRIDE,
      width: COLUMN_WIDTH - 20,
      height: BAND_HEIGHT,
    };
  }
  if (element.matches(COLUMN_SLOT)) {
    const index = [...document.querySelectorAll(COLUMN_SLOT)].indexOf(element);
    return {
      left: index * COLUMN_WIDTH,
      top: COLUMN_TOP,
      width: COLUMN_WIDTH - 20,
      height: COLUMN_HEIGHTS[index] ?? 0,
    };
  }
  const column = element.parentElement;
  if (column?.matches(COLUMN_SLOT) && element.tagName === 'DIV') {
    const body = rectOf(column);
    const position = [...column.children].filter((child) => child.tagName === 'DIV').indexOf(element);
    return {
      left: body.left + 6,
      top: body.top + 6 + position * CARD_STRIDE,
      width: body.width - 12,
      height: CARD_HEIGHT,
    };
  }
  return NO_RECT;
}

function stubGeometry(): () => void {
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function getBoundingClientRect(this: Element) {
    const { top, left, width, height } = rectOf(this);
    return { top, left, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) };
  };
  return () => {
    Element.prototype.getBoundingClientRect = original;
  };
}

// The browser and the components are loaded here, not at the top of the file, so that no other test file sees them.
beforeAll(async () => {
  uninstallDom = installDom();
  restoreGeometry = stubGeometry();
  resolveCanonicalAliases(/data-board\/component\.radix\.tsx$/);
  ({ act, createElement } = await import('react'));
  ({ createRoot } = await import('react-dom/client'));
  const radix = await import('../items/blocks/data-board/component.radix');
  const base = await import('../generated/base/items/blocks/data-board/component.base');
  boards.Radix = radix.DataBoard as unknown as ComponentType<BoardProps>;
  boards['Base UI'] = base.DataBoard as unknown as ComponentType<BoardProps>;
});

afterAll(async () => {
  restoreGeometry();
  await uninstallDom();
});

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
  console.error = originalConsoleError;
});

const settle = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

type MountedBoard = {
  moves: MoveEvent[];
  dataChanges: Task[][];
  errors: unknown[][];
  rerender: (data: Task[]) => Promise<void>;
};

type MountOptions = { pageSize?: number | false; data?: Task[]; groupBy?: BoardProps['groupBy'] };

async function mount(Board: ComponentType<BoardProps>, options: MountOptions = {}) {
  const board: MountedBoard = { moves: [], dataChanges: [], errors: [], rerender: async () => {} };
  console.error = (...args: unknown[]) => {
    board.errors.push(args);
  };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  board.rerender = (data) =>
    act(async () => {
      root.render(
        createElement(Board, {
          columns: COLUMNS,
          data,
          columnField: 'status',
          title: (task: Task) => task.title,
          onCardMove: (event) => board.moves.push(event),
          onDataChange: (next) => board.dataChanges.push(next),
          pageSize: options.pageSize,
          groupBy: options.groupBy,
        }),
      );
    });
  await board.rerender(options.data ?? TASKS);
  return board;
}

const handleOf = (title: string) => {
  const card = [...document.querySelectorAll(`${COLUMN_SLOT} > div`)].find((element) =>
    element.textContent?.includes(title),
  );
  return card?.querySelector('button') as HTMLButtonElement;
};

const columnTitles = () =>
  [...document.querySelectorAll(COLUMN_SLOT)].map((body) =>
    [...body.querySelectorAll(`:scope > div:not(${DROP_SLOT})`)].map((card) => card.textContent?.trim()),
  );

const dropSlot = () => document.querySelector<HTMLElement>(DROP_SLOT);

const dropSlotPlace = () => {
  const slot = dropSlot();
  const column = slot?.parentElement;
  if (!slot || !column) return null;
  return {
    column: [...document.querySelectorAll(COLUMN_SLOT)].indexOf(column),
    index: [...column.children].filter((child) => child.tagName === 'DIV').indexOf(slot),
  };
};

type Point = { x: number; y: number };

function pointerEvent(type: string, target: EventTarget, x: number, y: number) {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(event, 'isPrimary', { value: true });
  target.dispatchEvent(event);
}

async function moveTo({ x, y }: Point) {
  await act(async () => {
    pointerEvent('pointermove', document, x, y);
    await settle();
  });
}

async function hold(handle: HTMLElement, path: Point[]) {
  const [start, ...rest] = path;
  if (!start) return;
  await act(async () => {
    pointerEvent('pointerdown', handle, start.x, start.y);
  });
  for (const point of rest) await moveTo(point);
}

async function release({ x, y }: Point) {
  await act(async () => {
    pointerEvent('pointerup', document, x, y);
    await settle();
  });
}

async function pressEscape() {
  await act(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
    await settle();
  });
}

async function drag(handle: HTMLElement, path: Point[]) {
  await hold(handle, path);
  await release(path.at(-1) ?? { x: 0, y: 0 });
}

// A first move of a few pixels activates the drag of Task B, the second card of the first column.
const pickUpB = () =>
  hold(handleOf('Task B'), [
    { x: 150, y: 200 },
    { x: 160, y: 215 },
  ]);

describe.each(VARIANTS)('data-board drag on %s', (variant) => {
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
    const slot = dropSlot() as HTMLElement;
    expect(slot.style.height).toBe(`${CARD_HEIGHT}px`);
    expect(slot.getAttribute('aria-hidden')).toBe('true');
    expect(slot.hasAttribute('tabindex')).toBe(false);
    expect(slot.querySelector('button, a, input, [tabindex]')).toBeNull();

    await moveTo({ x: 700, y: 120 });
    expect(dropSlotPlace()).toEqual({ column: 2, index: 0 });

    await moveTo({ x: 700, y: 400 });
    expect(dropSlotPlace()).toEqual({ column: 2, index: 1 });

    await moveTo({ x: 150, y: 230 });
    expect(dropSlot()).toBeNull();
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

    await pressEscape();
    expect(dropSlot()).toBeNull();
    expect(columnTitles()).toEqual(INITIAL_COLUMNS);

    await release({ x: 700, y: 120 });
    expect(moves).toEqual([]);
    expect(dataChanges).toEqual([]);
  });

  test('reveals a card dropped past the paginated window of its column', async () => {
    const { moves } = await mount(boards[variant], { pageSize: 2 });
    expect(columnTitles()[0]).toEqual(['Task A', 'Task B']);

    await drag(handleOf('Task D'), [
      { x: 650, y: 120 },
      { x: 640, y: 140 },
      { x: 150, y: 400 },
    ]);

    expect(moves[0]).toMatchObject({ item: { id: 'd' }, toColumn: 'todo', toIndex: 3 });
    expect(columnTitles()[0]).toEqual(['Task A', 'Task B', 'Task C', 'Task D']);
  });

  test('drops a card into a cell of another band and writes the band value', async () => {
    const data: Task[] = [
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

  test.each([
    ['Escape is pressed', () => pressEscape()],
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
});
