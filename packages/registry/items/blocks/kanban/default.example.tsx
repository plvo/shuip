'use client';

import { Kanban } from '@/components/block/shuip/kanban';

type Task = {
  id: string;
  title: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  points: number;
  status: string;
};

const columns = [
  { id: 'todo', label: 'To do', color: 'var(--color-muted-foreground)' },
  { id: 'in-progress', label: 'In progress', color: 'var(--color-blue-500)' },
  { id: 'done', label: 'Done', color: 'var(--color-green-500)' },
];

const tasks: Task[] = [
  { id: '1', title: 'Design the empty states', assignee: 'Ava', priority: 'medium', points: 3, status: 'todo' },
  { id: '2', title: 'Wire the search bar', assignee: 'Liam', priority: 'high', points: 5, status: 'todo' },
  { id: '3', title: 'Drag-and-drop sensors', assignee: 'Noah', priority: 'high', points: 8, status: 'in-progress' },
  { id: '4', title: 'Column color accents', assignee: 'Mia', priority: 'low', points: 2, status: 'in-progress' },
  { id: '5', title: 'Write the docs page', assignee: 'Ava', priority: 'medium', points: 3, status: 'done' },
];

export default function KanbanDefaultExample() {
  return (
    <Kanban<Task>
      columns={columns}
      defaultData={tasks}
      columnField='status'
      title={(task) => task.title}
      fields={[
        { key: 'assignee', label: 'Assignee' },
        { key: 'priority', label: 'Priority' },
        { key: 'points', render: (value) => `${String(value)} pts` },
      ]}
      searchableFields={['title', 'assignee']}
      searchPlaceholder='Search tasks...'
      renderColumnSummary={(items) => `${items.reduce((sum, t) => sum + t.points, 0)} pts`}
      onCardClick={(task) => console.log('open task', task.id)}
      onCardAdd={(columnId) => console.log('add card to', columnId)}
    />
  );
}
