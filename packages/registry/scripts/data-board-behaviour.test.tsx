import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import type { ComponentType } from 'react';
import type { Root } from 'react-dom/client';
import { installDom, resolveCanonicalAliases } from './dom-environment';

type Task = { id: string; status: string; title: string };
type MoveEvent = { item: Task; fromColumn: string; toColumn: string; toIndex: number };
type BoardProps = {
  columns: { id: string; label: string }[];
  data: Task[];
  columnField: keyof Task;
  title: (task: Task) => string;
  onCardMove: (event: MoveEvent) => void;
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

const VARIANTS = ['Radix', 'Base UI'] as const;
type Variant = (typeof VARIANTS)[number];

const boards = {} as Record<Variant, ComponentType<BoardProps>>;
const roots: Root[] = [];
let uninstallDom: () => Promise<void>;
let restoreGeometry: () => void;
let act: typeof import('react').act;
let createElement: typeof import('react').createElement;
let createRoot: typeof import('react-dom/client').createRoot;

type Rect = { top: number; left: number; width: number; height: number };

const COLUMN_SLOT = '[data-slot="data-board-column-body"]';
const COLUMN_WIDTH = 300;
const COLUMN_TOP = 100;
const COLUMN_HEIGHTS = [400, 1000, 400];
const CARD_HEIGHT = 80;
const CARD_STRIDE = 86;
const NO_RECT: Rect = { top: 0, left: 0, width: 0, height: 0 };

/**
 * dnd-kit measures every droppable and draggable with `getBoundingClientRect`, which a DOM without a layout
 * engine answers with zeros. The board is laid out here as a browser would: three columns side by side, the
 * second one far taller than the others, and the cards stacked in the column that holds them.
 */
function rectOf(element: Element): Rect {
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
});

const settle = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

async function mount(Board: ComponentType<BoardProps>, onCardMove: BoardProps['onCardMove']) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      createElement(Board, {
        columns: COLUMNS,
        data: TASKS,
        columnField: 'status',
        title: (task: Task) => task.title,
        onCardMove,
      }),
    );
  });
}

const handleOf = (title: string) => {
  const card = [...document.querySelectorAll(`${COLUMN_SLOT} > div`)].find((element) =>
    element.textContent?.includes(title),
  );
  return card?.querySelector('button') as HTMLButtonElement;
};

const columnTitles = () =>
  [...document.querySelectorAll(COLUMN_SLOT)].map((body) =>
    [...body.querySelectorAll(':scope > div')].map((card) => card.textContent?.trim()),
  );

function pointerEvent(type: string, target: EventTarget, x: number, y: number) {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(event, 'isPrimary', { value: true });
  target.dispatchEvent(event);
}

async function drag(handle: HTMLElement, path: { x: number; y: number }[]) {
  const [start, ...rest] = path;
  if (!start) return;
  await act(async () => {
    pointerEvent('pointerdown', handle, start.x, start.y);
  });
  for (const point of rest) {
    await act(async () => {
      pointerEvent('pointermove', document, point.x, point.y);
      await settle();
    });
  }
  const end = rest.at(-1) ?? start;
  await act(async () => {
    pointerEvent('pointerup', document, end.x, end.y);
    await settle();
  });
}

describe.each(VARIANTS)('data-board drag on %s', (variant) => {
  test('drops a card into a tall empty column', async () => {
    const moves: MoveEvent[] = [];
    await mount(boards[variant], (event) => moves.push(event));
    expect(columnTitles()).toEqual([['Task A', 'Task B', 'Task C'], [], ['Task D']]);

    await drag(handleOf('Task B'), [
      { x: 150, y: 200 },
      { x: 160, y: 215 },
      { x: 400, y: 600 },
      { x: 420, y: 900 },
    ]);

    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ item: { id: 'b' }, fromColumn: 'todo', toColumn: 'doing', toIndex: 0 });
    expect(columnTitles()).toEqual([['Task A', 'Task C'], ['Task B'], ['Task D']]);
  });
});
