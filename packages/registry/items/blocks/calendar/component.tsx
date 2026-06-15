'use client';

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
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
  const [items] = useControllableState<T[]>(events, defaultEvents, onEventsChange);

  const getStart = React.useCallback((it: T) => it[startField] as unknown as Date, [startField]);
  const getEnd = React.useCallback((it: T) => it[endField] as unknown as Date, [endField]);
  const isAllDay = React.useCallback((it: T) => (allDayField ? Boolean(it[allDayField]) : false), [allDayField]);
  const getId = React.useCallback((it: T) => String(it[idField]), [idField]);
  const getTitle = React.useCallback((it: T) => String(it[titleField] ?? ''), [titleField]);

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

  const weekDays = React.useMemo(
    () => eachDayOfInterval({ start: startOfWeek(date, { weekStartsOn }), end: endOfWeek(date, { weekStartsOn }) }),
    [date, weekStartsOn],
  );

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
            return (
              <MonthView
                date={date}
                weekStartsOn={weekStartsOn}
                items={items}
                getStart={getStart}
                getId={getId}
                getTitle={getTitle}
                color={color}
                editable={editable}
                onEventClick={onEventClick}
                onSlotSelect={onSlotSelect}
              />
            );
          case 'week':
            return (
              <TimeGridView
                days={weekDays}
                items={items}
                getStart={getStart}
                getEnd={getEnd}
                getId={getId}
                getTitle={getTitle}
                isAllDay={isAllDay}
                color={color}
                editable={editable}
                onEventClick={onEventClick}
                onSlotSelect={onSlotSelect}
              />
            );
          case 'day':
            return (
              <TimeGridView
                days={[date]}
                items={items}
                getStart={getStart}
                getEnd={getEnd}
                getId={getId}
                getTitle={getTitle}
                isAllDay={isAllDay}
                color={color}
                editable={editable}
                onEventClick={onEventClick}
                onSlotSelect={onSlotSelect}
              />
            );
          case 'agenda':
            return null;
        }
      })()}
    </div>
  );
}

function monthGrid(date: Date, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn });
  return eachDayOfInterval({ start, end });
}

function colorClasses(c?: CalendarEventColor): string {
  switch (c) {
    case 'blue':
      return 'bg-blue-500 text-white';
    case 'green':
      return 'bg-green-600 text-white';
    case 'red':
      return 'bg-red-500 text-white';
    case 'amber':
      return 'bg-amber-500 text-black';
    default:
      return 'bg-primary text-primary-foreground';
  }
}

const HOUR_HEIGHT = 48;

function minutesSinceDayStart(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
function eventTop(start: Date): number {
  return (minutesSinceDayStart(start) / 60) * HOUR_HEIGHT;
}
function eventHeight(start: Date, end: Date): number {
  const mins = Math.max(15, (end.getTime() - start.getTime()) / 60_000);
  return (mins / 60) * HOUR_HEIGHT;
}

type LaidOut<T> = { item: T; col: number; cols: number };

function layoutDay<T>(dayEvents: T[], getStart: (t: T) => Date, getEnd: (t: T) => Date): LaidOut<T>[] {
  const sorted = [...dayEvents].sort((a, b) => getStart(a).getTime() - getStart(b).getTime());
  const colEnds: number[] = [];
  const placed = sorted.map((item) => {
    const s = getStart(item).getTime();
    let col = colEnds.findIndex((end) => end <= s);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(0);
    }
    colEnds[col] = getEnd(item).getTime();
    return { item, col };
  });
  const cols = Math.max(1, colEnds.length);
  return placed.map((p) => ({ ...p, cols }));
}

function EventBlock({
  title,
  start,
  end,
  laidOut,
  color,
  onClick,
}: {
  title: string;
  start: Date;
  end: Date;
  laidOut: { col: number; cols: number };
  color?: CalendarEventColor;
  onClick?: () => void;
}) {
  const widthPct = 100 / laidOut.cols;
  return (
    <button
      type='button'
      onClick={onClick}
      style={{
        top: eventTop(start),
        height: eventHeight(start, end),
        left: `${laidOut.col * widthPct}%`,
        width: `calc(${widthPct}% - 2px)`,
      }}
      className={cn('absolute z-10 overflow-hidden rounded px-1 py-0.5 text-left text-xs', colorClasses(color))}
    >
      <span className='block truncate font-medium'>{title}</span>
      <span className='block truncate opacity-80'>
        {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
      </span>
    </button>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const DAY_MS = 24 * 60 * 60 * 1000;

function TimeGridView<T extends Record<string, unknown>>({
  days,
  items,
  getStart,
  getEnd,
  getId,
  getTitle,
  isAllDay,
  color,
  editable,
  onEventClick,
}: {
  days: Date[];
  items: T[];
  getStart: (item: T) => Date;
  getEnd: (item: T) => Date;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  isAllDay: (item: T) => boolean;
  color?: (item: T) => CalendarEventColor | undefined;
  editable: boolean;
  onEventClick?: (item: T) => void;
  onSlotSelect?: (range: { start: Date; end: Date; allDay: boolean }) => void;
}) {
  const spansAllDay = React.useCallback(
    (item: T) => isAllDay(item) || getEnd(item).getTime() - getStart(item).getTime() >= DAY_MS,
    [isAllDay, getEnd, getStart],
  );

  return (
    <div className='overflow-hidden rounded-md border'>
      <div className='flex border-b'>
        <div className='w-14 shrink-0 border-r' />
        {days.map((day) => (
          <div key={day.toISOString()} className='flex-1 border-l p-2 text-center text-xs font-medium first:border-l-0'>
            {format(day, 'EEE d')}
          </div>
        ))}
      </div>

      <div className='flex border-b'>
        <div className='flex w-14 shrink-0 items-center justify-center border-r py-1 text-xs text-muted-foreground'>
          all-day
        </div>
        {days.map((day) => {
          const allDayEvents = items.filter((item) => spansAllDay(item) && isSameDay(getStart(item), day));
          return (
            <div key={day.toISOString()} className='flex flex-1 flex-col gap-1 border-l p-1 first:border-l-0'>
              {allDayEvents.map((item) => (
                <button
                  type='button'
                  key={getId(item)}
                  onClick={() => onEventClick?.(item)}
                  className={cn('w-full truncate rounded px-1 py-0.5 text-left text-xs', colorClasses(color?.(item)))}
                >
                  {getTitle(item)}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className='relative max-h-[600px] overflow-y-auto'>
        <div className='flex'>
          <div className='w-14 shrink-0 border-r'>
            {HOURS.map((h) => (
              <div key={h} className='h-12 pr-1 text-right text-xs text-muted-foreground'>
                {`${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const timed = items.filter((item) => !spansAllDay(item) && isSameDay(getStart(item), day));
            const laidOut = layoutDay(timed, getStart, getEnd);
            return (
              <div
                key={day.toISOString()}
                className={cn('relative flex-1 border-l first:border-l-0', editable && 'cursor-pointer')}
                style={{ height: 24 * HOUR_HEIGHT }}
              >
                {HOURS.map((h) => (
                  <div key={h} className='h-12 border-t first:border-t-0' />
                ))}
                {laidOut.map((entry) => (
                  <EventBlock
                    key={getId(entry.item)}
                    title={getTitle(entry.item)}
                    start={getStart(entry.item)}
                    end={getEnd(entry.item)}
                    laidOut={entry}
                    color={color?.(entry.item)}
                    onClick={() => onEventClick?.(entry.item)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthView<T extends Record<string, unknown>>({
  date,
  weekStartsOn,
  items,
  getStart,
  getId,
  getTitle,
  color,
  editable,
  onEventClick,
  onSlotSelect,
}: {
  date: Date;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  items: T[];
  getStart: (item: T) => Date;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  color?: (item: T) => CalendarEventColor | undefined;
  editable: boolean;
  onEventClick?: (item: T) => void;
  onSlotSelect?: (range: { start: Date; end: Date; allDay: boolean }) => void;
}) {
  const days = monthGrid(date, weekStartsOn);
  const weekdayLabels = days.slice(0, 7).map((day) => format(day, 'EEE'));

  return (
    <div className='overflow-hidden rounded-md border'>
      <div className='grid grid-cols-7'>
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className='border-b border-l p-2 text-center text-xs font-medium text-muted-foreground first:border-l-0'
          >
            {label}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = items
            .filter((item) => isSameDay(getStart(item), day))
            .sort((a, b) => getStart(a).getTime() - getStart(b).getTime());
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visible.length;

          const selectSlot = editable
            ? () => onSlotSelect?.({ start: startOfDay(day), end: addDays(startOfDay(day), 1), allDay: true })
            : undefined;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex min-h-24 flex-col gap-1 border-b border-l p-1 [&:nth-child(7n+1)]:border-l-0',
                editable && 'cursor-pointer hover:bg-accent/50',
              )}
              onClick={selectSlot}
            >
              <span className={cn('text-xs', !isSameMonth(day, date) && 'text-muted-foreground')}>
                {format(day, 'd')}
              </span>
              {visible.map((item) => (
                <button
                  type='button'
                  key={getId(item)}
                  className={cn('w-full truncate rounded px-1 py-0.5 text-left text-xs', colorClasses(color?.(item)))}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(item);
                  }}
                >
                  {getTitle(item)}
                </button>
              ))}
              {overflow > 0 ? <span className='px-1 text-xs text-muted-foreground'>+{overflow} more</span> : null}
            </div>
          );
        })}
      </div>
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
