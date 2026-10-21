'use client';

import { CircleCheck, CircleDashed, CircleDot } from 'lucide-react';
import * as React from 'react';
import { DataBoard, type DataBoardColumn, type DataBoardMoveEvent } from '@/components/block/shuip/data-board';

type Task = {
  id: string;
  title: string;
  status: string;
  position: number;
};

const COLUMNS: DataBoardColumn[] = [
  { id: 'todo', label: 'To do', icon: CircleDashed },
  { id: 'doing', label: 'Doing', icon: CircleDot, accentClassName: 'text-primary' },
  { id: 'done', label: 'Done', icon: CircleCheck, accentClassName: 'text-foreground' },
];

const TASKS: Task[] = [
  { id: 'task-1', title: 'Write the brief', status: 'todo', position: 0 },
  { id: 'task-2', title: 'Sketch the layout', status: 'todo', position: 1 },
  { id: 'task-3', title: 'Review the copy', status: 'todo', position: 2 },
  { id: 'task-4', title: 'Build the prototype', status: 'doing', position: 0 },
  { id: 'task-5', title: 'Ship the first draft', status: 'done', position: 0 },
];

// Stands in for the request that updates one record.
async function updateTask(id: string, patch: Pick<Task, 'status'> & { position?: number }): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return `PATCH ${id} ${JSON.stringify(patch)}`;
}

export default function DataBoardPersistPositionsExample() {
  const [requests, setRequests] = React.useState<string[]>([]);

  const persist = async ({ item, toColumn, position }: DataBoardMoveEvent<Task>) => {
    const request = await updateTask(item.id, { status: toColumn, position });
    setRequests((previous) => [request, ...previous].slice(0, 3));
  };

  return (
    <div className='flex w-full min-w-0 flex-col gap-3'>
      <div className='flex h-[22rem] w-full min-w-0 flex-col'>
        <DataBoard<Task>
          columns={COLUMNS}
          defaultData={TASKS}
          columnField='status'
          positionField='position'
          title={(task) => task.title}
          pageSize={false}
          onCardMove={(event) => void persist(event)}
        />
      </div>
      <ul className='min-h-[4.5rem] space-y-1 font-mono text-xs text-muted-foreground'>
        {requests.length === 0 ? <li>Drag a card: one request is sent per move.</li> : null}
        {requests.map((request) => (
          <li key={request}>{request}</li>
        ))}
      </ul>
    </div>
  );
}
