import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import type { ComponentType } from 'react';
import { installDom, resolveCanonicalAliases } from './dom-environment';
import { createReactMount, VARIANTS, type Variant } from './react-mount';

type Task = { id: string; status: string; title: string };

type BoardProps = {
  columns: { id: string; label: string; color?: string; accentClassName?: string }[];
  data: Task[];
  columnField: keyof Task;
  title: (task: Task) => string;
  defaultColumnBackground?: 'none' | 'muted' | 'column';
  backgroundPicker?: boolean;
  persistKey?: string;
  labels?: Record<string, string>;
};

type BoardDescriptor = {
  name: string;
  columnBody: string;
  storageKey: (persistKey: string) => string;
  stored: (background: unknown) => string;
  columns: BoardProps['columns'];
  /** Whether a column body of the mounted board wears a background. */
  wearsBackground: (body: Element) => boolean;
  load: () => Promise<Record<Variant, unknown>>;
};

const TASKS: Task[] = [
  { id: 'a', status: 'todo', title: 'Task A' },
  { id: 'b', status: 'done', title: 'Task B' },
];

const BOARDS: BoardDescriptor[] = [
  {
    name: 'kanban',
    columnBody: '[data-slot="kanban-column-body"]',
    storageKey: (persistKey) => `shuip-kanban:${persistKey}`,
    stored: (background) => JSON.stringify({ background }),
    columns: [
      { id: 'todo', label: 'To do', color: 'var(--color-blue-500)' },
      { id: 'done', label: 'Done', color: 'var(--color-green-500)' },
    ],
    // The DOM drops a `color-mix()` value, so the tint itself cannot be read: a body that wears a background is the
    // one that stretches down its column.
    wearsBackground: (body) => body.classList.contains('flex-1'),
    load: async () => ({
      Radix: (await import('../items/blocks/kanban/component.radix')).Kanban,
      'Base UI': (await import('../generated/base/items/blocks/kanban/component.base')).Kanban,
    }),
  },
  {
    name: 'data-board',
    columnBody: '[data-slot="data-board-column-body"]',
    storageKey: (persistKey) => `shuip-data-board:${persistKey}`,
    stored: (background) => JSON.stringify({ hidden: [], pageSize: 20, collapsed: {}, background }),
    columns: [
      { id: 'todo', label: 'To do', accentClassName: 'text-violet-500' },
      { id: 'done', label: 'Done', accentClassName: 'text-amber-500' },
    ],
    wearsBackground: (body) =>
      body.classList.contains('bg-muted/50') ||
      body.parentElement?.querySelector(':scope > [aria-hidden="true"]') != null,
    load: async () => ({
      Radix: (await import('../items/blocks/data-board/component.radix')).DataBoard,
      'Base UI': (await import('../generated/base/items/blocks/data-board/component.base')).DataBoard,
    }),
  },
];

const reactMount = createReactMount();
let uninstallDom: () => Promise<void>;
let createElement: typeof import('react').createElement;
const loaded = new Map<string, Record<Variant, ComponentType<BoardProps>>>();

beforeAll(async () => {
  uninstallDom = installDom();
  resolveCanonicalAliases(/(kanban|data-board)\/component\.radix\.tsx$/);
  ({ createElement } = await reactMount.load());
  for (const board of BOARDS)
    loaded.set(board.name, (await board.load()) as Record<Variant, ComponentType<BoardProps>>);
});

afterAll(async () => {
  await uninstallDom();
});

afterEach(async () => {
  window.localStorage.clear();
  await reactMount.cleanup();
});

describe.each(BOARDS)('$name column background', (board) => {
  describe.each(VARIANTS)('on %s', (variant) => {
    const boardWith = (props: Partial<BoardProps>) =>
      createElement(loaded.get(board.name)?.[variant] as ComponentType<BoardProps>, {
        columns: board.columns,
        data: TASKS,
        columnField: 'status',
        title: (task: Task) => task.title,
        ...props,
      });

    const show = async (props: Partial<BoardProps> = {}) => {
      const { errors, render } = reactMount.mount();
      await render(boardWith(props));
      return { errors };
    };

    const bodies = () => [...document.querySelectorAll(board.columnBody)];
    const picker = (name: string) => document.querySelector(`[role="combobox"][aria-label="${name}"]`);
    const seed = (persistKey: string, background: unknown) =>
      window.localStorage.setItem(board.storageKey(persistKey), board.stored(background));

    test('shows no picker and no background unless asked', async () => {
      await show();
      expect(picker('Column background')).toBeNull();
      expect(bodies()).toHaveLength(2);
      expect(bodies().some(board.wearsBackground)).toBe(false);
    });

    test.each(['muted', 'column'] as const)('puts the %s default background on every column body', async (mode) => {
      await show({ defaultColumnBackground: mode });
      expect(bodies().every(board.wearsBackground)).toBe(true);
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

    test('restores the stored background after mount', async () => {
      seed('board', 'column');
      await show({ backgroundPicker: true, persistKey: 'board' });
      expect(bodies().every(board.wearsBackground)).toBe(true);
      expect(picker('Column background')?.textContent).toContain('Column color');
    });

    test('hydrates the server markup without a mismatch, then restores the stored background', async () => {
      const element = boardWith({ backgroundPicker: true, persistKey: 'board' });
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
      expect(bodies().some(board.wearsBackground)).toBe(false);
    });

    test('falls back to the default background for an unknown stored mode', async () => {
      seed('board', 'rainbow');
      const { errors } = await show({ backgroundPicker: true, persistKey: 'board', defaultColumnBackground: 'muted' });
      expect(picker('Column background')?.textContent).toContain('Muted');
      expect(errors).toEqual([]);
    });

    test('falls back to the default background for malformed storage', async () => {
      window.localStorage.setItem(board.storageKey('board'), '{not json');
      const { errors } = await show({ backgroundPicker: true, persistKey: 'board', defaultColumnBackground: 'muted' });
      expect(picker('Column background')?.textContent).toContain('Muted');
      expect(errors).toEqual([]);
    });

    test('keeps the default background when the storage cannot be read', async () => {
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = () => {
        throw new Error('blocked');
      };
      try {
        const { errors } = await show({
          backgroundPicker: true,
          persistKey: 'board',
          defaultColumnBackground: 'muted',
        });
        expect(picker('Column background')?.textContent).toContain('Muted');
        expect(errors).toEqual([]);
      } finally {
        Storage.prototype.getItem = original;
      }
    });
  });
});
