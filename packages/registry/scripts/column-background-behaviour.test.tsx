import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import type { ComponentType } from 'react';
import { type BoardProps, createBoardHarness, type MountOptions } from './board-behaviour-harness';
import { settle } from './dnd-pointer';
import { installDom, resolveCanonicalAliases, supportColorMix } from './dom-environment';
import { VARIANTS, type Variant } from './react-mount';

type Mode = 'none' | 'muted' | 'column';

type BoardDescriptor = {
  name: string;
  columnBody: string;
  dropSlot: string;
  bandSlot?: string;
  storageKey: (persistKey: string) => string;
  stored: (background: unknown) => string;
  /** A stored view in which the user never picked a background. */
  storedWithoutBackground: string;
  columns: NonNullable<BoardProps['columns']>;
  /** The tint a column body of the mounted board rests on: what the user sees, read from the tint itself. */
  tint: (body: Element) => Mode;
  /** Everything a column body shows for its background and its drop highlight. */
  paint: (body: Element) => string;
  /** What `paint` holds of a column body in `column` mode, at rest and over a drop target. */
  columnTint: { resting: string; dropTarget: string };
  load: () => Promise<Record<Variant, unknown>>;
};

const hasClass = (element: Element | null | undefined, prefix: string) =>
  [...(element?.classList ?? [])].some((name) => name === prefix || name.startsWith(`${prefix}/`));

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'To do', color: 'var(--color-blue-500)' },
  { id: 'doing', label: 'Doing', color: 'var(--color-amber-500)' },
  { id: 'done', label: 'Done', color: 'var(--color-green-500)' },
];

const DATA_BOARD_COLUMNS = [
  { id: 'todo', label: 'To do', accentClassName: 'text-violet-500' },
  { id: 'doing', label: 'Doing', accentClassName: 'text-amber-500' },
  { id: 'done', label: 'Done', accentClassName: 'text-emerald-500' },
];

/**
 * Replaces `window.localStorage` for the duration of `run`. The DOM binds the methods of a storage on first use, so
 * patching them in place does not reach a component that reads `window.localStorage`.
 */
async function withStorage(overrides: Partial<Pick<Storage, 'getItem' | 'setItem'>>, run: () => Promise<void>) {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
  const real = window.localStorage;
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => real.getItem(key),
      setItem: (key: string, value: string) => real.setItem(key, value),
      ...overrides,
    },
  });
  try {
    await run();
  } finally {
    if (original) Object.defineProperty(window, 'localStorage', original);
  }
}

/** A mouse press on `element`, with every event a browser sends for it. */
function press(inAct: (callback: () => Promise<void>) => Promise<void>, element: Element | null | undefined) {
  return inAct(async () => {
    if (!element) return;
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      const init = { bubbles: true, cancelable: true, button: 0 };
      element.dispatchEvent(type.startsWith('pointer') ? new PointerEvent(type, init) : new MouseEvent(type, init));
    }
    await settle();
  });
}

const tintLayerOf = (body: Element) => body.parentElement?.querySelector(':scope > [aria-hidden="true"]') ?? null;

const BOARDS: BoardDescriptor[] = [
  {
    name: 'kanban',
    columnBody: '[data-slot="kanban-column-body"]',
    dropSlot: '[data-slot="kanban-drop-slot"]',
    storageKey: (persistKey) => `shuip-kanban:${persistKey}`,
    stored: (background) => JSON.stringify({ background }),
    storedWithoutBackground: '{}',
    columns: KANBAN_COLUMNS,
    tint: (body) => {
      if ((body as HTMLElement).style.backgroundColor.startsWith('color-mix(')) return 'column';
      return hasClass(body, 'bg-muted') ? 'muted' : 'none';
    },
    paint: (body) => `${body.className}|${body.getAttribute('style')}`,
    columnTint: { resting: ' 10%,', dropTarget: ' 20%,' },
    load: async () => ({
      Radix: (await import('../items/blocks/kanban/component.radix')).Kanban,
      'Base UI': (await import('../generated/base/items/blocks/kanban/component.base')).Kanban,
    }),
  },
  {
    name: 'data-board',
    columnBody: '[data-slot="data-board-column-body"]',
    dropSlot: '[data-slot="data-board-drop-slot"]',
    bandSlot: '[data-slot="data-board-band-body"]',
    storageKey: (persistKey) => `shuip-data-board:${persistKey}`,
    stored: (background) => JSON.stringify({ hidden: [], pageSize: 20, collapsed: {}, background }),
    storedWithoutBackground: JSON.stringify({ hidden: [], pageSize: 20, collapsed: {} }),
    columns: DATA_BOARD_COLUMNS,
    tint: (body) => {
      if (hasClass(tintLayerOf(body), 'bg-current')) return 'column';
      return hasClass(body, 'bg-muted') ? 'muted' : 'none';
    },
    paint: (body) => `${body.className}|${tintLayerOf(body)?.className}`,
    columnTint: { resting: 'bg-current/10', dropTarget: 'bg-current/20' },
    load: async () => ({
      Radix: (await import('../items/blocks/data-board/component.radix')).DataBoard,
      'Base UI': (await import('../generated/base/items/blocks/data-board/component.base')).DataBoard,
    }),
  },
];

const harnesses = new Map(
  BOARDS.map((board) => [
    board.name,
    createBoardHarness({ columnSlot: board.columnBody, dropSlot: board.dropSlot, bandSlot: board.bandSlot }),
  ]),
);
const loaded = new Map<string, Record<Variant, ComponentType<BoardProps>>>();

/** Picks up Task B and holds it over the second column, runs `inspect`, then drops the card. */
async function whileHoveringDoing<Result>(
  harness: ReturnType<typeof createBoardHarness>,
  inspect: () => Result,
): Promise<Result> {
  const over = { x: 400, y: 600 };
  await harness.hold(harness.handleOf('Task B'), [{ x: 150, y: 200 }, { x: 160, y: 215 }, over]);
  try {
    return inspect();
  } finally {
    await harness.release(over);
  }
}
let uninstallDom: () => Promise<void>;
let createElement: typeof import('react').createElement;

beforeAll(async () => {
  uninstallDom = installDom();
  supportColorMix();
  resolveCanonicalAliases(/(kanban|data-board)\/component\.radix\.tsx$/);
  createElement = (await import('react')).createElement;
  const { TooltipProvider } = await import('../../ui/src/components/ui/tooltip');
  for (const board of BOARDS) {
    await harnesses.get(board.name)?.load();
    const variants = (await board.load()) as Record<Variant, ComponentType<BoardProps>>;
    const withTooltips = (Component: ComponentType<BoardProps>) =>
      function BoardWithTooltips(props: BoardProps) {
        return createElement(TooltipProvider, null, createElement(Component, props));
      };
    loaded.set(board.name, { Radix: withTooltips(variants.Radix), 'Base UI': withTooltips(variants['Base UI']) });
  }
});

afterAll(async () => {
  await uninstallDom();
});

afterEach(() => {
  window.localStorage.clear();
});

describe.each(BOARDS)('$name column background', (board) => {
  const harness = harnesses.get(board.name) as NonNullable<ReturnType<typeof harnesses.get>>;
  let restoreGeometry: () => void;

  beforeEach(() => {
    restoreGeometry = harness.stubGeometry();
  });

  afterEach(async () => {
    await harness.cleanup();
    restoreGeometry();
  });

  describe.each(VARIANTS)('on %s', (variant) => {
    const Board = () => loaded.get(board.name)?.[variant] as ComponentType<BoardProps>;
    const show = (options: MountOptions = {}) => harness.mount(Board(), { columns: board.columns, ...options });
    const reload = async (options: MountOptions = {}) => {
      await harness.cleanup();
      return show(options);
    };

    const bodies = () => [...document.querySelectorAll(board.columnBody)];
    const tints = () => bodies().map(board.tint);
    const picker = (name: string) => document.querySelector<HTMLElement>(`[role="combobox"][aria-label="${name}"]`);
    const seed = (persistKey: string, background: unknown) =>
      window.localStorage.setItem(board.storageKey(persistKey), board.stored(background));
    const storedView = (persistKey: string) => {
      const raw = window.localStorage.getItem(board.storageKey(persistKey));
      return raw === null ? null : JSON.parse(raw);
    };

    const click = (element: Element | undefined) => press(harness.inAct, element);
    const choose = async (name: string, option: string) => {
      await click(picker(name) ?? undefined);
      await click([...document.querySelectorAll('[role="option"]')].find((item) => item.textContent === option));
    };

    test('shows no picker and no background unless asked', async () => {
      await show();
      expect(picker('Column background')).toBeNull();
      expect(tints()).toEqual(['none', 'none', 'none']);
    });

    test.each(['muted', 'column'] as const)('puts the %s default background on every column body', async (mode) => {
      await show({ defaultColumnBackground: mode });
      expect(tints()).toEqual([mode, mode, mode]);
    });

    test('lets a column without a color wear muted in column mode', async () => {
      const columns = board.columns.map((column) => (column.id === 'doing' ? { id: 'doing', label: 'Doing' } : column));
      await show({ columns, defaultColumnBackground: 'column' });
      expect(tints()).toEqual(['column', 'muted', 'column']);
    });

    test('shows the picker on the current background', async () => {
      await show({ backgroundPicker: true, defaultColumnBackground: 'muted' });
      expect(picker('Column background')?.textContent).toContain('Muted');
    });

    test('names the picker and its current option from the labels', async () => {
      await show({
        backgroundPicker: true,
        defaultColumnBackground: 'column',
        labels: { backgroundLabel: 'Fond des colonnes', backgroundColumn: 'Couleur de la colonne' },
      });
      expect(picker('Column background')).toBeNull();
      expect(picker('Fond des colonnes')?.textContent).toContain('Couleur de la colonne');
    });

    test('lists the options under the labels it was given', async () => {
      await show({
        backgroundPicker: true,
        labels: { backgroundNone: 'Aucun', backgroundMuted: 'Discret', backgroundColumn: 'Couleur' },
      });
      await click(picker('Column background') ?? undefined);
      expect([...document.querySelectorAll('[role="option"]')].map((item) => item.textContent)).toEqual([
        'Aucun',
        'Discret',
        'Couleur',
      ]);
    });

    test('restores the stored background after mount', async () => {
      seed('board', 'column');
      await show({ backgroundPicker: true, persistKey: 'board' });
      expect(tints()).toEqual(['column', 'column', 'column']);
      expect(picker('Column background')?.textContent).toContain('Column color');
    });

    test('hydrates the server markup without a mismatch, then restores the stored background', async () => {
      const element = createElement(Board(), {
        columns: board.columns,
        data: [{ id: 'a', status: 'todo', title: 'Task A' }],
        columnField: 'status',
        title: (task) => task.title,
        backgroundPicker: true,
        persistKey: 'board',
      } satisfies Partial<BoardProps> as BoardProps);
      const container = document.createElement('div');
      document.body.append(container);
      const serverMarkup = (await import('react-dom/server')).renderToString(element);
      container.replaceChildren(...new DOMParser().parseFromString(serverMarkup, 'text/html').body.childNodes);
      seed('board', 'column');
      const logged: unknown[][] = [];
      const original = console.error;
      console.error = (...args: unknown[]) => {
        logged.push(args);
      };
      const { act } = await import('react');
      const root = (await import('react-dom/client')).hydrateRoot(container, element);
      await act(async () => {});
      console.error = original;
      expect(logged).toEqual([]);
      expect(picker('Column background')?.textContent).toContain('Column color');
      await act(async () => root.unmount());
    });

    test('ignores the stored background without a persist key', async () => {
      seed('board', 'column');
      await show({ backgroundPicker: true });
      expect(tints()).toEqual(['none', 'none', 'none']);
    });

    const expectMutedDefault = async () => {
      const { errors } = await show({ backgroundPicker: true, persistKey: 'board', defaultColumnBackground: 'muted' });
      expect(picker('Column background')?.textContent).toContain('Muted');
      expect(tints()).toEqual(['muted', 'muted', 'muted']);
      expect(errors).toEqual([]);
    };

    test('falls back to the default background for an unknown stored mode', async () => {
      seed('board', 'rainbow');
      await expectMutedDefault();
    });

    test('falls back to the default background for malformed storage', async () => {
      window.localStorage.setItem(board.storageKey('board'), '{not json');
      await expectMutedDefault();
    });

    test('keeps the default background when the storage cannot be read', async () => {
      seed('board', 'column');
      const reads: string[] = [];
      await withStorage(
        {
          getItem: (key) => {
            reads.push(key);
            throw new Error('blocked');
          },
        },
        expectMutedDefault,
      );
      expect(reads).toContain(board.storageKey('board'));
    });

    test('follows the default background while the stored view holds no choice', async () => {
      window.localStorage.setItem(board.storageKey('board'), board.storedWithoutBackground);
      await show({ persistKey: 'board', defaultColumnBackground: 'muted' });
      expect(tints()).toEqual(['muted', 'muted', 'muted']);
    });

    describe('the picker', () => {
      test('switches the tint of every column body at once', async () => {
        await show({ backgroundPicker: true });
        await choose('Column background', 'Muted');
        expect(tints()).toEqual(['muted', 'muted', 'muted']);
        await choose('Column background', 'Column color');
        expect(tints()).toEqual(['column', 'column', 'column']);
        await choose('Column background', 'No background');
        expect(tints()).toEqual(['none', 'none', 'none']);
        expect(picker('Column background')?.textContent).toContain('No background');
      });

      test('writes the choice into storage and restores it after a reload', async () => {
        await show({ backgroundPicker: true, persistKey: 'board' });
        expect(storedView('board')).toBeNull();
        await choose('Column background', 'Column color');
        expect(storedView('board')).toMatchObject({ background: 'column' });

        await reload({ backgroundPicker: true, persistKey: 'board' });
        expect(tints()).toEqual(['column', 'column', 'column']);
      });

      test('writes nothing without a persist key', async () => {
        await show({ backgroundPicker: true });
        await choose('Column background', 'Muted');
        expect(window.localStorage.length).toBe(0);
      });

      test('keeps the choice for the session when the storage cannot be written', async () => {
        const writes: string[] = [];
        await withStorage(
          {
            setItem: (key) => {
              writes.push(key);
              throw new Error('quota');
            },
          },
          async () => {
            const { errors } = await show({ backgroundPicker: true, persistKey: 'board' });
            await choose('Column background', 'Muted');
            expect(tints()).toEqual(['muted', 'muted', 'muted']);
            await choose('Column background', 'Column color');
            expect(tints()).toEqual(['column', 'column', 'column']);
            expect(errors).toEqual([]);
          },
        );
        expect(writes).toEqual([board.storageKey('board'), board.storageKey('board')]);
        expect(storedView('board')).toBeNull();
      });
    });

    describe('over a drop target', () => {
      test.each([
        'none',
        'muted',
        'column',
      ] as const)('highlights the hovered column and no other one in %s mode', async (mode) => {
        await show({ defaultColumnBackground: mode });
        const resting = bodies().map(board.paint);

        const dragging = await whileHoveringDoing(harness, () => bodies().map(board.paint));

        expect(dragging[1]).not.toBe(resting[1]);
        expect(dragging[2]).toBe(resting[2]);
        if (mode === 'column') {
          expect(resting[1]).toContain(board.columnTint.resting);
          expect(dragging[1]).toContain(board.columnTint.dropTarget);
        }
      });
    });
  });
});

describe.each(VARIANTS)('data-board column background on %s', (variant) => {
  const board = BOARDS[1] as BoardDescriptor;
  const harness = harnesses.get(board.name) as NonNullable<ReturnType<typeof harnesses.get>>;
  let restoreGeometry: () => void;

  beforeEach(() => {
    restoreGeometry = harness.stubGeometry();
  });

  afterEach(async () => {
    await harness.cleanup();
    restoreGeometry();
  });

  const Board = () => loaded.get(board.name)?.[variant] as ComponentType<BoardProps>;
  const show = (options: MountOptions = {}) => harness.mount(Board(), { columns: board.columns, ...options });
  const reload = async (options: MountOptions = {}) => {
    await harness.cleanup();
    return show(options);
  };
  const bodies = () => [...document.querySelectorAll(board.columnBody)];
  const tints = () => bodies().map(board.tint);
  const picker = (name: string) => document.querySelector<HTMLElement>(`[role="combobox"][aria-label="${name}"]`);
  const storedView = (persistKey: string) =>
    JSON.parse(window.localStorage.getItem(board.storageKey(persistKey)) ?? 'null');
  const click = (element: Element | null | undefined) => press(harness.inAct, element);
  const choose = async (name: string, option: string) => {
    await click(picker(name));
    await click([...document.querySelectorAll('[role="option"]')].find((item) => item.textContent === option));
  };
  const hideColumn = (label: string) => click(document.querySelector(`button[aria-label="Hide ${label}"]`));

  test('adds the choice to the stored view without clobbering what it holds', async () => {
    window.localStorage.setItem(
      board.storageKey('board'),
      JSON.stringify({ hidden: ['done'], pageSize: 10, collapsed: { '1': true } }),
    );
    await show({ backgroundPicker: true, persistKey: 'board' });
    await choose('Column background', 'Muted');
    expect(storedView('board')).toEqual({
      hidden: ['done'],
      pageSize: 10,
      collapsed: { '1': true },
      background: 'muted',
    });
  });

  test('keeps the picked background in the stored view when another part of the view changes', async () => {
    await show({ backgroundPicker: true, persistKey: 'board' });
    await choose('Column background', 'Column color');
    await hideColumn('Doing');
    expect(storedView('board')).toMatchObject({ hidden: ['doing'], background: 'column' });
  });

  test.each([
    'with',
    'without',
  ] as const)('writes no background for a view the picker never touched, %s a picker', async (picker) => {
    const backgroundPicker = picker === 'with';
    await show({ backgroundPicker, persistKey: 'board', defaultColumnBackground: 'none' });
    await hideColumn('Doing');
    expect(storedView('board')).toMatchObject({ hidden: ['doing'] });
    expect(storedView('board')).not.toHaveProperty('background');

    await reload({ backgroundPicker, persistKey: 'board', defaultColumnBackground: 'muted' });
    expect(tints()).toEqual(['muted', 'muted']);
  });

  test('writes no background when the page size changes without the picker', async () => {
    await show({ persistKey: 'board', pageSize: 20 });
    await choose('Cards per column', '10 per column');
    expect(storedView('board')).toMatchObject({ pageSize: 10 });
    expect(storedView('board')).not.toHaveProperty('background');
  });

  describe('in column mode', () => {
    const accents = DATA_BOARD_COLUMNS.map((column) => column.accentClassName);
    const anyAccent = accents.map((accent) => `.${accent}`).join(', ');
    const cards = () => [...document.querySelectorAll(`${board.columnBody} *`)];

    const expectAccentOnlyOnTheTintLayers = () => {
      bodies().forEach((body, index) => {
        const layer = tintLayerOf(body);
        expect(layer?.getAttribute('aria-hidden')).toBe('true');
        expect(layer?.classList.contains(accents[index] as string)).toBe(true);
        expect(layer?.textContent).toBe('');
        expect(body.matches(anyAccent)).toBe(false);
        expect(body.parentElement?.matches(anyAccent)).toBe(false);
      });
      expect(cards().length).toBeGreaterThan(0);
      for (const element of cards()) expect(element.closest(anyAccent)).toBeNull();
    };

    test('keeps the accent on the layers behind the cards, never on a frame or a body', async () => {
      await show({ defaultColumnBackground: 'column' });
      expectAccentOnlyOnTheTintLayers();
    });

    test('keeps the accent on the layers while a card is dragged over a column', async () => {
      await show({ defaultColumnBackground: 'column' });
      await whileHoveringDoing(harness, expectAccentOnlyOnTheTintLayers);
    });
  });
});
