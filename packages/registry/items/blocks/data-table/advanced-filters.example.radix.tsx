'use client';

import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

import {
  DataTable,
  DataTableColumnHeader,
  DataTableFilterMenu,
  DataTablePagination,
  DataTableSortMenu,
  DataTableViews,
  useDataTable,
} from '@/components/block/shuip/data-table';
import { Button } from '@/components/ui/button';

type Deal = {
  id: string;
  company: string;
  stage: 'lead' | 'qualified' | 'won' | 'lost';
  amount: number;
  createdAt: string;
};

const stageOptions = [
  { label: 'Lead', value: 'lead' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
];

const stages: Deal['stage'][] = ['lead', 'qualified', 'won', 'lost'];

const deals: Deal[] = Array.from({ length: 40 }, (_, index) => ({
  id: `deal-${index + 1}`,
  company: `Company ${String.fromCharCode(65 + (index % 26))}${index + 1}`,
  stage: stages[index % stages.length],
  amount: 1000 + ((index * 617) % 9000),
  createdAt: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
}));

export default function DataTableAdvancedFiltersExample() {
  const [surface, setSurface] = React.useState<'popover' | 'dialog'>('popover');

  const columns = React.useMemo<ColumnDef<Deal>[]>(
    () => [
      {
        accessorKey: 'company',
        size: 200,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Company' />,
        meta: { label: 'Company', variant: 'text' },
        cell: ({ row }) => <span className='font-medium'>{row.original.company}</span>,
      },
      {
        accessorKey: 'stage',
        size: 140,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Stage' />,
        meta: { label: 'Stage', variant: 'select', options: stageOptions },
        cell: ({ row }) => <span className='capitalize'>{row.original.stage}</span>,
      },
      {
        accessorKey: 'amount',
        size: 130,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />,
        meta: { label: 'Amount', variant: 'number' },
        cell: ({ row }) => <span className='tabular-nums'>${row.original.amount.toLocaleString()}</span>,
      },
      {
        accessorKey: 'createdAt',
        size: 150,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Created' />,
        meta: { label: 'Created', variant: 'date' },
        cell: ({ row }) => <span className='text-muted-foreground tabular-nums'>{row.original.createdAt}</span>,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: deals,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 8 } },
  });

  return (
    <div className='flex w-full min-w-0 flex-col gap-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <DataTableFilterMenu table={table} variant={surface} />
        <DataTableSortMenu table={table} />
        <DataTableViews table={table} storageKey='deals' />
        <div className='ml-auto flex items-center gap-1 rounded-md bg-muted p-0.5'>
          {(['popover', 'dialog'] as const).map((value) => (
            <Button
              key={value}
              variant={surface === value ? 'default' : 'ghost'}
              size='sm'
              className='h-7 capitalize'
              onClick={() => setSurface(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </div>
      <DataTable table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
