'use client';

import { Calendar } from '@/components/block/shuip/calendar';

type Event = { id: string; title: string; start: Date; end: Date };

const now = new Date();
const at = (h: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), h);

const events: Event[] = [
  { id: '1', title: 'Standup', start: at(9), end: at(10) },
  { id: '2', title: 'Design review', start: at(11), end: at(12) },
];

export default function Example() {
  return (
    <Calendar<Event>
      defaultEvents={events}
      titleField='title'
      startField='start'
      endField='end'
      defaultView='week'
      editable
    />
  );
}
