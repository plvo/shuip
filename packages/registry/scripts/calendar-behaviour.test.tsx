import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import {
  ALL_DAY_EVENT,
  type CalendarComponent,
  type CalendarEvent,
  type CalendarView,
  createCalendarHarness,
  TIMED_EVENT,
} from './calendar-behaviour-harness';
import { installDom, resolveCanonicalAliases } from './dom-environment';
import { VARIANTS, type Variant } from './react-mount';

const harness = createCalendarHarness();
const { mount, eventLabel, portalMenu, click } = harness;
const calendars = {} as Record<Variant, CalendarComponent>;
let uninstallDom: () => Promise<void>;

// The browser and the components are loaded here, not at the top of the file, so that no other test file sees them.
beforeAll(async () => {
  uninstallDom = installDom();
  resolveCanonicalAliases(/calendar\/component\.radix\.tsx$/);
  await harness.load();
  const radix = await import('../items/blocks/calendar/component.radix');
  const base = await import('../generated/base/items/blocks/calendar/component.base');
  calendars.Radix = radix.Calendar as unknown as CalendarComponent;
  calendars['Base UI'] = base.Calendar as unknown as CalendarComponent;
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
});
