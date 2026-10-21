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
  onEventsChange: (next: CalendarEvent[]) => void;
};

export type CalendarComponent = {
  Root: ComponentType<CalendarRootProps>;
  View: ComponentType<Record<string, never>>;
  useCalendar: () => { resizeEvent: (id: string, end: Date) => void };
};

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

type MountOptions = {
  view: CalendarView;
  editable?: boolean;
  withSlotSelect?: boolean;
  events?: CalendarEvent[];
  date?: Date;
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

// Ends off the 15-minute grid, so that a tap on the resize handle has an end to leave alone.
export const RESIZABLE_EVENT: CalendarEvent = {
  id: 'resizable',
  title: 'Resizable',
  start: new Date(2026, 2, 10, 9, 0),
  end: new Date(2026, 2, 10, 10, 7),
  allDay: false,
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

  const captureCalls: string[] = [];
  let captured = false;

  async function cleanup() {
    captureCalls.length = 0;
    captured = false;
    await reactMount.cleanup();
  }

  async function mount(
    Calendar: CalendarComponent,
    {
      view,
      editable = false,
      withSlotSelect = false,
      events = [TIMED_EVENT, ALL_DAY_EVENT],
      date = CALENDAR_DATE,
    }: MountOptions,
  ) {
    const { errors, render } = reactMount.mount();
    const calendar = {
      eventClicks: [] as CalendarEvent[],
      slots: [] as CalendarSlot[],
      changes: [] as CalendarEvent[][],
      /** Resizes an event the way a consumer does, through `useCalendar` in a child of the root. */
      resizeEvent: async (id: string, end: Date) => {
        await act(async () => {
          context?.resizeEvent(id, end);
        });
      },
      portalClicks: [] as string[],
      ancestorClicks: 0,
      errors,
    };
    let context: ReturnType<CalendarComponent['useCalendar']> | undefined;
    const ContextReader = () => {
      context = Calendar.useCalendar();
      return null;
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
            events,
            idField: 'id',
            titleField: 'title',
            startField: 'start',
            endField: 'end',
            allDayField: 'allDay',
            renderEvent,
            view,
            date,
            editable,
            onEventClick: (item: CalendarEvent) => calendar.eventClicks.push(item),
            onEventsChange: (next: CalendarEvent[]) => calendar.changes.push(next),
            onSlotSelect: withSlotSelect ? (range: CalendarSlot) => calendar.slots.push(range) : undefined,
          } as Omit<CalendarRootProps, 'children'> as CalendarRootProps,
          createElement(Calendar.View, {}),
          createElement(ContextReader),
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

  const eventBlock = (id: string) => eventLabel(id)?.closest('button') ?? null;

  const resizeHandle = (id: string) =>
    eventBlock(id)?.querySelector<HTMLElement>('[data-slot="calendar-resize-handle"]') ?? null;

  /** The height the grid draws for the event. */
  const drawnHeight = (id: string) => eventBlock(id)?.style.height;

  // happy-dom computes no layout, so the day columns get the geometry of the grid: top at 0 and 48px per hour.
  const HOUR_HEIGHT = 48;

  /** The `clientY` of a pointer that is `minute` minutes after the start of the day of a column. */
  const yAtMinute = (minute: number) => (minute / 60) * HOUR_HEIGHT;

  function giveColumnsGeometry(): void {
    for (const column of document.querySelectorAll<HTMLElement>('[data-slot="calendar-day-column"]')) {
      column.getBoundingClientRect = () => new DOMRect(0, 0, 100, 24 * HOUR_HEIGHT);
    }
  }

  /** The day column of the time grid at `index`. */
  function dayColumn(index: number): HTMLElement {
    const column = document.querySelectorAll<HTMLElement>('[data-slot="calendar-day-column"]')[index];
    if (!column) throw new Error(`No day column at ${index}`);
    return column;
  }

  const showsOverlay = () => document.querySelector('[data-slot="calendar-creating-overlay"]') !== null;

  /** The range the overlay draws, in minutes after the start of the day. */
  function overlayRange(): { startMin: number; endMin: number } {
    const overlay = document.querySelector<HTMLElement>('[data-slot="calendar-creating-overlay"]');
    if (!overlay) throw new Error('No overlay');
    const startMin = (Number.parseFloat(overlay.style.top) / HOUR_HEIGHT) * 60;
    return { startMin, endMin: startMin + (Number.parseFloat(overlay.style.height) / HOUR_HEIGHT) * 60 };
  }

  /**
   * Pointer events with a chosen `clientY` and button, which is all the resize handle and the day columns read. The
   * DOM does not implement capture, so the target gets stand-ins that log into `captureCalls` and answer
   * `hasPointerCapture` for the pointer they hold.
   */
  async function pointer(
    type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
    target: Element,
    y: number,
    button = 0,
  ) {
    giveColumnsGeometry();
    target.setPointerCapture = () => {
      captured = true;
      captureCalls.push('set');
    };
    target.releasePointerCapture = () => {
      captured = false;
      captureCalls.push('release');
    };
    target.hasPointerCapture = () => captured;
    await act(async () => {
      target.dispatchEvent(
        new PointerEvent(type, { bubbles: true, cancelable: true, clientY: y, pointerId: 1, button }),
      );
    });
  }

  return {
    load,
    cleanup,
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
  };
}
