import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import {
  ALL_DAY_EVENT,
  type CalendarComponent,
  type CalendarEvent,
  type CalendarView,
  createCalendarHarness,
  TIMED_EVENT,
  VARIANTS,
  type Variant,
} from './calendar-behaviour-harness';
import { installDom, resolveCanonicalAliases } from './dom-environment';

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
};

const EVENT_PLACES: EventPlace[] = [
  { name: 'time grid', view: 'week', editable: false, withSlotSelect: false, event: TIMED_EVENT },
  { name: 'editable time grid', view: 'week', editable: true, withSlotSelect: true, event: TIMED_EVENT },
  { name: 'all-day row', view: 'week', editable: true, withSlotSelect: true, event: ALL_DAY_EVENT },
  { name: 'month pill', view: 'month', editable: false, withSlotSelect: false, event: TIMED_EVENT },
  { name: 'editable month pill', view: 'month', editable: true, withSlotSelect: true, event: TIMED_EVENT },
  { name: 'agenda row', view: 'agenda', editable: false, withSlotSelect: false, event: TIMED_EVENT },
];

describe.each(VARIANTS)('calendar on %s', (variant) => {
  describe.each(EVENT_PLACES)('$name', ({ view, editable, withSlotSelect, event }) => {
    test('ignores a click that bubbles from a portal of renderEvent', async () => {
      const calendar = await mount(calendars[variant], { view, editable, withSlotSelect });
      await click(portalMenu(event.id));
      expect(calendar.portalClicks).toEqual([event.id]);
      expect(calendar.eventClicks).toEqual([]);
      expect(calendar.slots).toEqual([]);
      expect(calendar.errors).toEqual([]);
    });

    test('opens the event on a click on the event', async () => {
      const calendar = await mount(calendars[variant], { view, editable, withSlotSelect });
      await click(eventLabel(event.id));
      expect(calendar.eventClicks).toEqual([event]);
      expect(calendar.portalClicks).toEqual([]);
      expect(calendar.slots).toEqual([]);
      expect(calendar.errors).toEqual([]);
    });
  });

  describe('editable month cell', () => {
    const cellOfDay = (day: string) =>
      [...document.querySelectorAll('span')].find((span) => span.textContent === day)?.parentElement ?? null;

    test('without onSlotSelect shows no pointer cursor and no hover tint', async () => {
      await mount(calendars[variant], { view: 'month', editable: true });
      const cell = cellOfDay('15');
      expect(cell?.className).not.toContain('cursor-pointer');
      expect(cell?.className).not.toContain('hover:bg-accent');
    });

    test('with onSlotSelect emits the all-day slot of a click on the cell', async () => {
      const calendar = await mount(calendars[variant], { view: 'month', editable: true, withSlotSelect: true });
      const cell = cellOfDay('15');
      expect(cell?.className).toContain('cursor-pointer');
      await click(cell);
      expect(calendar.slots).toEqual([{ start: new Date(2026, 2, 15), end: new Date(2026, 2, 16), allDay: true }]);
    });
  });
});
