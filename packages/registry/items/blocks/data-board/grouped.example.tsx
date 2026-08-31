'use client';

import { CircleCheck, CircleDashed, CircleDot } from 'lucide-react';
import { DataBoard, type DataBoardColumn } from '@/components/block/shuip/data-board';

type Ticket = {
  id: string;
  title: string;
  owner: string;
  sprint: number | null;
  status: string;
};

const COLUMNS: DataBoardColumn[] = [
  { id: 'todo', label: 'To do', icon: CircleDashed },
  { id: 'doing', label: 'Doing', icon: CircleDot, accentClassName: 'text-primary' },
  { id: 'done', label: 'Done', icon: CircleCheck, accentClassName: 'text-foreground' },
];

const SPRINT_NOTES: Record<string, string> = {
  '12': 'Search relevance and indexing',
  '13': 'Billing migration',
  '14': 'Mobile polish',
};

const OWNERS = ['Ada', 'Grace', 'Alan'];
const STATUSES = ['todo', 'doing', 'done'];
const SPRINTS: (number | null)[] = [12, 13, 14, null];

const TICKETS: Ticket[] = Array.from({ length: 28 }, (_, index) => ({
  id: `ticket-${index + 1}`,
  title: `Ticket ${index + 1}`,
  owner: OWNERS[index % OWNERS.length],
  sprint: SPRINTS[index % SPRINTS.length],
  status: STATUSES[index % STATUSES.length],
}));

export default function DataBoardGroupedExample() {
  return (
    <div className='flex h-[36rem] flex-col'>
      <DataBoard<Ticket>
        columns={COLUMNS}
        defaultData={TICKETS}
        columnField='status'
        persistKey='docs-data-board-grouped'
        title={(ticket) => ticket.title}
        fields={[{ key: 'owner' }]}
        pageSize={2}
        pageSizeOptions={[2, 4, 8]}
        groupBy={{
          field: 'sprint',
          groups: [
            { id: '14', label: 'Sprint 14' },
            { id: '13', label: 'Sprint 13' },
            { id: '12', label: 'Sprint 12' },
          ],
          description: (value) => SPRINT_NOTES[String(value)] ?? null,
          defaultCollapsed: (groupId) => groupId === '12',
        }}
        labels={{ ungrouped: 'No sprint' }}
        onCardMove={(event) => console.log('moved', event.item.id, event.toColumn, event.toGroup)}
      />
    </div>
  );
}
