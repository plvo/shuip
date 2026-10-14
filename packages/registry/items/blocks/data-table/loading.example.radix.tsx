'use client';

import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  useDataTable,
} from '@/components/block/shuip/data-table';
import { Button } from '@/components/ui/button';

type Project = {
  id: string;
  name: string;
  owner: string;
  status: 'active' | 'archived';
};

const projects: Project[] = [
  { id: '1', name: 'Apollo', owner: 'Ava Mercer', status: 'active' },
  { id: '2', name: 'Borealis', owner: 'Liam Cho', status: 'active' },
  { id: '3', name: 'Cobalt', owner: 'Noah Patel', status: 'archived' },
  { id: '4', name: 'Driftwood', owner: 'Mia Rossi', status: 'active' },
  { id: '5', name: 'Ember', owner: 'Ethan Wood', status: 'archived' },
];

export default function DataTableLoadingExample() {
  const [variant, setVariant] = React.useState<'skeleton' | 'overlay' | 'shimmer'>('skeleton');
  const [isLoading, setIsLoading] = React.useState(false);

  const trigger = React.useCallback((next: 'skeleton' | 'overlay' | 'shimmer') => {
    setVariant(next);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  const columns = React.useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: 'name',
        size: 200,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Project' />,
        meta: { label: 'Project' },
        cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
      },
      {
        accessorKey: 'owner',
        size: 220,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Owner' />,
        meta: { label: 'Owner' },
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

  const { table } = useDataTable({ data: projects, columns, getRowId: (row) => row.id });

  return (
    <div className='flex w-full min-w-0 flex-col gap-3'>
      <div className='flex items-center gap-2'>
        {(['skeleton', 'overlay', 'shimmer'] as const).map((value) => (
          <Button
            key={value}
            variant={variant === value ? 'default' : 'outline'}
            size='sm'
            onClick={() => trigger(value)}
            disabled={isLoading}
          >
            {value}
          </Button>
        ))}
      </div>
      <DataTable table={table} isLoading={isLoading} loadingVariant={variant} />
      <DataTablePagination table={table} />
    </div>
  );
}
