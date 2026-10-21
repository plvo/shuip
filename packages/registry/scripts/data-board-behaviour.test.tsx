import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import type { ComponentType } from 'react';
import type { Root } from 'react-dom/client';
import { installDom, resolveCanonicalAliases } from './dom-environment';

type Task = { id: string; status: string; title: string; sprint?: number; rank?: number };
type MoveEvent = {
  item: Task;
  fromColumn: string;
  toColumn: string;
  toIndex: number;
  fromGroup?: string;
  toGroup?: string;
  position?: number;
  beforeId: string | null;
  afterId: string | null;
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
  searchableFields?: (keyof Task)[];
  positionField?: keyof Task;
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
  const overlay = [element, element.parentElement].find(
    (candidate): candidate is HTMLElement => candidate instanceof HTMLElement && candidate.style.position === 'fixed',
  );
  if (overlay) {
    const { style } = overlay;
    return {
      top: Number.parseFloat(style.top),
      left: Number.parseFloat(style.left),
      width: Number.parseFloat(style.width),
      height: Number.parseFloat(style.height),
    };
  }
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

type MountOptions = {
  pageSize?: number | false;
  data?: Task[];
  groupBy?: BoardProps['groupBy'];
  searchableFields?: BoardProps['searchableFields'];
  positionField?: BoardProps['positionField'];
};

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
          searchableFields: options.searchableFields,
          positionField: options.positionField,
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

const slotFades = () => dropSlot()?.className.includes('animate-in') === true;

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

async function search(query: string) {
  const input = document.querySelector('input') as HTMLInputElement;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, query);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  });
}

async function pressKey(code: string, target: EventTarget = document) {
  await act(async () => {
    target.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
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

    await rerender([...TASKS.slice(0, 3), { id: 'e', status: 'done', title: 'Task E' }, TASKS[3] as Task]);
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
    await act(async () => {
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

  test('reveals a card dropped past the paginated window of a band', async () => {
    const data: Task[] = [
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

  test('drops a card below the last card shown by a search right after it, before the cards it hides', async () => {
    const data: Task[] = [
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
    const ranked = (id: string, status: string, rank: number, sprint?: number): Task => ({
      id,
      status,
      title: `Task ${id.toUpperCase()}`,
      rank,
      sprint,
    });
    const RANKED: Task[] = [
      ranked('a', 'todo', 3),
      ranked('b', 'todo', 1),
      ranked('c', 'todo', 2),
      ranked('d', 'done', 5),
    ];
    const withPositions = { positionField: 'rank' } as const;
    const rankOf = (task: Task[] | undefined, id: string) => task?.find((item) => item.id === id)?.rank;

    test('renders each column by ascending position', async () => {
      await mount(boards[variant], { ...withPositions, data: RANKED });
      expect(columnTitles()).toEqual([['Task B', 'Task C', 'Task A'], [], ['Task D']]);
    });

    test('keeps the data order of cards of equal position', async () => {
      const tied = [ranked('a', 'todo', 1), ranked('b', 'todo', 0), ranked('c', 'todo', 1), ranked('d', 'todo', 0)];
      await mount(boards[variant], { ...withPositions, data: tied });
      expect(columnTitles()[0]).toEqual(['Task B', 'Task D', 'Task A', 'Task C']);
    });

    test('renders the order of the data when there is no positionField', async () => {
      await mount(boards[variant], { data: RANKED });
      expect(columnTitles()[0]).toEqual(['Task A', 'Task B', 'Task C']);
    });

    test('writes the midpoint of the neighbours into the dropped card and reports it', async () => {
      const { moves, dataChanges } = await mount(boards[variant], { ...withPositions, data: RANKED });

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
      const { moves } = await mount(boards[variant], { ...withPositions, data: RANKED });

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
      const { moves, dataChanges } = await mount(boards[variant], { ...withPositions, data: RANKED });

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
      const { moves } = await mount(boards[variant], { ...withPositions, data: RANKED });

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
      const { moves, dataChanges } = await mount(boards[variant], { ...withPositions, data: tied });

      await drag(handleOf('Task C'), [
        { x: 150, y: 290 },
        { x: 160, y: 270 },
        { x: 150, y: 200 },
      ]);

      expect(moves[0]).toMatchObject({ position: 7, beforeId: 'a', afterId: 'b' });
      expect(dataChanges[0]?.map(({ id }) => id)).toEqual(['a', 'c', 'b']);
      expect(columnTitles()[0]).toEqual(['Task A', 'Task C', 'Task B']);
    });

    test('computes the position from the neighbours in the cell of a band only', async () => {
      const data = [
        ranked('a', 'todo', 5, 1),
        ranked('b', 'todo', 6, 1),
        ranked('c', 'todo', 100, 2),
        ranked('d', 'done', 7, 2),
      ];
      const { moves } = await mount(boards[variant], { ...withPositions, data, groupBy: { field: 'sprint' } });

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

    test('lists the cards of onDataChange by position, not in the order of the data', async () => {
      const { moves, dataChanges } = await mount(boards[variant], { ...withPositions, data: RANKED });

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
      const { dataChanges } = await mount(boards[variant], { ...withPositions, data: RANKED });

      await drag(handleOf('Task C'), [
        { x: 150, y: 232 },
        { x: 160, y: 250 },
        { x: 420, y: 900 },
      ]);

      expect(dataChanges[0]?.map(({ id, rank }) => `${id}:${rank}`)).toEqual(['c:0', 'b:1', 'a:3', 'd:5']);
    });

    test('takes the neighbours and the position from a data update received mid-drag', async () => {
      const { rerender, moves, dataChanges } = await mount(boards[variant], { ...withPositions, data: RANKED });
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

    test('computes the position against the cards the pagination hides', async () => {
      const data = [ranked('a', 'todo', 1), ranked('b', 'todo', 2), ranked('c', 'todo', 3), ranked('d', 'done', 9)];
      const { moves } = await mount(boards[variant], { ...withPositions, data, pageSize: 2 });
      expect(columnTitles()[0]).toEqual(['Task A', 'Task B']);

      await drag(handleOf('Task D'), [
        { x: 650, y: 120 },
        { x: 640, y: 140 },
        { x: 150, y: 400 },
      ]);

      expect(moves[0]).toMatchObject({ item: { id: 'd', rank: 2.5 }, position: 2.5, beforeId: 'b', afterId: 'c' });
      expect(columnTitles()[0]).toEqual(['Task A', 'Task B', 'Task D', 'Task C']);
    });

    test('computes the position against the cards a search hides', async () => {
      const data: Task[] = [
        { ...ranked('a', 'todo', 1), title: 'Alpha one' },
        { ...ranked('b', 'todo', 2), title: 'Beta two' },
        { ...ranked('c', 'todo', 3), title: 'Alpha three' },
        { ...ranked('d', 'done', 9), title: 'Alpha four' },
      ];
      const { moves } = await mount(boards[variant], { ...withPositions, data, searchableFields: ['title'] });
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
