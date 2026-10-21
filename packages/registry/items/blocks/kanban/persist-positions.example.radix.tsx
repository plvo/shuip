'use client';

import * as React from 'react';
import { Kanban, type KanbanMoveEvent } from '@/components/block/shuip/kanban';

type Task = {
  id: string;
  title: string;
  status: string;
  position: number;
};

const columns = [
  { id: 'todo', label: 'To do', color: 'var(--color-muted-foreground)' },
  { id: 'doing', label: 'Doing', color: 'var(--color-blue-500)' },
  { id: 'done', label: 'Done', color: 'var(--color-green-500)' },
];

const tasks: Task[] = [
  { id: 'task-1', title: 'Write the brief', status: 'todo', position: 0 },
  { id: 'task-2', title: 'Sketch the layout', status: 'todo', position: 1 },
  { id: 'task-3', title: 'Review the copy', status: 'todo', position: 2 },
  { id: 'task-4', title: 'Build the prototype', status: 'doing', position: 0 },
  { id: 'task-5', title: 'Ship the first draft', status: 'done', position: 0 },
];

const titleOf = (id: string | null) => tasks.find((task) => task.id === id)?.title;

// Stands in for the request that updates one record.
async function updateTask(id: string, patch: Pick<Task, 'status'> & { position?: number }): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  console.log('PATCH', id, patch);
}

type SavedMove = { id: number; text: string };

export default function KanbanPersistPositionsExample() {
  const [saved, setSaved] = React.useState<SavedMove[]>([]);
  const savedCount = React.useRef(0);
  const logId = React.useId();

  const persist = async ({ item, toColumn, position, beforeId, afterId }: KanbanMoveEvent<Task>) => {
    await updateTask(item.id, { status: toColumn, position });
    const between = `after ${titleOf(beforeId) ?? 'nothing'}, before ${titleOf(afterId) ?? 'nothing'}`;
    savedCount.current += 1;
    const text = `${item.title}: saved ${toColumn} at position ${position}, ${between}`;
    setSaved((previous) => [{ id: savedCount.current, text }, ...previous].slice(0, 3));
  };

  return (
    <div className='flex w-full min-w-0 flex-col gap-3'>
      <Kanban<Task>
        columns={columns}
        defaultData={tasks}
        columnField='status'
        positionField='position'
        title={(task) => task.title}
        fields={[{ key: 'position', label: 'Position' }]}
        onCardMove={(event) => void persist(event)}
      />
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
