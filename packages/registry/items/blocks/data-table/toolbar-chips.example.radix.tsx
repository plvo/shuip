'use client';

import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import * as React from 'react';

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  useDataTable,
} from '@/components/block/shuip/data-table';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
};

const users: User[] = [
  { id: '1', name: 'Ava Mercer', email: 'ava@acme.io', role: 'admin', status: 'active' },
  { id: '2', name: 'Liam Cho', email: 'liam@acme.io', role: 'editor', status: 'active' },
  { id: '3', name: 'Noah Patel', email: 'noah@acme.io', role: 'editor', status: 'invited' },
  { id: '4', name: 'Mia Rossi', email: 'mia@acme.io', role: 'viewer', status: 'suspended' },
  { id: '5', name: 'Ethan Wood', email: 'ethan@acme.io', role: 'viewer', status: 'active' },
  { id: '6', name: 'Zoe Bauer', email: 'zoe@acme.io', role: 'admin', status: 'invited' },
];

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Invited', value: 'invited' },
  { label: 'Suspended', value: 'suspended' },
];

export default function DataTableToolbarChipsExample() {
  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        size: 190,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
        meta: { label: 'Name' },
        cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
      },
      {
        accessorKey: 'email',
        size: 220,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />,
        meta: { label: 'Email' },
        cell: ({ row }) => <span className='text-muted-foreground'>{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        size: 120,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Role' />,
        meta: { label: 'Role', variant: 'multiSelect', options: roleOptions },
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => <span className='capitalize'>{row.original.role}</span>,
      },
      {
        accessorKey: 'status',
        size: 120,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        meta: { label: 'Status', variant: 'multiSelect', options: statusOptions },
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => <span className='capitalize'>{row.original.status}</span>,
      },
    ],
    [],
  );

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    { id: 'role', value: ['admin', 'editor'] },
  ]);

  const { table } = useDataTable({
    data: users,
    columns,
    getRowId: (row) => row.id,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
  });

  return (
    <div className='flex w-full min-w-0 flex-col gap-3'>
      <DataTableToolbar table={table} variant='inline-chips' searchPlaceholder='Search users...' />
      <DataTable table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
