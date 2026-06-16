'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { Calendar, type CalendarView, useCalendar } from '@/components/block/shuip/calendar';
import { Button } from '@/components/ui/button';
import { Calendar as DayPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CalEvent = { id: string; title: string; start: Date; end: Date };

const now = new Date();
const at = (dayOffset: number, h: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, h);

const seed: CalEvent[] = [
  { id: '1', title: 'Sprint planning', start: at(0, 10), end: at(0, 11) },
  { id: '2', title: 'Release', start: at(1, 15), end: at(1, 16) },
  { id: '3', title: '1:1', start: at(3, 14), end: at(3, 15) },
];

function TabsNav() {
  const { periodLabel, views, view, setView, goToPrevious, goToNext } = useCalendar();
  return (
    <div className='flex flex-wrap items-center justify-between gap-2'>
      <div className='flex items-center gap-1'>
        <Button variant='ghost' size='icon' className='size-8' onClick={goToPrevious} aria-label='Previous'>
          <ChevronLeft className='size-4' />
        </Button>
        <Button variant='ghost' size='icon' className='size-8' onClick={goToNext} aria-label='Next'>
          <ChevronRight className='size-4' />
        </Button>
        <span className='ml-1 text-sm font-medium'>{periodLabel}</span>
      </div>
      <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
        <TabsList>
          {views.map((v) => (
            <TabsTrigger key={v} value={v} className='capitalize'>
              {v}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

function CenteredNav() {
  const { periodLabel, views, view, setView, goToToday, goToPrevious, goToNext } = useCalendar();
  return (
    <div className='flex flex-col items-center gap-3'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' className='size-8' onClick={goToPrevious} aria-label='Previous'>
          <ChevronLeft className='size-4' />
        </Button>
        <span className='min-w-52 text-center text-lg font-semibold tracking-tight'>{periodLabel}</span>
        <Button variant='ghost' size='icon' className='size-8' onClick={goToNext} aria-label='Next'>
          <ChevronRight className='size-4' />
        </Button>
      </div>
      <div className='flex items-center gap-2'>
        <Button variant='outline' size='sm' onClick={goToToday}>
          Today
        </Button>
        <Select value={view} onValueChange={(v) => setView(v as CalendarView)}>
          <SelectTrigger className='w-32' size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {views.map((v) => (
              <SelectItem key={v} value={v} className='capitalize'>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CompactNav() {
  const { periodLabel, views, view, setView, goToToday, goToPrevious, goToNext } = useCalendar();
  return (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex items-center gap-1'>
        <Button variant='outline' size='icon' className='size-8' onClick={goToPrevious} aria-label='Previous'>
          <ChevronLeft className='size-4' />
        </Button>
        <Button variant='outline' size='icon' className='size-8' onClick={goToToday} aria-label='Today'>
          <CalendarDays className='size-4' />
        </Button>
        <Button variant='outline' size='icon' className='size-8' onClick={goToNext} aria-label='Next'>
          <ChevronRight className='size-4' />
        </Button>
      </div>
      <span className='min-w-0 flex-1 truncate text-center text-sm font-medium'>{periodLabel}</span>
      <Select value={view} onValueChange={(v) => setView(v as CalendarView)}>
        <SelectTrigger className='w-24' size='sm'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {views.map((v) => (
            <SelectItem key={v} value={v} className='capitalize'>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DatePickerNav() {
  const { date, setDate, periodLabel, goToToday, goToPrevious, goToNext } = useCalendar();
  const [open, setOpen] = React.useState(false);
  return (
    <div className='flex flex-wrap items-center justify-between gap-2'>
      <div className='flex items-center gap-1'>
        <Button variant='outline' size='sm' onClick={goToToday}>
          Today
        </Button>
        <Button variant='outline' size='icon' className='size-8' onClick={goToPrevious} aria-label='Previous'>
          <ChevronLeft className='size-4' />
        </Button>
        <Button variant='outline' size='icon' className='size-8' onClick={goToNext} aria-label='Next'>
          <ChevronRight className='size-4' />
        </Button>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant='ghost' className='gap-2 text-sm font-medium'>
            <CalendarDays className='size-4' />
            {periodLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='end'>
          <DayPicker
            mode='single'
            selected={date}
            onSelect={(d) => {
              if (d) {
                setDate(d);
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function NavCase({ label, nav }: { label: string; nav: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-3 rounded-lg border p-4'>
      <span className='text-xs font-medium text-muted-foreground'>{label}</span>
      <Calendar.Root<CalEvent>
        defaultEvents={seed}
        titleField='title'
        startField='start'
        endField='end'
        defaultView='agenda'
      >
        <div className='flex flex-col gap-4'>
          {nav}
          <Calendar.View />
        </div>
      </Calendar.Root>
    </div>
  );
}

export default function Example() {
  return (
    <div className='flex w-full flex-col gap-6'>
      <NavCase label='Segmented tabs' nav={<TabsNav />} />
      <NavCase label='Centered' nav={<CenteredNav />} />
      <NavCase label='Compact / mobile' nav={<CompactNav />} />
      <NavCase label='Date picker jump' nav={<DatePickerNav />} />
    </div>
  );
}
