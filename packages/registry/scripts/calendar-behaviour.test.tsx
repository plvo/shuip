import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import {
  ALL_DAY_EVENT,
  type CalendarComponent,
  type CalendarEvent,
  type CalendarView,
  createCalendarHarness,
  RESIZABLE_EVENT,
  TIMED_EVENT,
} from './calendar-behaviour-harness';
import { installDom, resolveCanonicalAliases } from './dom-environment';
import { VARIANTS, type Variant } from './react-mount';
import { useTimeZone } from './time-zone';

const harness = createCalendarHarness();
const {
  mount,
  eventLabel,
  eventBlock,
  portalMenu,
  click,
  resizeHandle,
  drawnHeight,
  dayColumn,
  showsOverlay,
  overlayRange,
  yAtMinute,
  pointer,
  captureCalls,
} = harness;
const calendars = {} as Record<Variant, CalendarComponent>;
let uninstallDom: () => Promise<void>;

// The browser and the components are loaded here, not at the top of the file, so that no other test file sees them.
beforeAll(async () => {
  uninstallDom = installDom();
  resolveCanonicalAliases(/calendar\/component\.radix\.tsx$/);
  await harness.load();
  const radix = await import('../items/blocks/calendar/component.radix');
  const base = await import('../generated/base/items/blocks/calendar/component.base');
  calendars.Radix = { ...radix.Calendar, useCalendar: radix.useCalendar } as unknown as CalendarComponent;
  calendars['Base UI'] = { ...base.Calendar, useCalendar: base.useCalendar } as unknown as CalendarComponent;
});

afterAll(async () => {
  await uninstallDom();
});

afterEach(harness.cleanup);

type EventPlace = {
  name: string;
  view: CalendarView;
  editable: boolean;
  withSlotSelect: boolean;
  event: CalendarEvent;
  /** Whether a click on the event ends at the event, which the cell around it must not see as its own. */
  stopsClick: boolean;
};

const EVENT_PLACES: EventPlace[] = [
  { name: 'time grid', view: 'week', editable: false, withSlotSelect: false, event: TIMED_EVENT, stopsClick: false },
  {
    name: 'editable time grid',
    view: 'week',
    editable: true,
    withSlotSelect: true,
    event: TIMED_EVENT,
    stopsClick: false,
  },
  { name: 'all-day row', view: 'week', editable: false, withSlotSelect: false, event: ALL_DAY_EVENT, stopsClick: true },
  {
    name: 'editable all-day row',
    view: 'week',
    editable: true,
    withSlotSelect: true,
    event: ALL_DAY_EVENT,
    stopsClick: true,
  },
  { name: 'month pill', view: 'month', editable: false, withSlotSelect: false, event: TIMED_EVENT, stopsClick: false },
  {
    name: 'editable month pill',
    view: 'month',
    editable: true,
    withSlotSelect: true,
    event: TIMED_EVENT,
    stopsClick: true,
  },
  { name: 'agenda row', view: 'agenda', editable: false, withSlotSelect: false, event: TIMED_EVENT, stopsClick: false },
];

const cellsOf = (slot: string) => [...document.querySelectorAll(`[data-slot="${slot}"]`)];

describe.each(VARIANTS)('calendar on %s', (variant) => {
  describe.each(EVENT_PLACES)('$name', ({ view, editable, withSlotSelect, event, stopsClick }) => {
    test('ignores a click that bubbles from a portal of renderEvent and lets it go on', async () => {
      const calendar = await mount(calendars[variant], { view, editable, withSlotSelect });
      await click(portalMenu(event.id));
      expect(calendar.portalClicks).toEqual([event.id]);
      expect(calendar.eventClicks).toEqual([]);
      expect(calendar.ancestorClicks).toBe(1);
      expect(calendar.slots).toEqual([]);
      expect(calendar.errors).toEqual([]);
    });

    test('opens the event on a click on the event', async () => {
      const calendar = await mount(calendars[variant], { view, editable, withSlotSelect });
      await click(eventLabel(event.id));
      expect(calendar.eventClicks).toEqual([event]);
      expect(calendar.portalClicks).toEqual([]);
      expect(calendar.ancestorClicks).toBe(stopsClick ? 0 : 1);
      expect(calendar.slots).toEqual([]);
      expect(calendar.errors).toEqual([]);
    });
  });

  describe('editable month cell', () => {
    const cellOfDay = (day: string) =>
      cellsOf('calendar-month-cell').find((cell) => cell.firstElementChild?.textContent === day) ?? null;

    test('without onSlotSelect shows no pointer cursor, no hover tint and emits nothing', async () => {
      const calendar = await mount(calendars[variant], { view: 'month', editable: true });
      const cell = cellOfDay('15');
      expect(cell?.className).not.toContain('cursor-pointer');
      expect(cell?.className).not.toContain('hover:bg-accent');
      await click(cell);
      expect(calendar.slots).toEqual([]);
    });

    test('with onSlotSelect emits the all-day slot of a click on the cell', async () => {
      const calendar = await mount(calendars[variant], { view: 'month', editable: true, withSlotSelect: true });
      const cell = cellOfDay('15');
      expect(cell?.className).toContain('cursor-pointer');
      await click(cell);
      expect(calendar.slots).toEqual([{ start: new Date(2026, 2, 15), end: new Date(2026, 2, 16), allDay: true }]);
    });
  });

  describe('editable day column', () => {
    // The week of CALENDAR_DATE starts on a Monday: the third column is the Wednesday, the second holds TIMED_EVENT.
    const wednesday = () => dayColumn(2);
    const at = (hours: number, minutes: number) => hours * 60 + minutes;
    const wednesdayAt = (hours: number, minutes: number, until: Date) => ({
      start: new Date(2026, 2, 11, hours, minutes),
      end: until,
      allDay: false,
    });

    test('emits nothing for a right press and release on an empty part of the column', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true, withSlotSelect: true });
      await pointer('pointerdown', wednesday(), yAtMinute(at(9, 53)), 2);
      expect(showsOverlay()).toBe(false);
      await pointer('pointerup', wednesday(), yAtMinute(at(9, 53)), 2);
      expect(calendar.slots).toEqual([]);
    });

    test('emits nothing and shows no overlay for a press inside a portal of renderEvent', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true, withSlotSelect: true });
      const menu = portalMenu(TIMED_EVENT.id);
      if (!menu) throw new Error('No portal menu');
      await pointer('pointerdown', menu, yAtMinute(at(10, 30)));
      expect(showsOverlay()).toBe(false);
      await pointer('pointerup', menu, yAtMinute(at(10, 30)));
      expect(calendar.slots).toEqual([]);
    });

    test('clears the overlay on a pointer cancel without emitting, and the next press starts fresh', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true, withSlotSelect: true });
      await pointer('pointerdown', wednesday(), yAtMinute(at(9, 53)));
      await pointer('pointermove', wednesday(), yAtMinute(at(11, 0)));
      expect(showsOverlay()).toBe(true);
      expect(captureCalls).toEqual(['set']);
      await pointer('pointercancel', wednesday(), yAtMinute(at(11, 0)));
      expect(captureCalls).toEqual(['set', 'release']);
      expect(showsOverlay()).toBe(false);
      expect(calendar.slots).toEqual([]);
      await pointer('pointerdown', wednesday(), yAtMinute(at(14, 20)));
      await pointer('pointerup', wednesday(), yAtMinute(at(14, 20)));
      expect(calendar.slots).toEqual([wednesdayAt(14, 15, new Date(2026, 2, 11, 15, 15))]);
    });

    test('draws the range it will emit while the pointer moves', async () => {
      await mount(calendars[variant], { view: 'week', editable: true, withSlotSelect: true });
      await pointer('pointerdown', wednesday(), yAtMinute(at(9, 53)));
      expect(overlayRange()).toEqual({ startMin: at(9, 45), endMin: at(10, 45) });
      await pointer('pointermove', wednesday(), yAtMinute(at(11, 0)));
      expect(overlayRange()).toEqual({ startMin: at(9, 45), endMin: at(11, 0) });
      await pointer('pointermove', wednesday(), yAtMinute(at(9, 0)));
      expect(overlayRange()).toEqual({ startMin: at(9, 0), endMin: at(10, 0) });
    });

    test('gives a click the hour from the slot under the press', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true, withSlotSelect: true });
      await pointer('pointerdown', wednesday(), yAtMinute(at(9, 53)));
      await pointer('pointerup', wednesday(), yAtMinute(at(9, 53)));
      expect(calendar.slots).toEqual([wednesdayAt(9, 45, new Date(2026, 2, 11, 10, 45))]);
      expect(calendar.errors).toEqual([]);
    });

    test('includes the slot under the press on a drag down and on a drag up', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true, withSlotSelect: true });
      await pointer('pointerdown', wednesday(), yAtMinute(at(9, 53)));
      await pointer('pointermove', wednesday(), yAtMinute(at(11, 0)));
      await pointer('pointerup', wednesday(), yAtMinute(at(11, 0)));
      await pointer('pointerdown', wednesday(), yAtMinute(at(9, 53)));
      await pointer('pointermove', wednesday(), yAtMinute(at(9, 0)));
      await pointer('pointerup', wednesday(), yAtMinute(at(9, 0)));
      expect(calendar.slots).toEqual([
        wednesdayAt(9, 45, new Date(2026, 2, 11, 11, 0)),
        wednesdayAt(9, 0, new Date(2026, 2, 11, 10, 0)),
      ]);
    });
  });

  describe('editable day column within the day', () => {
    const wednesday = () => dayColumn(2);
    const at = (hours: number, minutes: number) => hours * 60 + minutes;

    test('ends a click at 23:50 at the end of the day', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true, withSlotSelect: true });
      await pointer('pointerdown', wednesday(), yAtMinute(at(23, 50)));
      expect(overlayRange()).toEqual({ startMin: at(23, 45), endMin: at(24, 0) });
      await pointer('pointerup', wednesday(), yAtMinute(at(23, 50)));
      expect(calendar.slots).toEqual([
        { start: new Date(2026, 2, 11, 23, 45), end: new Date(2026, 2, 12, 0, 0), allDay: false },
      ]);
    });

    test('ends a creation dragged below the column at the end of the day', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true, withSlotSelect: true });
      await pointer('pointerdown', wednesday(), yAtMinute(at(23, 10)));
      await pointer('pointermove', wednesday(), yAtMinute(at(26, 0)));
      await pointer('pointerup', wednesday(), yAtMinute(at(26, 0)));
      expect(calendar.slots).toEqual([
        { start: new Date(2026, 2, 11, 23, 0), end: new Date(2026, 2, 12, 0, 0), allDay: false },
      ]);
    });

    test('starts a creation dragged above the top at 00:00 of the same day', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true, withSlotSelect: true });
      await pointer('pointerdown', wednesday(), yAtMinute(at(0, 20)));
      await pointer('pointermove', wednesday(), yAtMinute(-at(1, 0)));
      await pointer('pointerup', wednesday(), yAtMinute(-at(1, 0)));
      expect(calendar.slots).toEqual([
        { start: new Date(2026, 2, 11, 0, 0), end: new Date(2026, 2, 11, 0, 30), allDay: false },
      ]);
    });
  });

  describe('editable day column on a day with 25 hours', () => {
    useTimeZone('Europe/Paris');

    test('creates at the hour of the press', async () => {
      const calendar = await mount(calendars[variant], {
        view: 'day',
        editable: true,
        withSlotSelect: true,
        events: [],
        date: new Date(2026, 9, 25),
      });
      await pointer('pointerdown', dayColumn(0), yAtMinute(23 * 60));
      await pointer('pointerup', dayColumn(0), yAtMinute(23 * 60));
      expect(calendar.slots).toEqual([
        { start: new Date(2026, 9, 25, 23, 0), end: new Date(2026, 9, 26, 0, 0), allDay: false },
      ]);
    });
  });

  describe('editable all-day cell', () => {
    // The week of CALENDAR_DATE starts on a Monday, so the third cell is the Wednesday after the event.
    const wednesdayCell = () => cellsOf('calendar-all-day-cell')[2] ?? null;

    test('with onSlotSelect emits the all-day slot of a click on an empty cell', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true, withSlotSelect: true });
      await click(wednesdayCell());
      expect(calendar.slots).toEqual([{ start: new Date(2026, 2, 11), end: new Date(2026, 2, 12), allDay: true }]);
    });

    test('without onSlotSelect emits nothing', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true });
      await click(wednesdayCell());
      expect(calendar.slots).toEqual([]);
    });
  });

  describe('resize handle', () => {
    const HOUR = 48;
    const mountResizable = () => mount(calendars[variant], { view: 'week', editable: true, events: [RESIZABLE_EVENT] });

    test('leaves the end of an event alone on a tap and emits nothing', async () => {
      const calendar = await mountResizable();
      const handle = resizeHandle(RESIZABLE_EVENT.id) as HTMLElement;
      const height = drawnHeight(RESIZABLE_EVENT.id);
      await pointer('pointerdown', handle, 100);
      await pointer('pointerup', handle, 100);
      expect(calendar.changes).toEqual([]);
      expect(drawnHeight(RESIZABLE_EVENT.id)).toBe(height);
      expect(calendar.errors).toEqual([]);
    });

    test('resizes and emits once on a drag of more than half a snap step', async () => {
      const calendar = await mountResizable();
      const handle = resizeHandle(RESIZABLE_EVENT.id) as HTMLElement;
      const height = drawnHeight(RESIZABLE_EVENT.id);
      await pointer('pointerdown', handle, 100);
      await pointer('pointermove', handle, 100 + HOUR);
      expect(drawnHeight(RESIZABLE_EVENT.id)).not.toBe(height);
      await pointer('pointerup', handle, 100 + HOUR);
      expect(calendar.changes).toEqual([[{ ...RESIZABLE_EVENT, end: new Date(2026, 2, 10, 11, 0) }]]);
      expect(calendar.errors).toEqual([]);
    });

    // The pointer is captured by the handle, which a mouse click follows; a touch click goes to what lies under the finger.
    test('opens nothing when the click of a touch resize reaches the event', async () => {
      const calendar = await mountResizable();
      const handle = resizeHandle(RESIZABLE_EVENT.id) as HTMLElement;
      await pointer('pointerdown', handle, 100);
      await pointer('pointermove', handle, 108);
      await pointer('pointerup', handle, 108);
      await click(eventBlock(RESIZABLE_EVENT.id));
      expect(calendar.changes).toEqual([[{ ...RESIZABLE_EVENT, end: new Date(2026, 2, 10, 10, 15) }]]);
      expect(calendar.eventClicks).toEqual([]);
      await click(eventBlock(RESIZABLE_EVENT.id));
      expect(calendar.eventClicks).toEqual([RESIZABLE_EVENT]);
      expect(calendar.errors).toEqual([]);
    });

    test('opens nothing when the click of a mouse resize reaches the handle, then opens on the next click', async () => {
      const calendar = await mountResizable();
      const handle = resizeHandle(RESIZABLE_EVENT.id) as HTMLElement;
      await pointer('pointerdown', handle, 100);
      await pointer('pointerup', handle, 100 + HOUR);
      await click(handle);
      expect(calendar.changes).toHaveLength(1);
      expect(calendar.eventClicks).toEqual([]);
      await click(eventBlock(RESIZABLE_EVENT.id));
      expect(calendar.eventClicks).toEqual([RESIZABLE_EVENT]);
    });

    test('opens the event on a press and click after a resize that was followed by no click', async () => {
      const calendar = await mountResizable();
      const handle = resizeHandle(RESIZABLE_EVENT.id) as HTMLElement;
      await pointer('pointerdown', handle, 100);
      await pointer('pointerup', handle, 100 + 4 * HOUR);
      const block = eventBlock(RESIZABLE_EVENT.id) as HTMLElement;
      await pointer('pointerdown', block, 10);
      await pointer('pointerup', block, 10);
      await click(block);
      expect(calendar.eventClicks).toEqual([RESIZABLE_EVENT]);
    });

    test('stops a resize dragged below the grid at the end of the day', async () => {
      const calendar = await mount(calendars[variant], {
        view: 'week',
        editable: true,
        events: [{ ...RESIZABLE_EVENT, start: new Date(2026, 2, 10, 23, 0), end: new Date(2026, 2, 10, 23, 45) }],
      });
      const handle = resizeHandle(RESIZABLE_EVENT.id) as HTMLElement;
      await pointer('pointerdown', handle, 100);
      await pointer('pointerup', handle, 100 + 3 * HOUR);
      expect(calendar.changes[0]?.[0]?.end).toEqual(new Date(2026, 2, 11, 0, 0));
    });

    test('ignores a press of a button other than the main one', async () => {
      const calendar = await mountResizable();
      const handle = resizeHandle(RESIZABLE_EVENT.id) as HTMLElement;
      const height = drawnHeight(RESIZABLE_EVENT.id);
      await pointer('pointerdown', handle, 100, 2);
      await pointer('pointermove', handle, 100 + HOUR, 2);
      expect(drawnHeight(RESIZABLE_EVENT.id)).toBe(height);
      await pointer('pointerup', handle, 100 + HOUR, 2);
      expect(calendar.changes).toEqual([]);
      expect(captureCalls).toEqual([]);
      expect(calendar.errors).toEqual([]);
    });

    test('removes the preview and emits nothing on pointercancel', async () => {
      const calendar = await mountResizable();
      const handle = resizeHandle(RESIZABLE_EVENT.id) as HTMLElement;
      const height = drawnHeight(RESIZABLE_EVENT.id);
      await pointer('pointerdown', handle, 100);
      await pointer('pointermove', handle, 100 + HOUR);
      expect(drawnHeight(RESIZABLE_EVENT.id)).not.toBe(height);
      expect(captureCalls).toEqual(['set']);
      await pointer('pointercancel', handle, 100 + HOUR);
      expect(captureCalls).toEqual(['set', 'release']);
      expect(drawnHeight(RESIZABLE_EVENT.id)).toBe(height);
      await pointer('pointermove', handle, 100 + 2 * HOUR);
      await pointer('pointerup', handle, 100 + 2 * HOUR);
      expect(drawnHeight(RESIZABLE_EVENT.id)).toBe(height);
      expect(calendar.changes).toEqual([]);
      expect(calendar.errors).toEqual([]);
    });
  });

  describe('resizeEvent of useCalendar', () => {
    test('emits nothing when the end is the current end, and once when it differs', async () => {
      const calendar = await mount(calendars[variant], { view: 'week', editable: true, events: [RESIZABLE_EVENT] });
      await calendar.resizeEvent(RESIZABLE_EVENT.id, new Date(RESIZABLE_EVENT.end));
      expect(calendar.changes).toEqual([]);
      const end = new Date(2026, 2, 10, 11, 0);
      await calendar.resizeEvent(RESIZABLE_EVENT.id, end);
      expect(calendar.changes).toEqual([[{ ...RESIZABLE_EVENT, end }]]);
      expect(calendar.errors).toEqual([]);
    });
  });
});
