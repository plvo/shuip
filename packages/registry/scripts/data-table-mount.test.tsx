import { afterAll, afterEach, beforeAll, describe, expect, spyOn, test } from 'bun:test';
import type { ColumnDef, Table } from '@tanstack/react-table';
import type { Root } from 'react-dom/client';
import { installDom, resolveCanonicalAliases } from './dom-environment';

type Row = { id: number; name: string };
type TableProps = Parameters<typeof import('../items/blocks/data-table/component.radix').useDataTable<Row>>[0];

const rowsOf = (count: number): Row[] => Array.from({ length: count }, (_, id) => ({ id, name: `row ${id}` }));

const COLUMNS: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Name' }];

const setActEnvironment = (enabled: boolean) => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = enabled;
};

const roots: Root[] = [];
let uninstallDom: () => Promise<void>;
let act: typeof import('react').act;
let createElement: typeof import('react').createElement;
let startTransition: typeof import('react').startTransition;
let useLayoutEffect: typeof import('react').useLayoutEffect;
let Suspense: typeof import('react').Suspense;
let StrictMode: typeof import('react').StrictMode;
let createRoot: typeof import('react-dom/client').createRoot;
let useDataTable: typeof import('../items/blocks/data-table/component.radix').useDataTable;

// The browser and the component are loaded here, not at the top of the file, so that no other test file sees them.
beforeAll(async () => {
  uninstallDom = installDom();
  resolveCanonicalAliases(/data-table\/component\.radix\.tsx$/);
  ({ act, createElement, startTransition, useLayoutEffect, Suspense, StrictMode } = await import('react'));
  ({ createRoot } = await import('react-dom/client'));
  ({ useDataTable } = await import('../items/blocks/data-table/component.radix'));
});

afterAll(async () => {
  await uninstallDom();
});

afterEach(async () => {
  setActEnvironment(true);
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
});

const newRoot = () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  return root;
};

/** Holds the thread long enough for React to give it back to the browser before it renders the next component. */
const holdThread = (milliseconds: number) => {
  const until = performance.now() + milliseconds;
  while (performance.now() < until) {}
};

describe('useDataTable while its table is first rendered', () => {
  // React renders a transition in slices and runs the microtasks between them, so one component of a table can render
  // before the microtasks that follow another have run. That is how a hydrating page renders its tables.
  test('logs no error before the component has mounted, however React slices the render', async () => {
    setActEnvironment(false);
    const errors = spyOn(console, 'error').mockImplementation(() => {});
    let mounted: () => void = () => {};
    const hasMounted = new Promise<void>((resolve) => {
      mounted = resolve;
    });

    function ReadsTheRows({ table, read }: { table: Table<Row>; read: 'filtered' | 'sorted' }) {
      if (read === 'filtered') table.getPreFilteredRowModel();
      else table.getSortedRowModel();
      return null;
    }
    function SlowSibling() {
      holdThread(20);
      return null;
    }
    function CommitSignal() {
      useLayoutEffect(() => mounted(), []);
      return null;
    }
    function Page() {
      const { table } = useDataTable({ data: rowsOf(25), columns: COLUMNS });
      return createElement(
        Suspense,
        { fallback: null },
        createElement(ReadsTheRows, { table, read: 'filtered' }),
        createElement(SlowSibling),
        createElement(ReadsTheRows, { table, read: 'sorted' }),
        createElement(SlowSibling),
        createElement(CommitSignal),
      );
    }

    startTransition(() => newRoot().render(createElement(Page)));
    await hasMounted;

    const logged = errors.mock.calls.map(([message]) => String(message));
    errors.mockRestore();
    expect(logged).toEqual([]);
  });
});

/** A table in a page that renders again with the props it is given next. */
const mountTable = async (initial: TableProps, options: { strict?: boolean } = {}) => {
  let props = initial;
  let table = undefined as unknown as Table<Row>;
  const committedPages: number[] = [];
  let committed: () => void = () => {};

  function Page() {
    table = useDataTable(props).table;
    table.getRowModel();
    useLayoutEffect(() => {
      committedPages.push(table.getState().pagination.pageIndex);
      committed();
    });
    return null;
  }
  const page = options.strict ? createElement(StrictMode, null, createElement(Page)) : createElement(Page);
  const root = newRoot();
  await act(async () => root.render(page));

  return {
    table: () => table,
    committedPages,
    renderWith: async (next: TableProps) => {
      props = next;
      await act(async () => root.render(createElement(Page)));
    },
    renderWithoutAct: (next: TableProps) => {
      props = next;
      return new Promise<void>((resolve) => {
        committed = resolve;
        root.render(createElement(Page));
      });
    },
  };
};

const pageOf = (table: Table<Row>) => table.getState().pagination.pageIndex;

describe('useDataTable after it has mounted', () => {
  const data = rowsOf(25);

  test('goes back to the first page when the filter changes', async () => {
    const { table } = await mountTable({ data, columns: COLUMNS });
    await act(async () => table().setPageIndex(2));

    await act(async () => table().setGlobalFilter('row 1'));

    expect(pageOf(table())).toBe(0);
  });

  test('goes back to the first page when a column filter changes', async () => {
    const { table } = await mountTable({ data, columns: COLUMNS });
    await act(async () => table().setPageIndex(1));

    await act(async () => table().setColumnFilters([{ id: 'name', value: 'row 2' }]));

    expect(pageOf(table())).toBe(0);
  });

  test('goes back to the first page when the sorting changes', async () => {
    const { table } = await mountTable({ data, columns: COLUMNS });
    await act(async () => table().setPageIndex(2));

    await act(async () => table().setSorting([{ id: 'name', desc: true }]));

    expect(pageOf(table())).toBe(0);
  });

  test('goes back to the first page when the same table is given other data', async () => {
    const { table, renderWith } = await mountTable({ data, columns: COLUMNS });
    await act(async () => table().setPageIndex(2));

    await renderWith({ data: rowsOf(30), columns: COLUMNS });

    expect(pageOf(table())).toBe(0);
  });

  test('stays on its page when it renders again with the data it had', async () => {
    const { table, renderWith } = await mountTable({ data, columns: COLUMNS });
    await act(async () => table().setPageIndex(2));

    await renderWith({ data, columns: COLUMNS });

    expect(pageOf(table())).toBe(2);
  });

  test('keeps the page it was given to start on, strict mode included', async () => {
    const initialState = { pagination: { pageIndex: 2, pageSize: 10 } };

    const { table } = await mountTable({ data, columns: COLUMNS, initialState }, { strict: true });

    expect(pageOf(table())).toBe(2);
  });

  // The page a reader sees must never be one the rows no longer reach, so the reset is made before the browser paints.
  test('is back on the first page in the same commit that shows the new rows, not a frame later', async () => {
    const { table, committedPages, renderWithoutAct } = await mountTable({ data, columns: COLUMNS });
    await act(async () => table().setPageIndex(2));
    setActEnvironment(false);
    committedPages.length = 0;

    await renderWithoutAct({ data: rowsOf(30), columns: COLUMNS });

    expect(committedPages.at(-1)).toBe(0);
  });
});

describe('useDataTable when the page of a server holds the rows', () => {
  const manualProps = { data: rowsOf(10), columns: COLUMNS, pageCount: 3 };

  test('stays on its page when it is given the rows of that page', async () => {
    const { table, renderWith } = await mountTable(manualProps);
    await act(async () => table().setPageIndex(2));

    await renderWith({ ...manualProps, data: rowsOf(10).map((row) => ({ ...row, id: row.id + 20 })) });

    expect(pageOf(table())).toBe(2);
  });

  test('stays on its page when the filter changes, which is for the server to answer', async () => {
    const { table } = await mountTable(manualProps);
    await act(async () => table().setPageIndex(2));

    await act(async () => table().setGlobalFilter('row 1'));

    expect(pageOf(table())).toBe(2);
  });
});

describe('useDataTable when its caller holds the sorting and the filters', () => {
  const held = { sorting: [], columnFilters: [], globalFilter: '' };
  const ignore = () => {};
  const controlled = (state: Partial<typeof held>): TableProps => ({
    data: rowsOf(25),
    columns: COLUMNS,
    state: { ...held, ...state },
    onSortingChange: ignore,
    onColumnFiltersChange: ignore,
    onGlobalFilterChange: ignore,
  });
  const data = rowsOf(25);
  const changes: [string, Partial<typeof held>][] = [
    ['sorting', { sorting: [{ id: 'name', desc: true }] as never }],
    ['column filters', { columnFilters: [{ id: 'name', value: 'row 2' }] as never }],
    ['global filter', { globalFilter: 'row 1' }],
  ];

  test.each(changes)('goes back to the first page when it holds other %s', async (_name, change) => {
    const initial = controlled({});
    const { table, renderWith } = await mountTable({ ...initial, data });
    await act(async () => table().setPageIndex(2));

    await renderWith({ ...controlled(change), data });

    expect(pageOf(table())).toBe(0);
  });

  test('stays on its page when it holds the same state', async () => {
    const { table, renderWith } = await mountTable({ ...controlled({}), data });
    await act(async () => table().setPageIndex(2));

    await renderWith({ ...controlled({}), data });

    expect(pageOf(table())).toBe(2);
  });
});
