# Calendar Block — Design

Date: 2026-06-15
Status: Approved (pending spec review)

## Goal

Ship a `calendar` registry block: a full-featured calendar inspired by the feature set of
common shadcn calendar projects, but written from scratch against the shuip stack
(React 19, Tailwind v4, shadcn primitives). No `react-big-calendar`, no `moment` — both
because they bloat the install and because `react-big-calendar`'s fixed-width week grid is
the exact reason the reference is unusable on mobile.

The week view MUST be responsive: below a breakpoint it falls back to the day view.

## Feature set

1. **Views**: Month, Week, Day, Agenda.
2. **Navigation**: Today / Back / Next, plus a period label.
3. **View switcher**: Month / Week / Day / Agenda (restrictable via `views`).
4. **Event colors**: per-event color mapped onto shuip theme tokens.
5. **All-day events**: rendered in a band above the time grid.
6. **Create**: drag-to-create on an empty slot (week/day) → `onSlotSelect`.
7. **Edit**: click an event → `onEventClick` (consumer renders its own UI).
8. **Move**: drag an event (dnd-kit). Time grid snaps to 15 min keeping duration; month moves the day.
9. **Resize**: drag the bottom handle of an event (week/day) to change `end`.
10. **Light/dark**: free via existing tokens.

Interaction scope: drag/resize/drag-to-create apply to **week/day** only. Month supports
day-to-day move. Agenda is read + click.

## Constraint: single published file

Registry blocks publish exactly one `component.tsx` (the anti-circular rule forbids
`component.tsx` from importing `@/components/ui/shuip/*`, and `extras/` install elsewhere).
So the whole calendar lives in `component.tsx`, organized into internal sub-components:
`CalendarToolbar`, `MonthView`, `TimeGridView` (week/day), `AgendaView`, `EventBlock`,
plus date helpers. This is a large file (~800–1000 lines) by nature.

## API — generic `Calendar<T>`

Mirrors the kanban field-mapping + hybrid-state pattern.

```ts
type CalendarView = 'month' | 'week' | 'day' | 'agenda';
type CalendarEventColor = 'primary' | 'blue' | 'green' | 'red' | 'amber';

type CalendarProps<T extends Record<string, unknown>> = {
  // data (hybrid: controlled via events+onEventsChange, or standalone via defaultEvents)
  events?: T[];
  defaultEvents?: T[];
  onEventsChange?: (next: T[]) => void;

  // field mapping (start/end fields hold Date values)
  idField?: keyof T;        // default 'id'
  titleField: keyof T;
  startField: keyof T;
  endField: keyof T;
  allDayField?: keyof T;
  color?: (item: T) => CalendarEventColor | undefined;
  renderEvent?: (item: T) => React.ReactNode;

  // view + focused date (each controllable or standalone)
  view?: CalendarView;
  defaultView?: CalendarView;
  onViewChange?: (v: CalendarView) => void;
  date?: Date;
  defaultDate?: Date;
  onDateChange?: (d: Date) => void;

  views?: CalendarView[];            // default: all four
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  editable?: boolean;                // gate drag/resize/create

  // interaction callbacks
  onEventClick?: (item: T) => void;                                  // edit
  onSlotSelect?: (range: { start: Date; end: Date; allDay: boolean }) => void; // create

  className?: string;
};
```

On any move/resize, the component emits the next array via `onEventsChange` (and updates
internal state when uncontrolled). The consumer maps that to persistence. As with kanban,
`T` must be a `type` (not `interface`) to satisfy `T extends Record<string, unknown>`.

## Editing UI

The block imposes no editing UI. It emits `onEventClick` (edit) and `onSlotSelect` (create).
The **default example** wires a simple shadcn `Dialog` (title + start/end + color) to
demonstrate create/edit — fully replaceable by the consumer.

## Interactions

- **Move**: `dnd-kit` (`DndContext` + pointer/keyboard sensors), already used by kanban.
  Time grid → snap start to 15 min keeping duration; month → reassign the day.
- **Resize**: native pointer handlers on the event's bottom handle (week/day) → adjust `end`,
  snap to 15 min, clamp to a minimum duration.
- **Drag-to-create**: pointerdown on an empty time slot + drag → provisional range overlay →
  emit `onSlotSelect` on release.

## Responsive (key requirement)

- `useIsMobile` hook: `matchMedia` via `useSyncExternalStore` (SSR-safe).
- Below the breakpoint, the **Week view renders the Day view** for the focused date;
  Back/Next navigate by day. No broken horizontal scroll.
- Time grid scrolls vertically inside a height-bounded container.
- Month cells show "+N more" overflow; Agenda is full-width (naturally responsive).

## Files & deliverables

- `packages/registry/items/blocks/calendar/component.tsx`
- `packages/registry/items/blocks/calendar/default.example.tsx` — full demo + create/edit dialog
- `packages/registry/items/blocks/calendar/views.example.tsx` — controlled view switch / read-only
- `apps/docs/content/blocks/calendar.mdx` — block doc (NOT `index.mdx`; blocks rule)
- Add `calendar` to `apps/docs/content/blocks/meta.json` order if needed
- `registryDependencies` auto-detected from imports: `button`, `select`, `dialog`, `input`
  (and any others used). No new external dep — `date-fns` and `dnd-kit` are already in catalog.

## Validation

- `bun registry:generate` → confirm item count increased.
- `bun build:docs` (the authoritative type gate). No test runner is configured; not adding
  one without approval. Visual check of responsive week→day fallback.

## Non-goals (YAGNI)

- Recurring events, timezones beyond the host's local time, multi-calendar overlay,
  external i18n/locale switching beyond `weekStartsOn`. Can be added later if needed.
