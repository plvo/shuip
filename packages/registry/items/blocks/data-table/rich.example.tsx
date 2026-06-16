'use client';

import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  useDataTable,
} from '@/components/block/shuip/data-table';
import { Checkbox } from '@/components/ui/checkbox';

type Person = {
  id: string;
  name: string;
  email: string;
  team: string;
  stage: 'lead' | 'qualified' | 'won';
  tags: string[];
};

const people: Person[] = [
  { id: '1', name: 'Ava Mercer', email: 'ava@acme.io', team: 'Growth', stage: 'won', tags: ['VIP', 'EU'] },
  { id: '2', name: 'Liam Cho', email: 'liam@acme.io', team: 'Sales', stage: 'qualified', tags: ['US'] },
  { id: '3', name: 'Noah Patel', email: 'noah@acme.io', team: 'Sales', stage: 'lead', tags: ['Inbound'] },
  { id: '4', name: 'Mia Rossi', email: 'mia@acme.io', team: 'Success', stage: 'won', tags: ['VIP'] },
  { id: '5', name: 'Ethan Wood', email: 'ethan@acme.io', team: 'Growth', stage: 'lead', tags: ['EU', 'Trial'] },
  { id: '6', name: 'Zoe Bauer', email: 'zoe@acme.io', team: 'Success', stage: 'qualified', tags: ['US'] },
];

const stageStyles: Record<Person['stage'], string> = {
  lead: 'bg-muted text-muted-foreground',
  qualified: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  won: 'bg-green-500/15 text-green-600 dark:text-green-400',
};

const stageOptions = [
  { label: 'Lead', value: 'lead' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Won', value: 'won' },
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
  return (
    <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs'>
      {initials}
    </span>
  );
}

export default function DataTableRichExample() {
  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
            aria-label='Select all'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label='Select row'
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 48,
      },
      {
        accessorKey: 'name',
        size: 220,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
        meta: { label: 'Name' },
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Avatar name={row.original.name} />
            <span className='font-medium'>{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        size: 240,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />,
        meta: { label: 'Email' },
        cell: ({ row }) => <span className='text-muted-foreground'>{row.original.email}</span>,
      },
      {
        accessorKey: 'team',
        size: 150,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Team' />,
        meta: { label: 'Team' },
      },
      {
        accessorKey: 'stage',
        size: 150,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Stage' />,
        meta: { label: 'Stage', variant: 'multiSelect', options: stageOptions },
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs capitalize ${stageStyles[row.original.stage]}`}
          >
            {row.original.stage}
          </span>
        ),
      },
      {
        accessorKey: 'tags',
        size: 180,
        header: 'Tags',
        enableSorting: false,
        meta: { label: 'Tags' },
        cell: ({ row }) => (
          <div className='flex flex-wrap gap-1'>
            {row.original.tags.map((tag) => (
              <span key={tag} className='rounded border bg-muted px-1.5 py-0.5 text-muted-foreground text-xs'>
                {tag}
              </span>
            ))}
          </div>
        ),
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: people,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableColumnPinning: true,
    initialState: { columnPinning: { left: ['select', 'name'], right: [] } },
  });

  return (
    <div className='flex w-full min-w-0 flex-col gap-3'>
      <DataTableToolbar table={table} searchPlaceholder='Search people...' />
      <DataTable table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
