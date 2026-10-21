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

type Point = { x: number; y: number };

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

  // dnd-kit stops every click on the document for 50ms after a drag ends, which would swallow the clicks of the next test.
  const CLICK_GUARD_MS = 50;
  let clickGuardEndsAt = 0;

  async function cleanup() {
    captureCalls.length = 0;
    captured = false;
    await reactMount.cleanup();
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, clickGuardEndsAt - Date.now())));
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

  // happy-dom computes no layout, so the grid gets the geometry of a browser: day columns of 100px side by side with
  // the top at 0 and 48px per hour, and the events at the place their style gives them.
  const HOUR_HEIGHT = 48;
  const DAY_WIDTH = 100;
  const EVENT_INSET = 2;

  /** The `clientY` of a pointer that is `minute` minutes after the start of the day of a column. */
  const yAtMinute = (minute: number) => (minute / 60) * HOUR_HEIGHT;

  const rectOf = (left: number, top: number, width: number, height: number) => () =>
    new DOMRect(left, top, width, height);

  function giveColumnsGeometry(): void {
    const columns = [...document.querySelectorAll<HTMLElement>('[data-slot="calendar-day-column"]')];
    columns.forEach((column, index) => {
      column.getBoundingClientRect = rectOf(index * DAY_WIDTH, 0, DAY_WIDTH, 24 * HOUR_HEIGHT);
      for (const block of column.querySelectorAll<HTMLElement>('button[data-event]')) {
        block.getBoundingClientRect = rectOf(
          index * DAY_WIDTH + EVENT_INSET,
          Number.parseFloat(block.style.top),
          DAY_WIDTH - 2 * EVENT_INSET,
          Number.parseFloat(block.style.height),
        );
      }
    });
    const grid = document.querySelector<HTMLElement>('[data-slot="calendar-day-columns"]');
    if (grid) grid.getBoundingClientRect = rectOf(0, 0, columns.length * DAY_WIDTH, 24 * HOUR_HEIGHT);
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

  const SETTLE_MS = 20;
  const settle = () => new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

  function dragPointerEvent(type: string, target: EventTarget, { x, y }: Point) {
    const event = new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
    Object.defineProperty(event, 'isPrimary', { value: true });
    target.dispatchEvent(event);
  }

  /** A point on the event, where a pointer picks it up. */
  function eventPoint(id: string): Point {
    giveColumnsGeometry();
    const block = eventBlock(id);
    if (!block) throw new Error(`No event ${id}`);
    const { left, top } = block.getBoundingClientRect();
    return { x: left + 10, y: top + 10 };
  }

  /**
   * Presses the pointer on an event and moves it through `path` as dnd-kit reads it: the sensor starts the drag at the
   * first move over its distance and follows the pointer from the next one.
   */
  async function holdEvent(id: string, path: Point[]) {
    const start = eventPoint(id);
    const block = eventBlock(id) as HTMLElement;
    await act(async () => {
      dragPointerEvent('pointerdown', block, start);
    });
    for (const point of [{ x: start.x, y: start.y + 8 }, ...path]) {
      await act(async () => {
        dragPointerEvent('pointermove', document, point);
        await settle();
      });
    }
  }

  async function dropEvent(at: Point) {
    clickGuardEndsAt = Date.now() + CLICK_GUARD_MS;
    await act(async () => {
      dragPointerEvent('pointerup', document, at);
      await settle();
    });
  }

  /** Drags an event by `by` pixels and drops it there. */
  async function dragEventBy(id: string, by: Point) {
    const start = eventPoint(id);
    const end = { x: start.x + by.x, y: start.y + by.y };
    await holdEvent(id, [end]);
    await dropEvent(end);
  }

  /** The translation the event is drawn with while it is dragged. */
  function translationOf(id: string): Point {
    const match = /translate3d\((-?[\d.]+)px, (-?[\d.]+)px/.exec(eventBlock(id)?.style.transform ?? '');
    return { x: Number(match?.[1] ?? 0), y: Number(match?.[2] ?? 0) };
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
    eventPoint,
    holdEvent,
    dropEvent,
    dragEventBy,
    translationOf,
    captureCalls,
  };
}
