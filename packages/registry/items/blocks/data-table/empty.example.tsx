'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { UserPlus } from 'lucide-react';
import * as React from 'react';

import { DataTable, DataTableColumnHeader, DataTableEmpty, useDataTable } from '@/components/block/shuip/data-table';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  name: string;
  email: string;
};

export default function DataTableEmptyExample() {
  const [variant, setVariant] = React.useState<'text' | 'illustrated' | 'with-action'>('illustrated');

  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        size: 220,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
        meta: { label: 'Name' },
      },
      {
        accessorKey: 'email',
        size: 260,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />,
        meta: { label: 'Email' },
      },
    ],
    [],
  );

  const { table } = useDataTable<User>({ data: [], columns, getRowId: (row) => row.id });

  return (
    <div className='flex w-full min-w-0 flex-col gap-3'>
      <div className='flex items-center gap-2'>
        {(['text', 'illustrated', 'with-action'] as const).map((value) => (
          <Button
            key={value}
            variant={variant === value ? 'default' : 'outline'}
            size='sm'
            onClick={() => setVariant(value)}
          >
            {value}
          </Button>
        ))}
      </div>
      <DataTable
        table={table}
        emptyState={
          <DataTableEmpty
            variant={variant}
            icon={UserPlus}
            title='No users yet'
            description='Invite teammates to see them listed here.'
            action={<Button size='sm'>Invite user</Button>}
          />
        }
      />
    </div>
  );
}
