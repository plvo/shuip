import type { ComponentType } from 'react';
import { createReactMount } from './react-mount';

export type BoardTask = { id: string; status: string; title: string; rank?: number; sprint?: number };

type BoardMove = {
  item: BoardTask;
  fromColumn: string;
  toColumn: string;
  toIndex: number;
  fromGroup?: string;
  toGroup?: string;
  position?: number;
  beforeId: string | null;
  afterId: string | null;
};

export type BoardProps = {
  columns: { id: string; label: string }[];
  data: BoardTask[];
  columnField: keyof BoardTask;
  title: (task: BoardTask) => string;
  onCardMove: (event: BoardMove) => void;
  onDataChange: (data: BoardTask[]) => void;
  pageSize?: number | false;
  groupBy?: { field: keyof BoardTask };
  searchableFields?: (keyof BoardTask)[];
  positionField?: keyof BoardTask;
};

export type MountOptions = Pick<BoardProps, 'pageSize' | 'groupBy' | 'searchableFields' | 'positionField'> & {
  data?: BoardTask[];
};

// The three columns the stub geometry lays out, from left to right.
const COLUMNS = [
  { id: 'todo', label: 'To do' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' },
];

export const TASKS: BoardTask[] = [
  { id: 'a', status: 'todo', title: 'Task A' },
  { id: 'b', status: 'todo', title: 'Task B' },
  { id: 'c', status: 'todo', title: 'Task C' },
  { id: 'd', status: 'done', title: 'Task D' },
];

export const INITIAL_COLUMNS = [['Task A', 'Task B', 'Task C'], [], ['Task D']];

export const CARD_HEIGHT = 80;

type Rect = { top: number; left: number; width: number; height: number };
type Point = { x: number; y: number };

const COLUMN_WIDTH = 300;
const COLUMN_TOP = 100;
const COLUMN_HEIGHTS = [400, 1000, 400];
const BAND_STRIDE = 500;
const BAND_HEIGHT = 400;
const CARD_STRIDE = 86;
const NO_RECT: Rect = { top: 0, left: 0, width: 0, height: 0 };

type BoardHarnessConfig = {
  /** Selector of the element that holds the cards of a column (or of a cell, on a grouped board). */
  columnSlot: string;
  /** Selector of the drop slot. */
  dropSlot: string;
  /** Selector of the body of a band: a row of cells stacked under the previous band. Flat boards have none. */
  bandSlot?: string;
};

/**
 * The drive of a board in a DOM without a layout engine, shared by the behaviour suites of the boards. The suite
 * installs the DOM and the canonical aliases, then calls `load` before it mounts anything.
 *
 * dnd-kit measures every droppable and draggable with `getBoundingClientRect`, which such a DOM answers with
 * zeros. `stubGeometry` lays the board out as a browser would: `COLUMNS` side by side, the second one far taller
 * than the others, and the cards stacked in the column that holds them. A grouped board stacks its bands, each
 * one a row of three cells of the same height.
 */
export function createBoardHarness({ columnSlot, dropSlot: dropSlotSelector, bandSlot }: BoardHarnessConfig) {
  const reactMount = createReactMount();
  let act: typeof import('react').act;
  let createElement: typeof import('react').createElement;

  const bandOf = (element: Element) => {
    const band = bandSlot ? element.closest(bandSlot) : null;
    return bandSlot && band ? { body: band, bodies: [...document.querySelectorAll(bandSlot)] } : null;
  };

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
    const band = bandOf(element);
    if (band && element.matches(columnSlot)) {
      return {
        left: [...band.body.querySelectorAll(columnSlot)].indexOf(element) * COLUMN_WIDTH,
        top: COLUMN_TOP + band.bodies.indexOf(band.body) * BAND_STRIDE,
        width: COLUMN_WIDTH - 20,
        height: BAND_HEIGHT,
      };
    }
    if (element.matches(columnSlot)) {
      const index = [...document.querySelectorAll(columnSlot)].indexOf(element);
      return {
        left: index * COLUMN_WIDTH,
        top: COLUMN_TOP,
        width: COLUMN_WIDTH - 20,
        height: COLUMN_HEIGHTS[index] ?? 0,
      };
    }
    const column = element.parentElement;
    if (column?.matches(columnSlot) && element.tagName === 'DIV') {
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
      return {
        top,
        left,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
      };
    };
    return () => {
      Element.prototype.getBoundingClientRect = original;
    };
  }

  /** Loads React once the DOM is installed. */
  async function load(): Promise<void> {
    ({ act, createElement } = await reactMount.load());
  }

  const { cleanup } = reactMount;

  const settle = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

  async function mount(Board: ComponentType<BoardProps>, { data, ...options }: MountOptions = {}) {
    const { errors, render } = reactMount.mount();
    const board = {
      moves: [] as BoardMove[],
      dataChanges: [] as BoardTask[][],
      errors,
      rerender: async (_data: BoardTask[]) => {},
    };
    board.rerender = (next) =>
      render(
        createElement(Board, {
          columns: COLUMNS,
          data: next,
          columnField: 'status',
          title: (task) => task.title,
          onCardMove: (event) => board.moves.push(event),
          onDataChange: (changed) => board.dataChanges.push(changed),
          ...options,
        }),
      );
    await board.rerender(data ?? TASKS);
    return board;
  }

  const handleOf = (title: string) => {
    const card = [...document.querySelectorAll(`${columnSlot} > div`)].find((element) =>
      element.textContent?.includes(title),
    );
    return card?.querySelector('button') as HTMLButtonElement;
  };

  const columnTitles = () =>
    [...document.querySelectorAll(columnSlot)].map((body) =>
      [...body.querySelectorAll(`:scope > div:not(${dropSlotSelector})`)].map((card) => card.textContent?.trim()),
    );

  const dropSlot = () => document.querySelector<HTMLElement>(dropSlotSelector);

  const slotFades = () => dropSlot()?.hasAttribute('data-entering') === true;

  const dropSlotPlace = () => {
    const slot = dropSlot();
    const column = slot?.parentElement;
    if (!slot || !column) return null;
    return {
      column: [...document.querySelectorAll(columnSlot)].indexOf(column),
      index: [...column.children].filter((child) => child.tagName === 'DIV').indexOf(slot),
    };
  };

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

  /** Runs `callback` inside React's `act`, for what the suite does to the DOM itself. */
  const inAct = (callback: () => Promise<void>) => act(callback);

  return {
    stubGeometry,
    load,
    cleanup,
    mount,
    handleOf,
    columnTitles,
    dropSlot,
    slotFades,
    dropSlotPlace,
    moveTo,
    hold,
    release,
    search,
    pressKey,
    drag,
    pickUpB,
    inAct,
  };
}
