'use client';

import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  useDataTable,
} from '@/components/block/shuip/data-table';

type Invoice = {
  id: string;
  customer: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
};

const statuses: Invoice['status'][] = ['paid', 'pending', 'overdue'];

const invoices: Invoice[] = Array.from({ length: 84 }, (_, index) => ({
  id: `INV-${String(index + 1).padStart(4, '0')}`,
  customer: `Customer ${index + 1}`,
  amount: 100 + ((index * 37) % 900),
  status: statuses[index % statuses.length],
}));

export default function DataTablePaginationNumberedExample() {
  const columns = React.useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: 'id',
        size: 140,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Invoice' />,
        meta: { label: 'Invoice' },
        cell: ({ row }) => <span className='font-medium'>{row.original.id}</span>,
      },
      {
        accessorKey: 'customer',
        size: 220,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
        meta: { label: 'Customer' },
      },
      {
        accessorKey: 'amount',
        size: 120,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />,
        meta: { label: 'Amount' },
        cell: ({ row }) => <span className='tabular-nums'>${row.original.amount}</span>,
      },
      {
        accessorKey: 'status',
        size: 120,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        meta: { label: 'Status' },
        cell: ({ row }) => <span className='capitalize'>{row.original.status}</span>,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: invoices,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 8 } },
  });

  return (
    <div className='flex w-full min-w-0 flex-col gap-3'>
      <DataTable table={table} />
      <DataTablePagination table={table} variant='numbered' />
    </div>
  );
}
