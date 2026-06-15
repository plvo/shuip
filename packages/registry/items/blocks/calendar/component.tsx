'use client';

import type * as React from 'react';
import { cn } from '@/lib/utils';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';
export type CalendarEventColor = 'primary' | 'blue' | 'green' | 'red' | 'amber';

export type CalendarProps<T extends Record<string, unknown>> = {
  events?: T[];
  defaultEvents?: T[];
  onEventsChange?: (next: T[]) => void;

  idField?: keyof T;
  titleField: keyof T;
  startField: keyof T;
  endField: keyof T;
  allDayField?: keyof T;
  color?: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;

  view?: CalendarView;
  defaultView?: CalendarView;
  onViewChange?: (v: CalendarView) => void;
  date?: Date;
  defaultDate?: Date;
  onDateChange?: (d: Date) => void;

  views?: CalendarView[];
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  editable?: boolean;

  onEventClick?: (item: T) => void;
  onSlotSelect?: (range: { start: Date; end: Date; allDay: boolean }) => void;

  className?: string;
};

export function Calendar<T extends Record<string, unknown>>(props: CalendarProps<T>) {
  return <div className={cn('flex flex-col gap-4', props.className)}>calendar</div>;
}
