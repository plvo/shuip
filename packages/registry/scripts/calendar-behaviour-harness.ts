import type { ComponentType, ReactNode } from 'react';
import type { Root } from 'react-dom/client';

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

export type MountOptions = {
  view: CalendarView;
  editable?: boolean;
  withSlotSelect?: boolean;
};

export const VARIANTS = ['Radix', 'Base UI'] as const;
export type Variant = (typeof VARIANTS)[number];

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
 * through React's tree. The suite installs the DOM and the canonical aliases, then calls `load` before it mounts.
 */
export function createCalendarHarness() {
  const roots: Root[] = [];
  const originalConsoleError = console.error;
  let act: typeof import('react').act;
  let createElement: typeof import('react').createElement;
  let createPortal: typeof import('react-dom').createPortal;
  let createRoot: typeof import('react-dom/client').createRoot;

  /** Loads React once the DOM is installed. */
  async function load(): Promise<void> {
    ({ act, createElement } = await import('react'));
    ({ createPortal } = await import('react-dom'));
    ({ createRoot } = await import('react-dom/client'));
  }

  async function cleanup(): Promise<void> {
    await act(async () => {
      for (const root of roots.splice(0)) root.unmount();
    });
    document.body.innerHTML = '';
    console.error = originalConsoleError;
  }

  async function mount(Calendar: CalendarComponent, { view, editable = false, withSlotSelect = false }: MountOptions) {
    const calendar = {
      eventClicks: [] as CalendarEvent[],
      slots: [] as CalendarSlot[],
      portalClicks: [] as string[],
      errors: [] as unknown[][],
    };
    console.error = (...args: unknown[]) => {
      calendar.errors.push(args);
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
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(
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
      );
    });
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
