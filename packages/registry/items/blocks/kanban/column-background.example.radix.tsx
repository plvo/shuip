'use client';

import { Kanban } from '@/components/block/shuip/kanban';

type Task = {
  id: string;
  title: string;
  assignee: string;
  status: string;
};

const columns = [
  { id: 'backlog', label: 'Backlog', color: 'var(--color-violet-500)' },
  { id: 'in-progress', label: 'In progress', color: 'var(--color-amber-500)' },
  { id: 'blocked', label: 'Blocked', color: 'var(--color-red-500)' },
];

const tasks: Task[] = [
  { id: '1', title: 'Design the empty states', assignee: 'Ava', status: 'backlog' },
  { id: '2', title: 'Wire the search bar', assignee: 'Liam', status: 'backlog' },
  { id: '3', title: 'Drag-and-drop sensors', assignee: 'Noah', status: 'in-progress' },
  { id: '4', title: 'Column color accents', assignee: 'Mia', status: 'in-progress' },
  { id: '5', title: 'Waiting on the API contract', assignee: 'Ava', status: 'blocked' },
];

export default function KanbanColumnBackgroundExample() {
  return (
    <Kanban<Task>
      columns={columns}
      defaultData={tasks}
      columnField='status'
      title={(task) => task.title}
      fields={[{ key: 'assignee', label: 'Assignee' }]}
      searchableFields={['title', 'assignee']}
      searchPlaceholder='Search tasks...'
      defaultColumnBackground='column'
      backgroundPicker
      persistKey='docs-kanban-column-background'
    />
  );
}
