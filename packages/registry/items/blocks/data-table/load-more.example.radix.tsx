'use client';

import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

import { DataTable, DataTableColumnHeader, DataTableLoadMore, useDataTable } from '@/components/block/shuip/data-table';
import { Button } from '@/components/ui/button';

type Event = {
  id: string;
  name: string;
  channel: string;
  at: string;
};

const channels = ['web', 'mobile', 'api', 'import'];

const allEvents: Event[] = Array.from({ length: 60 }, (_, index) => ({
  id: `evt-${index + 1}`,
  name: `event.${['created', 'updated', 'deleted', 'viewed'][index % 4]}`,
  channel: channels[index % channels.length],
  at: `2026-06-${String((index % 28) + 1).padStart(2, '0')} 09:${String(index % 60).padStart(2, '0')}`,
}));

const PAGE = 10;

export default function DataTableLoadMoreExample() {
  const [mode, setMode] = React.useState<'button' | 'infinite'>('button');
  const [loaded, setLoaded] = React.useState(PAGE);
  const [isLoading, setIsLoading] = React.useState(false);

  const rows = React.useMemo(() => allEvents.slice(0, loaded), [loaded]);
  const hasMore = loaded < allEvents.length;

  const onLoadMore = React.useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setLoaded((current) => Math.min(current + PAGE, allEvents.length));
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const columns = React.useMemo<ColumnDef<Event>[]>(
    () => [
      {
        accessorKey: 'name',
        size: 200,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Event' />,
        meta: { label: 'Event' },
        cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
      },
      {
        accessorKey: 'channel',
        size: 140,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Channel' />,
        meta: { label: 'Channel' },
        cell: ({ row }) => <span className='capitalize'>{row.original.channel}</span>,
      },
      {
        accessorKey: 'at',
        size: 180,
        header: ({ column }) => <DataTableColumnHeader column={column} title='When' />,
        meta: { label: 'When' },
        cell: ({ row }) => <span className='text-muted-foreground tabular-nums'>{row.original.at}</span>,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: allEvents.length } },
  });

  return (
    <div className='flex w-full min-w-0 flex-col gap-3'>
      <div className='flex items-center gap-2'>
        <Button variant={mode === 'button' ? 'default' : 'outline'} size='sm' onClick={() => setMode('button')}>
          Button
        </Button>
        <Button variant={mode === 'infinite' ? 'default' : 'outline'} size='sm' onClick={() => setMode('infinite')}>
          Infinite
        </Button>
      </div>
      <DataTable table={table} />
      <DataTableLoadMore
        mode={mode}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        isLoading={isLoading}
        loaded={rows.length}
        total={allEvents.length}
      />
    </div>
  );
}
