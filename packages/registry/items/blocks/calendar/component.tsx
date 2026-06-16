'use client';

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Locale } from 'date-fns';
import {
  addDays,
  addMinutes,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  setHours,
  setMinutes,
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
export type CalendarEventColor = 'primary' | 'secondary' | 'accent' | 'destructive' | 'muted';
export type CalendarSlot = { start: Date; end: Date; allDay: boolean };

export type CalendarMessages = {
  today: string;
  previous: string;
  next: string;
  allDay: string;
  noEvents: string;
  more: (count: number) => string;
  views: Record<CalendarView, string>;
};

export type CalendarMessagesInput = Partial<Omit<CalendarMessages, 'views'>> & {
  views?: Partial<Record<CalendarView, string>>;
};

const defaultMessages: CalendarMessages = {
  today: 'Today',
  previous: 'Previous',
  next: 'Next',
  allDay: 'all-day',
  noEvents: 'No upcoming events',
  more: (count) => `+${count} more`,
  views: { month: 'Month', week: 'Week', day: 'Day', agenda: 'Agenda' },
};

type CalendarEventLike = Record<string, unknown>;

export type CalendarRootProps<T extends CalendarEventLike> = {
  children: React.ReactNode;

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
  locale?: Locale;
  messages?: CalendarMessagesInput;

  onEventClick?: (item: T) => void;
  onSlotSelect?: (range: CalendarSlot) => void;
};

type CalendarContextValue<T extends CalendarEventLike = CalendarEventLike> = {
  view: CalendarView;
  setView: (v: CalendarView) => void;
  views: CalendarView[];
  date: Date;
  setDate: (d: Date) => void;
  effectiveView: CalendarView;
  isMobile: boolean;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  editable: boolean;
  locale?: Locale;
  messages: CalendarMessages;
  periodLabel: string;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;

  events: T[];
  getId: (item: T) => string;
  getStart: (item: T) => Date;
  getEnd: (item: T) => Date;
  getTitle: (item: T) => string;
  isAllDay: (item: T) => boolean;
  getColor: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;
  onEventClick?: (item: T) => void;
  onSlotSelect?: (range: CalendarSlot) => void;
  resizeEvent: (id: string, end: Date) => void;
  draggedRef: React.MutableRefObject<boolean>;
};

const CalendarContext = React.createContext<CalendarContextValue | null>(null);

export function useCalendar<T extends CalendarEventLike = CalendarEventLike>(): CalendarContextValue<T> {
  const ctx = React.use(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be used within <Calendar.Root>');
  return ctx as CalendarContextValue<T>;
}

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

function useIsMobile(breakpoint = 768): boolean {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    [breakpoint],
  );
  const getSnapshot = React.useCallback(
    () => window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches,
    [breakpoint],
  );
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function CalendarRoot<T extends CalendarEventLike>({
  children,
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
  views = ['month', 'week', 'day', 'agenda'],
  weekStartsOn = 1,
  editable = false,
  locale,
  messages: messagesProp,
  onEventClick,
  onSlotSelect,
}: CalendarRootProps<T>) {
  const messages = React.useMemo<CalendarMessages>(
    () => ({
      ...defaultMessages,
      ...messagesProp,
      views: { ...defaultMessages.views, ...messagesProp?.views },
    }),
    [messagesProp],
  );
  const [view, setView] = useControllableState<CalendarView>(viewProp, defaultView, onViewChange);
  const [date, setDate] = useControllableState<Date>(dateProp, defaultDate ?? startOfDay(new Date()), onDateChange);
  const [items, setItems] = useControllableState<T[]>(events, defaultEvents, onEventsChange);

  const isMobile = useIsMobile();
  const effectiveView = isMobile && view === 'week' ? 'day' : view;
  const draggedRef = React.useRef(false);

  const getStart = React.useCallback((it: T) => it[startField] as unknown as Date, [startField]);
  const getEnd = React.useCallback((it: T) => it[endField] as unknown as Date, [endField]);
  const isAllDay = React.useCallback((it: T) => (allDayField ? Boolean(it[allDayField]) : false), [allDayField]);
  const getId = React.useCallback((it: T) => String(it[idField]), [idField]);
  const getTitle = React.useCallback((it: T) => String(it[titleField] ?? ''), [titleField]);
  const getColor = React.useCallback((it: T) => color?.(it), [color]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = React.useCallback(
    (e: DragEndEvent) => {
      const { active, over, delta } = e;
      draggedRef.current = Math.abs(delta.x) > 4 || Math.abs(delta.y) > 4;
      const id = String(active.id);
      const item = items.find((it) => getId(it) === id);
      if (!item) return;
      const oldStart = getStart(item);
      const oldEnd = getEnd(item);
      const duration = oldEnd.getTime() - oldStart.getTime();
      const overDay = (over?.data.current?.day as Date | undefined) ?? oldStart;

      let newStart: Date;
      if (effectiveView === 'month') {
        newStart = setMinutes(setHours(startOfDay(overDay), oldStart.getHours()), oldStart.getMinutes());
      } else {
        const movedMinutes = minutesSinceDayStart(oldStart) + (delta.y / HOUR_HEIGHT) * 60;
        newStart = snapToMinutes(addMinutes(startOfDay(overDay), movedMinutes));
      }
      if (newStart.getTime() === oldStart.getTime()) return;
      const next = items.map((it) =>
        getId(it) === id
          ? ({ ...it, [startField]: newStart, [endField]: new Date(newStart.getTime() + duration) } as T)
          : it,
      );
      setItems(next);
    },
    [items, getId, getStart, getEnd, effectiveView, startField, endField, setItems],
  );

  const resizeEvent = React.useCallback(
    (id: string, newEnd: Date) => {
      setItems(items.map((it) => (getId(it) === id ? ({ ...it, [endField]: newEnd } as T) : it)));
    },
    [items, getId, endField, setItems],
  );

  const periodLabel = React.useMemo(() => {
    switch (effectiveView) {
      case 'month':
        return format(date, 'MMMM yyyy', { locale });
      case 'week': {
        const weekStart = startOfWeek(date, { weekStartsOn });
        const weekEnd = endOfWeek(date, { weekStartsOn });
        return `${format(weekStart, 'MMM d', { locale })} – ${format(weekEnd, 'MMM d, yyyy', { locale })}`;
      }
      case 'day':
        return format(date, 'PPP', { locale });
      case 'agenda':
        return format(date, 'MMMM yyyy', { locale });
    }
  }, [effectiveView, date, weekStartsOn, locale]);

  const shift = React.useCallback(
    (dir: 1 | -1) => {
      switch (effectiveView) {
        case 'month':
          setDate(addMonths(date, dir));
          break;
        case 'week':
          setDate(addDays(date, 7 * dir));
          break;
        default:
          setDate(addDays(date, dir));
      }
    },
    [effectiveView, date, setDate],
  );

  const goToToday = React.useCallback(() => setDate(startOfDay(new Date())), [setDate]);
  const goToPrevious = React.useCallback(() => shift(-1), [shift]);
  const goToNext = React.useCallback(() => shift(1), [shift]);

  const value = React.useMemo<CalendarContextValue<T>>(
    () => ({
      view,
      setView,
      views,
      date,
      setDate,
      effectiveView,
      isMobile,
      weekStartsOn,
      editable,
      locale,
      messages,
      periodLabel,
      goToToday,
      goToPrevious,
      goToNext,
      events: items,
      getId,
      getStart,
      getEnd,
      getTitle,
      isAllDay,
      getColor,
      renderEvent,
      onEventClick,
      onSlotSelect,
      resizeEvent,
      draggedRef,
    }),
    [
      view,
      setView,
      views,
      date,
      setDate,
      effectiveView,
      isMobile,
      weekStartsOn,
      editable,
      locale,
      messages,
      periodLabel,
      goToToday,
      goToPrevious,
      goToNext,
      items,
      getId,
      getStart,
      getEnd,
      getTitle,
      isAllDay,
      getColor,
      renderEvent,
      onEventClick,
      onSlotSelect,
      resizeEvent,
    ],
  );

  return (
    <CalendarContext.Provider value={value as unknown as CalendarContextValue}>
      {editable ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {children}
        </DndContext>
      ) : (
        children
      )}
    </CalendarContext.Provider>
  );
}

function CalendarNav({ className }: { className?: string }) {
  const { periodLabel, views, view, setView, goToToday, goToPrevious, goToNext, messages } = useCalendar();
  return (
    <div className={cn('flex w-full flex-wrap items-center justify-between gap-2', className)}>
      <div className='flex items-center gap-1'>
        <Button variant='outline' size='sm' onClick={goToToday}>
          {messages.today}
        </Button>
        <Button variant='outline' size='icon' className='size-8' onClick={goToPrevious} aria-label={messages.previous}>
          <ChevronLeft className='size-4' />
        </Button>
        <Button variant='outline' size='icon' className='size-8' onClick={goToNext} aria-label={messages.next}>
          <ChevronRight className='size-4' />
        </Button>
        <span className='ml-2 text-sm font-medium'>{periodLabel}</span>
      </div>
      {views.length > 1 ? (
        <Select value={view} onValueChange={(v) => setView(v as CalendarView)}>
          <SelectTrigger className='w-32' size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {views.map((v) => (
              <SelectItem key={v} value={v}>
                {messages.views[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}

function CalendarViewComponent({ className }: { className?: string }) {
  const {
    effectiveView,
    date,
    weekStartsOn,
    events: items,
    getStart,
    getEnd,
    getId,
    getTitle,
    isAllDay,
    getColor,
    renderEvent,
    editable,
    draggedRef,
    resizeEvent,
    onEventClick,
    onSlotSelect,
    locale,
    messages,
  } = useCalendar();

  const weekDays = React.useMemo(
    () => eachDayOfInterval({ start: startOfWeek(date, { weekStartsOn }), end: endOfWeek(date, { weekStartsOn }) }),
    [date, weekStartsOn],
  );

  const agendaDays = React.useMemo(
    () => eachDayOfInterval({ start: startOfDay(date), end: addDays(startOfDay(date), 29) }),
    [date],
  );

  const body = (() => {
    switch (effectiveView) {
      case 'month':
        return (
          <MonthView
            date={date}
            weekStartsOn={weekStartsOn}
            items={items}
            getStart={getStart}
            getId={getId}
            getTitle={getTitle}
            color={getColor}
            renderEvent={renderEvent}
            editable={editable}
            draggedRef={draggedRef}
            onEventClick={onEventClick}
            onSlotSelect={onSlotSelect}
            locale={locale}
            more={messages.more}
          />
        );
      case 'week':
      case 'day':
        return (
          <TimeGridView
            days={effectiveView === 'week' ? weekDays : [date]}
            items={items}
            getStart={getStart}
            getEnd={getEnd}
            getId={getId}
            getTitle={getTitle}
            isAllDay={isAllDay}
            color={getColor}
            renderEvent={renderEvent}
            editable={editable}
            draggedRef={draggedRef}
            onResize={editable ? resizeEvent : undefined}
            onEventClick={onEventClick}
            onSlotSelect={onSlotSelect}
            locale={locale}
            allDayLabel={messages.allDay}
          />
        );
      case 'agenda':
        return (
          <AgendaView
            days={agendaDays}
            items={items}
            getStart={getStart}
            getEnd={getEnd}
            getId={getId}
            getTitle={getTitle}
            color={getColor}
            renderEvent={renderEvent}
            onEventClick={onEventClick}
            locale={locale}
            noEventsLabel={messages.noEvents}
          />
        );
    }
  })();

  return <div className={cn('w-full', className)}>{body}</div>;
}

export const Calendar = {
  Root: CalendarRoot,
  Nav: CalendarNav,
  View: CalendarViewComponent,
};

function monthGrid(date: Date, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn });
  return eachDayOfInterval({ start, end });
}

const colorClassMap: Record<CalendarEventColor, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  muted: 'bg-muted text-muted-foreground',
};

function colorClasses(c?: CalendarEventColor): string {
  return c ? colorClassMap[c] : colorClassMap.primary;
}

const HOUR_HEIGHT = 48;
const SNAP_MINUTES = 15;

function snapToMinutes(date: Date, minutes = SNAP_MINUTES): Date {
  const ms = minutes * 60_000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

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

function offsetToMinutes(clientY: number, columnEl: HTMLElement): number {
  const rect = columnEl.getBoundingClientRect();
  return ((clientY - rect.top) / HOUR_HEIGHT) * 60;
}

type Creating = { dayIndex: number; startMin: number; endMin: number };

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

function eventBlockStyle(start: Date, end: Date, laidOut: { col: number; cols: number }): React.CSSProperties {
  const widthPct = 100 / laidOut.cols;
  return {
    top: eventTop(start),
    height: eventHeight(start, end),
    left: `${laidOut.col * widthPct}%`,
    width: `calc(${widthPct}% - 2px)`,
  };
}

function EventBlockContent({
  title,
  start,
  end,
  label,
}: {
  title: string;
  start: Date;
  end: Date;
  label?: React.ReactNode;
}) {
  if (label !== undefined) return <>{label}</>;
  return (
    <>
      <span className='block truncate font-medium'>{title}</span>
      <span className='block truncate opacity-80'>
        {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
      </span>
    </>
  );
}

const eventBlockClass = 'absolute z-10 overflow-hidden rounded px-1 py-0.5 text-left text-xs';

function EventBlock({
  title,
  start,
  end,
  label,
  laidOut,
  color,
  onClick,
}: {
  title: string;
  start: Date;
  end: Date;
  label?: React.ReactNode;
  laidOut: { col: number; cols: number };
  color?: CalendarEventColor;
  onClick?: () => void;
}) {
  return (
    <button
      type='button'
      data-event=''
      onClick={onClick}
      style={eventBlockStyle(start, end, laidOut)}
      className={cn(eventBlockClass, colorClasses(color))}
    >
      <EventBlockContent title={title} start={start} end={end} label={label} />
    </button>
  );
}

function DraggableEventBlock({
  id,
  title,
  start,
  end,
  realEnd,
  label,
  laidOut,
  color,
  draggedRef,
  onClick,
  onResize,
  onPreview,
}: {
  id: string;
  title: string;
  start: Date;
  end: Date;
  realEnd: Date;
  label?: React.ReactNode;
  laidOut: { col: number; cols: number };
  color?: CalendarEventColor;
  draggedRef: React.MutableRefObject<boolean>;
  onClick?: () => void;
  onResize?: (id: string, end: Date) => void;
  onPreview: (end: Date | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <button
      type='button'
      data-event=''
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (draggedRef.current) {
          draggedRef.current = false;
          return;
        }
        onClick?.();
      }}
      style={{
        ...eventBlockStyle(start, end, laidOut),
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 40 : undefined,
        touchAction: 'none',
      }}
      className={cn(eventBlockClass, colorClasses(color))}
    >
      <EventBlockContent title={title} start={start} end={end} label={label} />
      <ResizeHandle id={id} start={start} end={realEnd} onResize={onResize} onPreview={onPreview} />
    </button>
  );
}

function ResizeHandle({
  id,
  start,
  end,
  onResize,
  onPreview,
}: {
  id: string;
  start: Date;
  end: Date;
  onResize?: (id: string, end: Date) => void;
  onPreview: (end: Date | null) => void;
}) {
  const handlePointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const startY = e.clientY;
    const originalEnd = end;
    const minEnd = new Date(start.getTime() + SNAP_MINUTES * 60_000);
    let finalEnd = originalEnd;

    const compute = (clientY: number) => {
      const deltaMin = ((clientY - startY) / HOUR_HEIGHT) * 60;
      let proposed = snapToMinutes(new Date(originalEnd.getTime() + deltaMin * 60_000));
      if (proposed.getTime() - start.getTime() < SNAP_MINUTES * 60_000) proposed = minEnd;
      return proposed;
    };

    const onMove = (moveE: PointerEvent) => {
      finalEnd = compute(moveE.clientY);
      onPreview(finalEnd);
    };

    const onUp = (upE: PointerEvent) => {
      finalEnd = compute(upE.clientY);
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      onResize?.(id, finalEnd);
      onPreview(null);
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  };

  return (
    <span
      data-event=''
      className='absolute inset-x-0 bottom-0 z-20 h-1.5 cursor-ns-resize'
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const DAY_MS = 24 * 60 * 60 * 1000;

function CreatingOverlay({ startMin, endMin }: { startMin: number; endMin: number }) {
  const lo = Math.min(startMin, endMin);
  const span = Math.max(15, Math.abs(endMin - startMin));
  return (
    <div
      className='pointer-events-none absolute inset-x-0 z-30 rounded border border-primary bg-primary/30'
      style={{ top: (lo / 60) * HOUR_HEIGHT, height: (span / 60) * HOUR_HEIGHT }}
    />
  );
}

function DayColumnContent<T extends Record<string, unknown>>({
  laidOut,
  getStart,
  getEnd,
  getId,
  getTitle,
  color,
  renderEvent,
  editable,
  draggedRef,
  resizing,
  creatingRange,
  onResize,
  onPreview,
  onEventClick,
}: {
  laidOut: LaidOut<T>[];
  getStart: (item: T) => Date;
  getEnd: (item: T) => Date;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  color?: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;
  editable: boolean;
  draggedRef: React.MutableRefObject<boolean>;
  resizing: { id: string; end: Date } | null;
  creatingRange?: { startMin: number; endMin: number } | null;
  onResize?: (id: string, end: Date) => void;
  onPreview: (preview: { id: string; end: Date } | null) => void;
  onEventClick?: (item: T) => void;
}) {
  return (
    <>
      {HOURS.map((h) => (
        <div key={h} className='h-12 border-t first:border-t-0' />
      ))}
      {creatingRange ? <CreatingOverlay startMin={creatingRange.startMin} endMin={creatingRange.endMin} /> : null}
      {laidOut.map((entry) => {
        const id = getId(entry.item);
        const start = getStart(entry.item);
        const realEnd = getEnd(entry.item);
        const shownEnd = resizing?.id === id ? resizing.end : realEnd;
        const label = renderEvent ? renderEvent(entry.item) : undefined;
        return editable ? (
          <DraggableEventBlock
            key={id}
            id={id}
            title={getTitle(entry.item)}
            start={start}
            end={shownEnd}
            realEnd={realEnd}
            label={label}
            laidOut={entry}
            color={color?.(entry.item)}
            draggedRef={draggedRef}
            onClick={() => onEventClick?.(entry.item)}
            onResize={onResize}
            onPreview={(end) => onPreview(end ? { id, end } : null)}
          />
        ) : (
          <EventBlock
            key={id}
            title={getTitle(entry.item)}
            start={start}
            end={realEnd}
            label={label}
            laidOut={entry}
            color={color?.(entry.item)}
            onClick={() => onEventClick?.(entry.item)}
          />
        );
      })}
    </>
  );
}

const dayColumnClass = 'relative flex-1 border-l first:border-l-0';

function DroppableDayColumn<T extends Record<string, unknown>>({
  day,
  dayIndex,
  creating,
  onCreatingChange,
  onSlotSelect,
  ...content
}: {
  day: Date;
  dayIndex: number;
  creating: Creating | null;
  onCreatingChange: (next: Creating | null) => void;
  onSlotSelect?: (range: CalendarSlot) => void;
  laidOut: LaidOut<T>[];
  getStart: (item: T) => Date;
  getEnd: (item: T) => Date;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  color?: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;
  editable: boolean;
  draggedRef: React.MutableRefObject<boolean>;
  resizing: { id: string; end: Date } | null;
  onResize?: (id: string, end: Date) => void;
  onPreview: (preview: { id: string; end: Date } | null) => void;
  onEventClick?: (item: T) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `col-${day.toISOString()}`, data: { day } });
  const columnRef = React.useRef<HTMLDivElement | null>(null);
  const startMinRef = React.useRef(0);
  const canCreate = Boolean(onSlotSelect);

  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      columnRef.current = node;
    },
    [setNodeRef],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canCreate) return;
    if ((e.target as HTMLElement).closest('[data-event]')) return;
    const columnEl = columnRef.current;
    if (!columnEl) return;
    e.preventDefault();
    columnEl.setPointerCapture(e.pointerId);
    const startMin = offsetToMinutes(e.clientY, columnEl);
    startMinRef.current = startMin;
    onCreatingChange({ dayIndex, startMin, endMin: startMin });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!creating || creating.dayIndex !== dayIndex) return;
    const columnEl = columnRef.current;
    if (!columnEl) return;
    onCreatingChange({ dayIndex, startMin: startMinRef.current, endMin: offsetToMinutes(e.clientY, columnEl) });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!creating || creating.dayIndex !== dayIndex) return;
    const columnEl = columnRef.current;
    if (columnEl?.hasPointerCapture(e.pointerId)) columnEl.releasePointerCapture(e.pointerId);
    let lo = Math.min(creating.startMin, creating.endMin);
    let hi = Math.max(creating.startMin, creating.endMin);
    if (hi - lo < 5) {
      lo = creating.startMin;
      hi = creating.startMin + 60;
    }
    const base = startOfDay(day);
    const start = snapToMinutes(addMinutes(base, lo));
    let end = snapToMinutes(addMinutes(base, hi));
    if (end.getTime() - start.getTime() < SNAP_MINUTES * 60_000) {
      end = new Date(start.getTime() + SNAP_MINUTES * 60_000);
    }
    onCreatingChange(null);
    onSlotSelect?.({ start, end, allDay: false });
  };

  const creatingRange = creating?.dayIndex === dayIndex ? creating : null;

  return (
    <div
      ref={mergedRef}
      className={cn(dayColumnClass, 'cursor-pointer')}
      style={{ height: 24 * HOUR_HEIGHT }}
      onPointerDown={canCreate ? handlePointerDown : undefined}
      onPointerMove={canCreate ? handlePointerMove : undefined}
      onPointerUp={canCreate ? handlePointerUp : undefined}
    >
      <DayColumnContent {...content} creatingRange={creatingRange} />
    </div>
  );
}

function PlainDayColumn<T extends Record<string, unknown>>(content: {
  laidOut: LaidOut<T>[];
  getStart: (item: T) => Date;
  getEnd: (item: T) => Date;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  color?: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;
  editable: boolean;
  draggedRef: React.MutableRefObject<boolean>;
  resizing: { id: string; end: Date } | null;
  onResize?: (id: string, end: Date) => void;
  onPreview: (preview: { id: string; end: Date } | null) => void;
  onEventClick?: (item: T) => void;
}) {
  return (
    <div className={dayColumnClass} style={{ height: 24 * HOUR_HEIGHT }}>
      <DayColumnContent {...content} />
    </div>
  );
}

function TimeGridView<T extends Record<string, unknown>>({
  days,
  items,
  getStart,
  getEnd,
  getId,
  getTitle,
  isAllDay,
  color,
  renderEvent,
  editable,
  draggedRef,
  onResize,
  onEventClick,
  onSlotSelect: selectSlot,
  locale,
  allDayLabel,
}: {
  days: Date[];
  items: T[];
  getStart: (item: T) => Date;
  getEnd: (item: T) => Date;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  isAllDay: (item: T) => boolean;
  color?: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;
  editable: boolean;
  draggedRef: React.MutableRefObject<boolean>;
  onResize?: (id: string, end: Date) => void;
  onEventClick?: (item: T) => void;
  onSlotSelect?: (range: CalendarSlot) => void;
  locale?: Locale;
  allDayLabel: string;
}) {
  const [resizing, setResizing] = React.useState<{ id: string; end: Date } | null>(null);
  const [creating, setCreating] = React.useState<Creating | null>(null);

  const spansAllDay = React.useCallback(
    (item: T) => isAllDay(item) || getEnd(item).getTime() - getStart(item).getTime() >= DAY_MS,
    [isAllDay, getEnd, getStart],
  );

  return (
    <div className='w-full overflow-hidden rounded-md border'>
      <div className='max-h-[600px] overflow-y-auto'>
        <div className='sticky top-0 z-30 bg-background'>
          <div className='flex border-b'>
            <div className='w-14 shrink-0 border-r' />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className='flex-1 border-l p-2 text-center text-xs font-medium first:border-l-0'
              >
                {format(day, 'EEE d', { locale })}
              </div>
            ))}
          </div>

          <div className='flex border-b'>
            <div className='flex w-14 shrink-0 items-center justify-center border-r py-1 text-xs text-muted-foreground'>
              {allDayLabel}
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
                      className={cn(
                        'w-full truncate rounded px-1 py-0.5 text-left text-xs',
                        colorClasses(color?.(item)),
                      )}
                    >
                      {renderEvent ? renderEvent(item) : getTitle(item)}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className='flex'>
          <div className='w-14 shrink-0 border-r'>
            {HOURS.map((h) => (
              <div key={h} className='h-12 pr-1 text-right text-xs text-muted-foreground'>
                {`${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) => {
            const timed = items.filter((item) => !spansAllDay(item) && isSameDay(getStart(item), day));
            const laidOut = layoutDay(timed, getStart, getEnd);
            const columnProps = {
              laidOut,
              getStart,
              getEnd,
              getId,
              getTitle,
              color,
              renderEvent,
              editable,
              draggedRef,
              resizing,
              onResize,
              onPreview: setResizing,
              onEventClick,
            };
            return editable ? (
              <DroppableDayColumn
                key={day.toISOString()}
                day={day}
                dayIndex={dayIndex}
                creating={creating}
                onCreatingChange={setCreating}
                onSlotSelect={selectSlot}
                {...columnProps}
              />
            ) : (
              <PlainDayColumn key={day.toISOString()} {...columnProps} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

const monthPillClass = 'w-full truncate rounded px-1 py-0.5 text-left text-xs';

function MonthEventPill<T>({
  item,
  id,
  title,
  label,
  color,
  draggedRef,
  onEventClick,
}: {
  item: T;
  id: string;
  title: string;
  label?: React.ReactNode;
  color?: CalendarEventColor;
  draggedRef: React.MutableRefObject<boolean>;
  onEventClick?: (item: T) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <button
      type='button'
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        if (draggedRef.current) {
          draggedRef.current = false;
          return;
        }
        onEventClick?.(item);
      }}
      style={{ transform: CSS.Translate.toString(transform), zIndex: isDragging ? 40 : undefined, touchAction: 'none' }}
      className={cn(monthPillClass, colorClasses(color))}
    >
      {label ?? title}
    </button>
  );
}

function MonthCell<T extends Record<string, unknown>>({
  day,
  date,
  visible,
  overflow,
  getId,
  getTitle,
  color,
  renderEvent,
  draggedRef,
  onEventClick,
  onSlotSelect,
  more,
}: {
  day: Date;
  date: Date;
  visible: T[];
  overflow: number;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  color?: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;
  draggedRef: React.MutableRefObject<boolean>;
  onEventClick?: (item: T) => void;
  onSlotSelect?: (range: CalendarSlot) => void;
  more: (count: number) => string;
}) {
  const { setNodeRef } = useDroppable({ id: `cell-${day.toISOString()}`, data: { day } });
  return (
    <div
      ref={setNodeRef}
      className='flex min-h-24 cursor-pointer flex-col gap-1 border-b border-l p-1 hover:bg-accent/50 [&:nth-child(7n+1)]:border-l-0'
      onClick={() => onSlotSelect?.({ start: startOfDay(day), end: addDays(startOfDay(day), 1), allDay: true })}
    >
      <span className={cn('text-xs', !isSameMonth(day, date) && 'text-muted-foreground')}>{format(day, 'd')}</span>
      {visible.map((item) => (
        <MonthEventPill
          key={getId(item)}
          item={item}
          id={getId(item)}
          title={getTitle(item)}
          label={renderEvent ? renderEvent(item) : undefined}
          color={color?.(item)}
          draggedRef={draggedRef}
          onEventClick={onEventClick}
        />
      ))}
      {overflow > 0 ? <span className='px-1 text-xs text-muted-foreground'>{more(overflow)}</span> : null}
    </div>
  );
}

function PlainMonthCell<T extends Record<string, unknown>>({
  day,
  date,
  visible,
  overflow,
  getId,
  getTitle,
  color,
  renderEvent,
  onEventClick,
  more,
}: {
  day: Date;
  date: Date;
  visible: T[];
  overflow: number;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  color?: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;
  onEventClick?: (item: T) => void;
  more: (count: number) => string;
}) {
  return (
    <div className='flex min-h-24 flex-col gap-1 border-b border-l p-1 [&:nth-child(7n+1)]:border-l-0'>
      <span className={cn('text-xs', !isSameMonth(day, date) && 'text-muted-foreground')}>{format(day, 'd')}</span>
      {visible.map((item) => (
        <button
          type='button'
          key={getId(item)}
          className={cn(monthPillClass, colorClasses(color?.(item)))}
          onClick={() => onEventClick?.(item)}
        >
          {renderEvent ? renderEvent(item) : getTitle(item)}
        </button>
      ))}
      {overflow > 0 ? <span className='px-1 text-xs text-muted-foreground'>{more(overflow)}</span> : null}
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
  renderEvent,
  editable,
  draggedRef,
  onEventClick,
  onSlotSelect,
  locale,
  more,
}: {
  date: Date;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  items: T[];
  getStart: (item: T) => Date;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  color?: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;
  editable: boolean;
  draggedRef: React.MutableRefObject<boolean>;
  onEventClick?: (item: T) => void;
  onSlotSelect?: (range: CalendarSlot) => void;
  locale?: Locale;
  more: (count: number) => string;
}) {
  const days = monthGrid(date, weekStartsOn);
  const weekdayLabels = days.slice(0, 7).map((day) => format(day, 'EEE', { locale }));

  return (
    <div className='w-full overflow-hidden rounded-md border'>
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

          return editable ? (
            <MonthCell
              key={day.toISOString()}
              day={day}
              date={date}
              visible={visible}
              overflow={overflow}
              getId={getId}
              getTitle={getTitle}
              color={color}
              renderEvent={renderEvent}
              draggedRef={draggedRef}
              onEventClick={onEventClick}
              onSlotSelect={onSlotSelect}
              more={more}
            />
          ) : (
            <PlainMonthCell
              key={day.toISOString()}
              day={day}
              date={date}
              visible={visible}
              overflow={overflow}
              getId={getId}
              getTitle={getTitle}
              color={color}
              renderEvent={renderEvent}
              onEventClick={onEventClick}
              more={more}
            />
          );
        })}
      </div>
    </div>
  );
}

function AgendaView<T extends Record<string, unknown>>({
  days,
  items,
  getStart,
  getEnd,
  getId,
  getTitle,
  color,
  renderEvent,
  onEventClick,
  locale,
  noEventsLabel,
}: {
  days: Date[];
  items: T[];
  getStart: (item: T) => Date;
  getEnd: (item: T) => Date;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  color?: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;
  onEventClick?: (item: T) => void;
  locale?: Locale;
  noEventsLabel: string;
}) {
  const groups = days
    .map((day) => ({
      day,
      events: items
        .filter((item) => isSameDay(getStart(item), day))
        .sort((a, b) => getStart(a).getTime() - getStart(b).getTime()),
    }))
    .filter((group) => group.events.length > 0);

  if (groups.length === 0) {
    return <p className='w-full text-sm text-muted-foreground'>{noEventsLabel}</p>;
  }

  return (
    <div className='flex max-h-[600px] w-full flex-col gap-4 overflow-y-auto'>
      {groups.map((group) => (
        <div key={group.day.toISOString()} className='flex flex-col gap-1'>
          <div className='text-sm font-medium'>{format(group.day, 'EEEE, MMM d', { locale })}</div>
          {group.events.map((item) => (
            <button
              type='button'
              key={getId(item)}
              onClick={() => onEventClick?.(item)}
              className='flex w-full items-center gap-2 text-left text-sm'
            >
              <span className={cn('size-2 rounded-full', colorClasses(color?.(item)))} />
              <span className='text-muted-foreground'>
                {format(getStart(item), 'HH:mm')} – {format(getEnd(item), 'HH:mm')}
              </span>
              <span>{renderEvent ? renderEvent(item) : getTitle(item)}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
