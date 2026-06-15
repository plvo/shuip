'use client';

import { Calendar } from '@/components/block/shuip/calendar';

type CalEvent = { id: string; title: string; start: Date; end: Date };

const now = new Date();
const at = (dayOffset: number, h: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, h);

const events: CalEvent[] = [
  { id: '1', title: 'Sprint planning', start: at(0, 10), end: at(0, 11) },
  { id: '2', title: 'Release', start: at(1, 15), end: at(1, 16) },
  { id: '3', title: '1:1', start: at(3, 14), end: at(3, 15) },
];

export default function Example() {
  return (
    <Calendar.Root<CalEvent>
      defaultEvents={events}
      titleField='title'
      startField='start'
      endField='end'
      defaultView='agenda'
    >
      <div className='flex w-full flex-col gap-4'>
        <Calendar.Nav />
        <Calendar.View />
      </div>
    </Calendar.Root>
  );
}
