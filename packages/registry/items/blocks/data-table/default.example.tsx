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
  { id: '7', name: 'Kai Nguyen', email: 'kai@acme.io', role: 'editor', status: 'active' },
  { id: '8', name: 'Lena Fox', email: 'lena@acme.io', role: 'viewer', status: 'suspended' },
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

export default function DataTableDefaultExample() {
  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
        meta: { label: 'Name' },
        cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />,
        meta: { label: 'Email' },
        cell: ({ row }) => <span className='text-muted-foreground'>{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Role' />,
        meta: { label: 'Role', variant: 'multiSelect', options: roleOptions },
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => <span className='capitalize'>{row.original.role}</span>,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        meta: { label: 'Status', variant: 'multiSelect', options: statusOptions },
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => <span className='capitalize'>{row.original.status}</span>,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: users,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  return (
    <div className='flex flex-col gap-3'>
      <DataTableToolbar table={table} searchPlaceholder='Search users...' />
      <DataTable table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
