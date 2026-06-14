'use client';

import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import * as React from 'react';

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  useDataTable,
} from '@/components/block/shuip/data-table';

type Order = {
  id: string;
  customer: string;
  total: number;
  status: 'paid' | 'pending' | 'refunded';
};

const STATUSES: Order['status'][] = ['paid', 'pending', 'refunded'];
const CUSTOMERS = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Soylent', 'Stark', 'Wayne'];

const ALL_ORDERS: Order[] = Array.from({ length: 47 }, (_, index) => ({
  id: `ORD-${1000 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  total: Math.round(50 + ((index * 73) % 950)),
  status: STATUSES[index % STATUSES.length],
}));

const statusOptions = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Refunded', value: 'refunded' },
];

type QueryArgs = {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
};

function queryOrders({ pagination, sorting, columnFilters, globalFilter }: QueryArgs): {
  rows: Order[];
  total: number;
} {
  let rows = [...ALL_ORDERS];

  const search = globalFilter.trim().toLowerCase();
  if (search) {
    rows = rows.filter((order) => `${order.id} ${order.customer}`.toLowerCase().includes(search));
  }

  const statusFilter = columnFilters.find((filter) => filter.id === 'status')?.value as string[] | undefined;
  if (statusFilter?.length) {
    rows = rows.filter((order) => statusFilter.includes(order.status));
  }

  const sort = sorting[0];
  if (sort) {
    rows.sort((a, b) => {
      const left = a[sort.id as keyof Order];
      const right = b[sort.id as keyof Order];
      if (left < right) return sort.desc ? 1 : -1;
      if (left > right) return sort.desc ? -1 : 1;
      return 0;
    });
  }

  const total = rows.length;
  const start = pagination.pageIndex * pagination.pageSize;
  return { rows: rows.slice(start, start + pagination.pageSize), total };
}

export default function DataTableServerExample() {
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [result, setResult] = React.useState<{ rows: Order[]; total: number }>({ rows: [], total: 0 });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setResult(queryOrders({ pagination, sorting, columnFilters, globalFilter }));
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [pagination, sorting, columnFilters, globalFilter]);

  const columns = React.useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Order' />,
        meta: { label: 'Order' },
        cell: ({ row }) => <span className='font-medium'>{row.original.id}</span>,
      },
      {
        accessorKey: 'customer',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
        meta: { label: 'Customer' },
      },
      {
        accessorKey: 'total',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Total' />,
        meta: { label: 'Total' },
        cell: ({ row }) => <span className='tabular-nums'>${row.original.total}</span>,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        meta: { label: 'Status', variant: 'multiSelect', options: statusOptions },
        cell: ({ row }) => <span className='capitalize'>{row.original.status}</span>,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: result.rows,
    columns,
    pageCount: Math.ceil(result.total / pagination.pageSize),
    getRowId: (row) => row.id,
    state: { pagination, sorting, columnFilters, globalFilter },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className='flex flex-col gap-3'>
      <DataTableToolbar table={table} searchPlaceholder='Search orders...' />
      <DataTable table={table} isLoading={isLoading} />
      <DataTablePagination table={table} />
    </div>
  );
}
