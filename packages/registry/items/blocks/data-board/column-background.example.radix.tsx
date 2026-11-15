'use client';

import { CircleDashed, CircleDot, OctagonAlert } from 'lucide-react';
import { DataBoard, type DataBoardColumn } from '@/components/block/shuip/data-board';

type Ticket = {
  id: string;
  title: string;
  owner: string;
  status: string;
};

const COLUMNS: DataBoardColumn[] = [
  { id: 'backlog', label: 'Backlog', icon: CircleDashed, accentClassName: 'text-violet-500' },
  { id: 'doing', label: 'Doing', icon: CircleDot, accentClassName: 'text-amber-500' },
  { id: 'blocked', label: 'Blocked', icon: OctagonAlert, accentClassName: 'text-red-500' },
];

const OWNERS = ['Ada', 'Grace', 'Alan'];
const STATUSES = ['backlog', 'doing', 'blocked'];

const TICKETS: Ticket[] = Array.from({ length: 14 }, (_, index) => ({
  id: `ticket-${index + 1}`,
  title: `Ticket ${index + 1}`,
  owner: OWNERS[index % OWNERS.length],
  status: STATUSES[index % STATUSES.length],
}));

export default function DataBoardColumnBackgroundExample() {
  return (
    <div className='flex h-[32rem] w-full min-w-0 flex-col'>
      <DataBoard<Ticket>
        columns={COLUMNS}
        defaultData={TICKETS}
        columnField='status'
        persistKey='docs-data-board-column-background'
        title={(ticket) => ticket.title}
        fields={[{ key: 'owner' }]}
        searchableFields={['title', 'owner']}
        pageSize={4}
        pageSizeOptions={[4, 8, 16]}
        defaultColumnBackground='column'
        backgroundPicker
        onCardMove={(event) => console.log('moved', event.item.id, event.toColumn)}
      />
    </div>
  );
}
