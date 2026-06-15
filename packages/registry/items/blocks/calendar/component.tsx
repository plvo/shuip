'use client';

import { addDays, addMonths, endOfWeek, format, startOfDay, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

function useControllableState<V>(
  controlled: V | undefined,
  defaultValue: V,
  onChange?: (v: V) => void,
): [V, (v: V) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<V>(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : uncontrolled;
  const setValue = React.useCallback(
    (next: V) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [value, setValue];
}

export function Calendar<T extends Record<string, unknown>>(props: CalendarProps<T>) {
  const {
    events,
    defaultEvents = [] as T[],
    onEventsChange,
    idField = 'id' as keyof T,
    titleField,
    startField,
    endField,
    allDayField,
    color,
    renderEvent,
    view: viewProp,
    defaultView = 'month',
    onViewChange,
    date: dateProp,
    defaultDate,
    onDateChange,
    views = ['month', 'week', 'day', 'agenda'] as CalendarView[],
    weekStartsOn = 1,
    editable = false,
    onEventClick,
    onSlotSelect,
    className,
  } = props;

  const [view, setView] = useControllableState<CalendarView>(viewProp, defaultView, onViewChange);
  const [date, setDate] = useControllableState<Date>(dateProp, defaultDate ?? startOfDay(new Date()), onDateChange);

  const periodLabel = React.useMemo(() => {
    switch (view) {
      case 'month':
        return format(date, 'MMMM yyyy');
      case 'week': {
        const weekStart = startOfWeek(date, { weekStartsOn });
        const weekEnd = endOfWeek(date, { weekStartsOn });
        return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
      }
      case 'day':
        return format(date, 'PPP');
      case 'agenda':
        return format(date, 'MMMM yyyy');
    }
  }, [view, date, weekStartsOn]);

  const shift = React.useCallback(
    (dir: 1 | -1) => {
      switch (view) {
        case 'month':
          setDate(addMonths(date, dir));
          break;
        case 'week':
          setDate(addDays(date, 7 * dir));
          break;
        case 'day':
        case 'agenda':
          setDate(addDays(date, dir));
          break;
      }
    },
    [view, date, setDate],
  );

  const onToday = React.useCallback(() => setDate(startOfDay(new Date())), [setDate]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <CalendarToolbar
        label={periodLabel}
        views={views}
        view={view}
        onView={setView}
        onToday={onToday}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
      />
      {(() => {
        switch (view) {
          case 'month':
            return null;
          case 'week':
            return null;
          case 'day':
            return null;
          case 'agenda':
            return null;
        }
      })()}
    </div>
  );
}

function CalendarToolbar({
  label,
  views,
  view,
  onView,
  onToday,
  onPrev,
  onNext,
}: {
  label: string;
  views: CalendarView[];
  view: CalendarView;
  onView: (v: CalendarView) => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-2'>
      <div className='flex items-center gap-1'>
        <Button variant='outline' size='sm' onClick={onToday}>
          Today
        </Button>
        <Button variant='outline' size='icon' className='size-8' onClick={onPrev} aria-label='Previous'>
          <ChevronLeft className='size-4' />
        </Button>
        <Button variant='outline' size='icon' className='size-8' onClick={onNext} aria-label='Next'>
          <ChevronRight className='size-4' />
        </Button>
        <span className='ml-2 text-sm font-medium'>{label}</span>
      </div>
      {views.length > 1 ? (
        <Select value={view} onValueChange={(v) => onView(v as CalendarView)}>
          <SelectTrigger className='w-32' size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {views.map((v) => (
              <SelectItem key={v} value={v}>
                {v[0].toUpperCase() + v.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
