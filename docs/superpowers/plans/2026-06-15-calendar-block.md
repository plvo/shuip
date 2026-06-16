# Calendar Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a generic `Calendar<T>` registry block with Month/Week/Day/Agenda views, drag-to-move, resize, drag-to-create, and a responsive week→day fallback — written from scratch on the shuip stack (no react-big-calendar, no moment).

**Architecture:** One published `component.tsx` (registry blocks publish a single file; the anti-circular rule forbids `component.tsx` from importing `@/components/ui/shuip/*`). The file is organized into internal sub-components: date helpers → `useIsMobile` → state plumbing → `CalendarToolbar` → `MonthView` → `TimeGridView` (week/day) → `AgendaView` → `EventBlock`. Field-mapping + hybrid-state API mirrors the existing `kanban` block. Move uses dnd-kit; resize and drag-to-create use native pointer handlers.

**Tech Stack:** React 19, TypeScript 6, Tailwind v4, shadcn primitives (`button`, `select`, `dialog`, `input`), `date-fns` (catalog), `@dnd-kit/core` + `@dnd-kit/utilities` (catalog). No new dependency.

**Testing note:** No test runner is configured in this repo. Verification per task = `bun registry:generate` (when the item folder changes), `bunx fumadocs-mdx` (when collections/content change), and `cd apps/docs && bunx tsc --noEmit` for the type gate, plus visual rendering of the examples in `bun dev:docs`. `bun build:docs` is the final end-to-end gate (use `NODE_OPTIONS=--max-old-space-size=6144` if it OOMs).

**Reference patterns (read before starting):**
- `packages/registry/items/blocks/kanban/component.tsx` — generic `<T>` + hybrid state + dnd-kit usage.
- `packages/registry/items/blocks/kanban/default.example.tsx` — example import via stub alias.
- `apps/docs/content/blocks/kanban.mdx` — block doc shape.
- `CLAUDE.md` "Registry Items" + "Blocks doc flow" sections.

---

## File Structure

- **Create** `packages/registry/items/blocks/calendar/component.tsx` — the entire calendar.
- **Create** `packages/registry/items/blocks/calendar/default.example.tsx` — full demo: sample events + create/edit dialog.
- **Create** `packages/registry/items/blocks/calendar/views.example.tsx` — controlled view switch, read-only (no `editable`).
- **Create** `apps/docs/content/blocks/calendar.mdx` — block doc (NOT `index.mdx`).
- **Modify** `apps/docs/content/blocks/meta.json` — only if explicit page order needs `calendar` (it uses `"..."` glob, so likely no change; verify).
- **Auto-generated, do not hand-edit:** `registry.json`, `stubs/blocks/calendar/*`, `apps/docs/public/r/calendar*.json`.

---

## Task 1: Scaffold item + types + static skeleton

Get the item recognized by the generator and rendering a placeholder, so the registry/docs pipeline is wired before adding logic.

**Files:**
- Create: `packages/registry/items/blocks/calendar/component.tsx`
- Create: `packages/registry/items/blocks/calendar/default.example.tsx`
- Create: `apps/docs/content/blocks/calendar.mdx`

- [ ] **Step 1: Create `component.tsx` with types + a static skeleton**

```tsx
'use client';

import * as React from 'react';
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
```

- [ ] **Step 2: Create `default.example.tsx` importing via the stub alias**

Blocks import via `@/components/block/shuip/<name>` (flat — stubs are emitted at `stubs/blocks/<name>.tsx`, e.g. `kanban/default.example.tsx` uses `@/components/block/shuip/kanban`). Confirmed against the existing kanban example and `apps/docs/tsconfig.json`.

```tsx
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
```

- [ ] **Step 3: Create `apps/docs/content/blocks/calendar.mdx` (block doc, not index.mdx)**

```mdx
---
title: Calendar
description: A generic, responsive calendar with month, week, day, and agenda views, driven by your typed event model.
registryName: calendar
---

import { TypeTable } from 'fumadocs-ui/components/type-table';

`Calendar` is a generic calendar (`Calendar<T>`) that renders any array of typed events. The
event id, title, start, end, and all-day fields are mapped against your own data shape.

## Examples

<ItemExamples registryName={'calendar'} />
```

- [ ] **Step 4: Generate + verify the item is picked up**

Run: `bun registry:generate`
Expected: console shows `[generate] N items processed` with N one higher than before; `packages/registry/stubs/blocks/calendar/` now exists; `registry.json` contains a `calendar` entry.

- [ ] **Step 5: Regenerate fumadocs types + typecheck**

Run: `cd apps/docs && bunx fumadocs-mdx && bunx tsc --noEmit`
Expected: no errors except the known harmless `baseUrl` TS5101 deprecation.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/items/blocks/calendar apps/docs/content/blocks/calendar.mdx packages/registry/registry.json packages/registry/__index__.ts packages/registry/stubs apps/docs/content/blocks/.gitignore
git status   # verify only intended files; then add any other generated files shown
git commit -m "feat(calendar): scaffold generic calendar block"
```

---

## Task 2: Date helpers, hybrid state, toolbar

**Files:**
- Modify: `packages/registry/items/blocks/calendar/component.tsx`

- [ ] **Step 1: Add date helpers (top of file, after imports)**

Import from `date-fns` and write small local helpers. Use these consistently everywhere.

```tsx
import {
  addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, startOfDay, startOfMonth, startOfWeek,
} from 'date-fns';

const SNAP_MINUTES = 15;
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;

function snapToMinutes(date: Date, minutes = SNAP_MINUTES): Date {
  const ms = minutes * 60_000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

function minutesSinceDayStart(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
```

- [ ] **Step 2: Add a `useControllableState` helper**

Generic controlled/uncontrolled state used for `events`, `view`, and `date`.

```tsx
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
```

- [ ] **Step 3: Wire state inside `Calendar` and compute the field accessors**

```tsx
const {
  events, defaultEvents = [] as T[], onEventsChange,
  idField = 'id' as keyof T, titleField, startField, endField, allDayField,
  color, renderEvent,
  view: viewProp, defaultView = 'month', onViewChange,
  date: dateProp, defaultDate, onDateChange,
  views = ['month', 'week', 'day', 'agenda'] as CalendarView[],
  weekStartsOn = 1, editable = false,
  onEventClick, onSlotSelect, className,
} = props;

const [items, setItems] = useControllableState<T[]>(events, defaultEvents, onEventsChange);
const [view, setView] = useControllableState<CalendarView>(viewProp, defaultView, onViewChange);
const [date, setDate] = useControllableState<Date>(dateProp, defaultDate ?? startOfDay(new Date()), onDateChange);

const getStart = React.useCallback((it: T) => it[startField] as unknown as Date, [startField]);
const getEnd = React.useCallback((it: T) => it[endField] as unknown as Date, [endField]);
const getTitle = React.useCallback((it: T) => String(it[titleField] ?? ''), [titleField]);
const getId = React.useCallback((it: T) => String(it[idField]), [idField]);
const isAllDay = React.useCallback((it: T) => (allDayField ? Boolean(it[allDayField]) : false), [allDayField]);
```

- [ ] **Step 4: Add `CalendarToolbar` sub-component + the period label**

Build a `periodLabel` from `view` + `date` (e.g. month: `format(date, 'MMMM yyyy')`; week: start–end of week; day: `format(date, 'PPP')`; agenda: same as month). The toolbar renders Today / Back / Next buttons and a view `Select`. Navigation deltas: month → `addMonths(±1)`, week → `addDays(±7)`, day/agenda → `addDays(±1)`.

```tsx
function CalendarToolbar({
  label, views, view, onView, onToday, onPrev, onNext,
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
        <Button variant='outline' size='sm' onClick={onToday}>Today</Button>
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
          <SelectTrigger className='w-32' size='sm'><SelectValue /></SelectTrigger>
          <SelectContent>
            {views.map((v) => (
              <SelectItem key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
```

Add the imports this introduces: `Button` from `@/components/ui/button`; `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from `@/components/ui/select`; `ChevronLeft, ChevronRight` from `lucide-react`.

- [ ] **Step 5: Render the toolbar + a per-view switch in `Calendar`**

Replace the placeholder return with the toolbar plus a `switch (view)` that renders `null` per branch for now (filled in later tasks).

- [ ] **Step 6: Verify the navigation deltas helper**

Confirm `bunx tsc --noEmit` passes in `apps/docs`, then `bun dev:docs` and open the calendar example: Today/Back/Next change the label, the view select switches the (still-empty) body.

- [ ] **Step 7: Commit**

```bash
git add packages/registry/items/blocks/calendar/component.tsx
git commit -m "feat(calendar): date helpers, hybrid state, toolbar"
```

---

## Task 3: Month view

**Files:**
- Modify: `packages/registry/items/blocks/calendar/component.tsx`

- [ ] **Step 1: Compute the visible month grid**

```tsx
function monthGrid(date: Date, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn });
  return eachDayOfInterval({ start, end });
}
```

- [ ] **Step 2: Add `MonthView` sub-component**

Render a 7-column grid. For each day cell: day number (muted if `!isSameMonth(day, date)`), then events whose start falls on that day, sorted by start. Show at most 3 pills; if more, render a `+N more` button. Each pill calls `onEventClick(item)`. Pill color via `colorClasses(color?.(item))` (a small map from `CalendarEventColor` to token classes, e.g. `primary → bg-primary text-primary-foreground`, `blue → bg-blue-500 text-white`, etc.). Empty cells with `editable` call `onSlotSelect({ start: startOfDay(day), end: addDays(startOfDay(day),1), allDay:true })` on click.

```tsx
function colorClasses(c?: CalendarEventColor): string {
  switch (c) {
    case 'blue': return 'bg-blue-500 text-white';
    case 'green': return 'bg-green-600 text-white';
    case 'red': return 'bg-red-500 text-white';
    case 'amber': return 'bg-amber-500 text-black';
    default: return 'bg-primary text-primary-foreground';
  }
}
```

(Note for the implementer: literal color utilities like `bg-blue-500` must survive Tailwind scanning — they are static strings here, so they will. Do not build class names dynamically by concatenation.)

- [ ] **Step 3: Wire `MonthView` into the `view` switch**

- [ ] **Step 4: Verify**

`bunx tsc --noEmit` in `apps/docs`, then visually: month grid shows the current month, sample events appear as pills on the correct day, `+N more` appears when >3 events share a day.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/items/blocks/calendar/component.tsx
git commit -m "feat(calendar): month view"
```

---

## Task 4: Time grid (week + day) with all-day band

**Files:**
- Modify: `packages/registry/items/blocks/calendar/component.tsx`

- [ ] **Step 1: Add geometry constants + event-position math**

```tsx
const HOUR_HEIGHT = 48; // px per hour

function eventTop(start: Date): number {
  return (minutesSinceDayStart(start) / 60) * HOUR_HEIGHT;
}
function eventHeight(start: Date, end: Date): number {
  const mins = Math.max(15, (end.getTime() - start.getTime()) / 60_000);
  return (mins / 60) * HOUR_HEIGHT;
}
```

- [ ] **Step 2: Add overlap layout for a single day's timed events**

Group overlapping events into columns so they sit side by side. Minimal algorithm: sort by start; greedily assign each event the first column whose last event ends at/before this event's start; track the max columns in each overlap cluster; width = `100% / columns`, left = `colIndex * width`.

```tsx
type LaidOut<T> = { item: T; col: number; cols: number };

function layoutDay<T>(dayEvents: T[], getStart: (t: T) => Date, getEnd: (t: T) => Date): LaidOut<T>[] {
  const sorted = [...dayEvents].sort((a, b) => getStart(a).getTime() - getStart(b).getTime());
  const colEnds: number[] = [];
  const placed = sorted.map((item) => {
    const s = getStart(item).getTime();
    let col = colEnds.findIndex((end) => end <= s);
    if (col === -1) { col = colEnds.length; colEnds.push(0); }
    colEnds[col] = getEnd(item).getTime();
    return { item, col };
  });
  const cols = Math.max(1, colEnds.length);
  return placed.map((p) => ({ ...p, cols }));
}
```

(Implementer note: this uses a single cluster-wide column count for simplicity — acceptable for the block. Per-cluster width refinement is a non-goal.)

- [ ] **Step 3: Add `TimeGridView` sub-component**

Props: `days: Date[]` (7 for week, 1 for day), plus the accessors and callbacks. Layout:
- An all-day band row at top: for each day, render all-day events (`isAllDay(item)` or events spanning ≥24h) as full-width pills.
- A scrollable body (`max-h-[600px] overflow-y-auto`) containing:
  - A left gutter column of hour labels (`00:00`…`23:00`), each `h-[HOUR_HEIGHT]px`.
  - One column per day. Each column is `relative`; hour lines drawn with a repeating border. Timed events absolutely positioned via `eventTop`/`eventHeight` and `layoutDay` for left/width.
- Each event block calls `onEventClick(item)` on click; render `getTitle(item)` + time range; color via `colorClasses`.

Keep the event block as a small `EventBlock` sub-component (reused by resize/move tasks).

- [ ] **Step 4: Wire `TimeGridView` into the `view` switch for `week` (days = full week) and `day` (days = [date])**

```tsx
const weekDays = React.useMemo(
  () => eachDayOfInterval({ start: startOfWeek(date, { weekStartsOn }), end: endOfWeek(date, { weekStartsOn }) }),
  [date, weekStartsOn],
);
```

- [ ] **Step 5: Verify**

`bunx tsc --noEmit`, then visually: week view shows 7 day columns with hour rows; sample events sit at the right time and overlap side-by-side; day view shows one column.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/items/blocks/calendar/component.tsx
git commit -m "feat(calendar): week and day time grid"
```

---

## Task 5: Agenda view

**Files:**
- Modify: `packages/registry/items/blocks/calendar/component.tsx`

- [ ] **Step 1: Add `AgendaView` sub-component**

List events from `date` forward for ~30 days, grouped by day. For each day with events: a day header (`format(day, 'EEEE, MMM d')`) then rows of `time — title`. Each row calls `onEventClick(item)`. Empty state: a muted "No events" line. Full-width layout (naturally responsive).

```tsx
const agendaDays = React.useMemo(
  () => eachDayOfInterval({ start: startOfDay(date), end: addDays(startOfDay(date), 29) }),
  [date],
);
```

- [ ] **Step 2: Wire into the `view` switch**

- [ ] **Step 3: Verify**

`bunx tsc --noEmit`, then visually: switching to Agenda lists upcoming events grouped by day.

- [ ] **Step 4: Commit**

```bash
git add packages/registry/items/blocks/calendar/component.tsx
git commit -m "feat(calendar): agenda view"
```

---

## Task 6: Responsive week→day fallback

**Files:**
- Modify: `packages/registry/items/blocks/calendar/component.tsx`

- [ ] **Step 1: Add an SSR-safe `useIsMobile` hook**

```tsx
function useIsMobile(breakpoint = 768): boolean {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    [breakpoint],
  );
  const getSnapshot = React.useCallback(() => window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches, [breakpoint]);
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
```

- [ ] **Step 2: Use it to coerce week→day on mobile**

```tsx
const isMobile = useIsMobile();
const effectiveView = isMobile && view === 'week' ? 'day' : view;
```

Render the switch on `effectiveView`. When `effectiveView === 'day'`, `TimeGridView` gets `days={[date]}`. Navigation deltas: base the prev/next delta on `effectiveView` (so a mobile "week" navigates by day). The view `Select` still shows the user's chosen `view`.

- [ ] **Step 3: Verify**

`bunx tsc --noEmit`, then in `bun dev:docs` resize the viewport narrow (<768px) with Week selected → it renders a single navigable day, no horizontal overflow. Widen → returns to 7 columns.

- [ ] **Step 4: Commit**

```bash
git add packages/registry/items/blocks/calendar/component.tsx
git commit -m "feat(calendar): responsive week-to-day fallback"
```

---

## Task 7: Move events (dnd-kit)

**Files:**
- Modify: `packages/registry/items/blocks/calendar/component.tsx`

- [ ] **Step 1: Gate on `editable`; wrap views in `DndContext`**

Import `DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, useDraggable, useDroppable` from `@dnd-kit/core` and `CSS` from `@dnd-kit/utilities`. Add a `PointerSensor` with `activationConstraint: { distance: 6 }` (so clicks still fire `onEventClick`).

- [ ] **Step 2: Make `EventBlock` draggable when `editable`**

Use `useDraggable({ id: getId(item) })`. Apply `CSS.Translate.toString(transform)`. On drag start, stop the click from also firing edit (guard with a ref set on drag, cleared on click).

- [ ] **Step 3: Make day columns / month cells droppable + compute the new time**

For the time grid: each day column is a `useDroppable` with `data: { day }`. On `onDragEnd`, read the drop column's `day` and convert the pointer's Y offset within the column to minutes (`(offsetY / HOUR_HEIGHT) * 60`), snap via `snapToMinutes`, set the new `start`, keep duration (`end = start + (oldEnd - oldStart)`). For month: droppable per day cell; moving shifts the date keeping the clock time. Emit the updated array through `setItems` (which calls `onEventsChange`).

```tsx
function moveEvent<T>(item: T, newStart: Date, getStart: (t: T) => Date, getEnd: (t: T) => Date, startField: keyof T, endField: keyof T): T {
  const duration = getEnd(item).getTime() - getStart(item).getTime();
  return { ...item, [startField]: newStart, [endField]: new Date(newStart.getTime() + duration) };
}
```

- [ ] **Step 4: Verify**

`bunx tsc --noEmit`, then visually: with `editable`, drag an event to another time/day in week view → it snaps and stays the same duration; a plain click still opens edit (fires `onEventClick`).

- [ ] **Step 5: Commit**

```bash
git add packages/registry/items/blocks/calendar/component.tsx
git commit -m "feat(calendar): drag to move events"
```

---

## Task 8: Resize events (native pointer)

**Files:**
- Modify: `packages/registry/items/blocks/calendar/component.tsx`

- [ ] **Step 1: Add a bottom resize handle to `EventBlock` (time grid only, when `editable`)**

A 6px-tall absolutely-positioned bottom strip with `cursor-ns-resize`. On `pointerdown`: capture the pointer, record start Y and the event's original `end`. On `pointermove`: `deltaMinutes = (currentY - startY) / HOUR_HEIGHT * 60`, compute `newEnd = snapToMinutes(originalEnd + deltaMinutes)`, clamp so `newEnd - start >= 15min`; update local "resizing" state for live preview. On `pointerup`: commit via `setItems` with `{ ...item, [endField]: newEnd }`, release capture. `stopPropagation` so it doesn't trigger drag or click.

- [ ] **Step 2: Render the live preview height during resize**

While resizing this item, override its `eventHeight` from the in-progress `newEnd`.

- [ ] **Step 3: Verify**

`bunx tsc --noEmit`, then visually: drag the bottom edge of an event down/up → its end time changes, snaps to 15 min, never shrinks below 15 min; release persists it (state updates / `onEventsChange` fires).

- [ ] **Step 4: Commit**

```bash
git add packages/registry/items/blocks/calendar/component.tsx
git commit -m "feat(calendar): resize events"
```

---

## Task 9: Drag-to-create (native pointer)

**Files:**
- Modify: `packages/registry/items/blocks/calendar/component.tsx`

- [ ] **Step 1: Add pointer handlers to the empty area of each day column (time grid, when `editable`)**

On `pointerdown` on column background (not on an event): record start Y → start time. On `pointermove`: compute current time, render a provisional translucent block between the two. On `pointerup`: build `{ start, end }` (snap both; ensure `end > start` by at least 15 min), call `onSlotSelect({ start, end, allDay: false })`, clear the provisional block. A simple click without drag selects a default 1-hour slot at the clicked time.

- [ ] **Step 2: Month empty-cell click already calls `onSlotSelect` (Task 3) — confirm it still works alongside dnd droppable (guard the click when a drag just happened).**

- [ ] **Step 3: Verify**

`bunx tsc --noEmit`, then visually: drag across empty time in week view → a provisional block follows; release → `onSlotSelect` fires with the dragged range (verify via the example dialog in Task 10).

- [ ] **Step 4: Commit**

```bash
git add packages/registry/items/blocks/calendar/component.tsx
git commit -m "feat(calendar): drag to create slots"
```

---

## Task 10: Examples, docs, full build

**Files:**
- Modify: `packages/registry/items/blocks/calendar/default.example.tsx`
- Create: `packages/registry/items/blocks/calendar/views.example.tsx`
- Modify: `apps/docs/content/blocks/calendar.mdx`

- [ ] **Step 1: Flesh out `default.example.tsx` with a create/edit dialog**

State holds `events` (controlled via `events` + `onEventsChange`) and a `draft` (the event being created/edited or null). `onEventClick` sets the draft to that event + opens the dialog; `onSlotSelect` sets a new draft with the selected range + opens the dialog. The dialog (shadcn `Dialog`) has `Input`s for title and a color `Select`, plus Save (upsert into events) and Delete. Keep it compact but real.

```tsx
'use client';

import * as React from 'react';
import { Calendar, type CalendarEventColor } from '@/components/block/shuip/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Event = { id: string; title: string; start: Date; end: Date; color?: CalendarEventColor };

// ...seed events with `at(h)` helper as in Task 1...
// ...draft state, upsert/delete handlers, Dialog with title Input + Save/Delete...

export default function Example() {
  // controlled events + onEventsChange + dialog wiring
  return (
    <>
      <Calendar<Event> events={/* state */ []} onEventsChange={/* setter */ () => {}}
        titleField='title' startField='start' endField='end'
        color={(e) => e.color} defaultView='week' editable
        onEventClick={/* open edit */ () => {}}
        onSlotSelect={/* open create */ () => {}} />
      {/* Dialog */}
    </>
  );
}
```

(Implementer: write the full, working version — controlled state, `upsert`, `remove`, and the dialog body. This skeleton shows the wiring contract; do not ship placeholders.)

- [ ] **Step 2: Create `views.example.tsx` — read-only, controlled view switch**

A `Calendar` without `editable`, with `defaultView='agenda'` and a small set of events, to show the non-interactive case.

- [ ] **Step 3: Update `calendar.mdx` — add a "Built-in features" bullet list + `## Props` `<TypeTable>`**

Mirror `kanban.mdx`: a `### Built-in features` list (views, generic data model, hybrid state, drag/resize/create, responsive week→day) before `## Examples`, and a `## Props` section with `<TypeTable>` describing the main props.

- [ ] **Step 4: Regenerate everything**

Run: `bun registry:generate`
Expected: `[generate] N items processed`; new `*.example.tsx` keys appear (`calendar.example`, `calendar.views.example`).

Run: `cd apps/docs && bunx fumadocs-mdx`

- [ ] **Step 5: Full type + build gate**

Run: `cd apps/docs && bunx tsc --noEmit` (ignore the TS5101 baseUrl note)
Run: `NODE_OPTIONS=--max-old-space-size=6144 bun build:docs`
Expected: build succeeds; `apps/docs/public/r/calendar.json` and the example JSONs exist.

- [ ] **Step 6: Visual pass in `bun dev:docs`**

Confirm all four views render, the responsive week→day fallback works, and create/edit/move/resize work through the example dialog.

- [ ] **Step 7: Commit**

```bash
git add packages/registry/items/blocks/calendar apps/docs/content/blocks/calendar.mdx packages/registry/registry.json packages/registry/__index__.ts packages/registry/stubs apps/docs/public/r
git status   # verify; add any other regenerated files shown
git commit -m "feat(calendar): examples, docs, registry artifacts"
```

---

## Self-Review

**Spec coverage:**
- Views Month/Week/Day/Agenda → Tasks 3, 4, 5. ✓
- Navigation + view switch + period label → Task 2. ✓
- Event colors → Task 3 (`colorClasses`), used by all views. ✓
- All-day band → Task 4. ✓
- Create (drag-to-create) → Task 9; edit (`onEventClick`) → wired from Task 3 on. ✓
- Move (dnd-kit) → Task 7; Resize → Task 8. ✓
- Generic `Calendar<T>` + hybrid state → Tasks 1–2. ✓
- Responsive week→day → Task 6. ✓
- Single published file → all tasks modify only `component.tsx` for the component. ✓
- Default example dialog (replaceable) → Task 10. ✓
- date-fns + dnd-kit, no new dep → Tasks 2, 7. ✓
- Validation via generate + build, no test runner added → every task. ✓

**Type consistency:** `getStart`/`getEnd`/`getId`/`getTitle`/`isAllDay` accessors defined in Task 2 are reused in 3–9. `moveEvent`, `layoutDay`, `eventTop`, `eventHeight`, `snapToMinutes`, `colorClasses`, `useIsMobile`, `useControllableState` are each defined once and referenced consistently. `effectiveView` (Task 6) drives the render switch and the nav delta.

**Resolved verification risk:** block examples import via `@/components/block/shuip/calendar` (flat stub at `stubs/blocks/calendar.tsx`) — confirmed against `kanban/default.example.tsx` and `apps/docs/tsconfig.json`.
