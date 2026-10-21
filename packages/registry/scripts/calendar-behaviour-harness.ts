import type { ComponentType, ReactNode } from 'react';
import { createReactMount } from './react-mount';

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  [key: string]: unknown;
};

type CalendarSlot = { start: Date; end: Date; allDay: boolean };

type CalendarRootProps = {
  children: ReactNode;
  events: CalendarEvent[];
  idField: string;
  titleField: string;
  startField: string;
  endField: string;
  allDayField: string;
  renderEvent: (item: CalendarEvent) => ReactNode;
  view: string;
  date: Date;
  editable: boolean;
  onEventClick: (item: CalendarEvent) => void;
  onSlotSelect?: (range: CalendarSlot) => void;
};

export type CalendarComponent = {
  Root: ComponentType<CalendarRootProps>;
  View: ComponentType<Record<string, never>>;
};

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

type MountOptions = {
  view: CalendarView;
  editable?: boolean;
  withSlotSelect?: boolean;
};

// A Tuesday in the middle of a month, so that every view shows the events below.
const CALENDAR_DATE = new Date(2026, 2, 10);

export const TIMED_EVENT: CalendarEvent = {
  id: 'timed',
  title: 'Timed',
  start: new Date(2026, 2, 10, 10, 0),
  end: new Date(2026, 2, 10, 11, 0),
  allDay: false,
};

export const ALL_DAY_EVENT: CalendarEvent = {
  id: 'all-day',
  title: 'All day',
  start: new Date(2026, 2, 10),
  end: new Date(2026, 2, 11),
  allDay: true,
};

/**
 * The drive of a calendar in a DOM without a layout engine. Every event is rendered by `renderEvent` with a menu
 * mounted in a portal on `document.body`, the way a dropdown does, so a click in that menu reaches the event only
 * through React's tree. A `div` around the calendar counts the clicks that reach it, to tell a click a handler let
 * pass from one it stopped. The suite installs the DOM and the canonical aliases, then calls `load` before it mounts.
 */
export function createCalendarHarness() {
  const reactMount = createReactMount();
  let act: typeof import('react').act;
  let createElement: typeof import('react').createElement;
  let createPortal: typeof import('react-dom').createPortal;

  /** Loads React once the DOM is installed. */
  async function load(): Promise<void> {
    ({ act, createElement } = await reactMount.load());
    ({ createPortal } = await import('react-dom'));
  }

  const { cleanup } = reactMount;

  async function mount(Calendar: CalendarComponent, { view, editable = false, withSlotSelect = false }: MountOptions) {
    const { errors, render } = reactMount.mount();
    const calendar = {
      eventClicks: [] as CalendarEvent[],
      slots: [] as CalendarSlot[],
      portalClicks: [] as string[],
      ancestorClicks: 0,
      errors,
    };
    const renderEvent = (item: CalendarEvent) =>
      createElement(
        'span',
        { 'data-event-label': item.id },
        item.title,
        createPortal(
          createElement(
            'button',
            { type: 'button', 'data-portal-menu': item.id, onClick: () => calendar.portalClicks.push(item.id) },
            'Menu',
          ),
          document.body,
        ),
      );
    await render(
      createElement(
        'div',
        { onClick: () => calendar.ancestorClicks++ },
        createElement(
          Calendar.Root,
          {
            events: [TIMED_EVENT, ALL_DAY_EVENT],
            idField: 'id',
            titleField: 'title',
            startField: 'start',
            endField: 'end',
            allDayField: 'allDay',
            renderEvent,
            view,
            date: CALENDAR_DATE,
            editable,
            onEventClick: (item: CalendarEvent) => calendar.eventClicks.push(item),
            onSlotSelect: withSlotSelect ? (range: CalendarSlot) => calendar.slots.push(range) : undefined,
          } as Omit<CalendarRootProps, 'children'> as CalendarRootProps,
          createElement(Calendar.View, {}),
        ),
      ),
    );
    return calendar;
  }

  const eventLabel = (id: string) => document.querySelector<HTMLElement>(`[data-event-label="${id}"]`);

  const portalMenu = (id: string) => document.querySelector<HTMLElement>(`[data-portal-menu="${id}"]`);

  async function click(element: Element | null) {
    if (!element) throw new Error('Nothing to click');
    await act(async () => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
  }

  return { load, cleanup, mount, eventLabel, portalMenu, click };
}
