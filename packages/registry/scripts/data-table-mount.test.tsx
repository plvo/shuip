import { afterAll, afterEach, beforeAll, describe, expect, spyOn, test } from 'bun:test';
import type { ColumnDef, Table } from '@tanstack/react-table';
import type { Root } from 'react-dom/client';
import { installDom, resolveCanonicalAliases } from './dom-environment';

type Row = { id: number; name: string };

const rowsOf = (count: number): Row[] => Array.from({ length: count }, (_, id) => ({ id, name: `row ${id}` }));

const COLUMNS: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Name' }];

const roots: Root[] = [];
let uninstallDom: () => Promise<void>;
let act: typeof import('react').act;
let createElement: typeof import('react').createElement;
let startTransition: typeof import('react').startTransition;
let Suspense: typeof import('react').Suspense;
let createRoot: typeof import('react-dom/client').createRoot;
let useDataTable: typeof import('../items/blocks/data-table/component.radix').useDataTable;

// The browser and the component are loaded here, not at the top of the file, so that no other test file sees them.
beforeAll(async () => {
  uninstallDom = installDom();
  resolveCanonicalAliases(/data-table\/component\.radix\.tsx$/);
  ({ act, createElement, startTransition, Suspense } = await import('react'));
  ({ createRoot } = await import('react-dom/client'));
  ({ useDataTable } = await import('../items/blocks/data-table/component.radix'));
});

afterAll(async () => {
  await uninstallDom();
});

afterEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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
  test('updates no state before the component has mounted, however React slices the render', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
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
    function MountedSignal() {
      mounted();
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
        createElement(MountedSignal),
      );
    }

    startTransition(() => newRoot().render(createElement(Page)));
    await hasMounted;
    await new Promise((resolve) => setTimeout(resolve, 20));

    const notMounted = errors.mock.calls.filter(([message]) => String(message).includes("hasn't mounted yet"));
    errors.mockRestore();
    expect(notMounted).toEqual([]);
  });
});

describe('useDataTable after it has mounted', () => {
  let table: Table<Row>;

  const render = async (data: Row[]) => {
    function Page() {
      table = useDataTable({ data, columns: COLUMNS }).table;
      table.getRowModel();
      return null;
    }
    const root = newRoot();
    await act(async () => root.render(createElement(Page)));
    return { root, Page };
  };

  test('shows the first page of a table it has not been told otherwise', async () => {
    await render(rowsOf(25));

    expect(table.getState().pagination).toEqual({ pageIndex: 0, pageSize: 10 });
  });

  test('goes back to the first page when the filter changes', async () => {
    await render(rowsOf(25));
    await act(async () => table.setPageIndex(2));
    expect(table.getState().pagination.pageIndex).toBe(2);

    await act(async () => table.setGlobalFilter('row 1'));

    expect(table.getState().pagination.pageIndex).toBe(0);
  });

  test('goes back to the first page when a column filter changes', async () => {
    await render(rowsOf(25));
    await act(async () => table.setPageIndex(1));

    await act(async () => table.setColumnFilters([{ id: 'name', value: 'row 2' }]));

    expect(table.getState().pagination.pageIndex).toBe(0);
  });

  test('goes back to the first page when the sorting changes', async () => {
    await render(rowsOf(25));
    await act(async () => table.setPageIndex(2));

    await act(async () => table.setSorting([{ id: 'name', desc: true }]));

    expect(table.getState().pagination.pageIndex).toBe(0);
  });

  test('goes back to the first page when the data changes', async () => {
    const { root, Page } = await render(rowsOf(25));
    await act(async () => table.setPageIndex(2));

    function NextPage() {
      table = useDataTable({ data: rowsOf(30), columns: COLUMNS }).table;
      table.getRowModel();
      return null;
    }
    await act(async () => root.render(createElement(NextPage)));
    void Page;

    expect(table.getState().pagination.pageIndex).toBe(0);
  });

  test('stays on its page when something else re-renders it', async () => {
    const data = rowsOf(25);
    const { root, Page } = await render(data);
    await act(async () => table.setPageIndex(2));

    await act(async () => root.render(createElement(Page)));

    expect(table.getState().pagination.pageIndex).toBe(2);
  });
});
