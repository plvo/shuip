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

const titleOf = (id: string | null) => TASKS.find((task) => task.id === id)?.title;

// Stands in for the request that updates one record.
async function updateTask(id: string, patch: Pick<Task, 'status'> & { position?: number }): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  console.log('PATCH', id, patch);
}

type SavedMove = { id: number; text: string };

export default function DataBoardPersistPositionsExample() {
  const [saved, setSaved] = React.useState<SavedMove[]>([]);
  const savedCount = React.useRef(0);
  const logId = React.useId();

  const persist = async ({ item, toColumn, position, beforeId, afterId }: DataBoardMoveEvent<Task>) => {
    await updateTask(item.id, { status: toColumn, position });
    const between = `after ${titleOf(beforeId) ?? 'nothing'}, before ${titleOf(afterId) ?? 'nothing'}`;
    savedCount.current += 1;
    const text = `${item.title}: saved ${toColumn} at position ${position}, ${between}`;
    setSaved((previous) => [{ id: savedCount.current, text }, ...previous].slice(0, 3));
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
          fields={[{ key: 'position', label: 'position' }]}
          pageSize={false}
          onCardMove={(event) => void persist(event)}
        />
      </div>
      <div className='space-y-1'>
        <p id={logId} className='text-xs font-medium'>
          Saved moves, one request each
        </p>
        <ul
          aria-labelledby={logId}
          aria-live='polite'
          className='min-h-[4.5rem] space-y-1 text-xs text-muted-foreground'
        >
          {saved.length === 0 ? <li>Drag a card to save its position.</li> : null}
          {saved.map(({ id, text }) => (
            <li key={id}>{text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
