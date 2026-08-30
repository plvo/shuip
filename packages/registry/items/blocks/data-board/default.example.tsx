'use client';

import { CircleCheck, CircleDashed, CircleDot, CirclePause } from 'lucide-react';
import { DataBoard, type DataBoardColumn } from '@/components/block/shuip/data-board';

type Task = {
  id: string;
  title: string;
  assignee: string;
  points: number;
  status: string;
};

const COLUMNS: DataBoardColumn[] = [
  { id: 'backlog', label: 'Backlog', icon: CircleDashed },
  { id: 'in-progress', label: 'In progress', icon: CircleDot, accentClassName: 'text-primary' },
  { id: 'review', label: 'In review', icon: CirclePause, accentClassName: 'text-primary/70' },
  { id: 'done', label: 'Done', icon: CircleCheck, accentClassName: 'text-foreground' },
];

const ASSIGNEES = ['Ada', 'Grace', 'Alan', 'Katherine'];
const STATUSES = ['backlog', 'in-progress', 'review', 'done'];

const TASKS: Task[] = Array.from({ length: 34 }, (_, index) => ({
  id: `task-${index + 1}`,
  title: `Task ${index + 1}`,
  assignee: ASSIGNEES[index % ASSIGNEES.length],
  points: (index % 5) + 1,
  status: STATUSES[index % STATUSES.length],
}));

export default function DataBoardDefaultExample() {
  return (
    <div className='flex h-[32rem] flex-col'>
      <DataBoard<Task>
        columns={COLUMNS}
        defaultData={TASKS}
        columnField='status'
        title={(task) => task.title}
        fields={[{ key: 'assignee' }, { key: 'points', label: 'pts' }]}
        searchableFields={['title', 'assignee']}
        renderColumnSummary={(tasks) => `${tasks.reduce((total, task) => total + task.points, 0)} pts`}
        pageSize={5}
        onCardMove={(event) => console.log('moved', event.item.id, '->', event.toColumn)}
        onCardAdd={(columnId) => console.log('add to', columnId)}
        onCardClick={(task) => console.log('open', task.id)}
      />
    </div>
  );
}
