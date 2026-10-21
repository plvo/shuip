import type { ComponentType, ReactNode } from 'react';
import { createPointerDriver, type Point } from './dnd-pointer';
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

export const HOUR_HEIGHT = 48;
export const DAY_WIDTH = 100;

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

  // dnd-kit stops every click on the document for 50ms after a drag ends, which would swallow the clicks that follow.
  const DND_CLICK_GUARD_MS = 50;
  const CLICK_GUARD_MARGIN_MS = 10;
  let clickGuardEndsAt = 0;

  const startClickGuard = () => {
    clickGuardEndsAt = Date.now() + DND_CLICK_GUARD_MS + CLICK_GUARD_MARGIN_MS;
  };

  /** Waits until dnd-kit lets the clicks of the document through again. */
  const outwaitClickGuard = () =>
    new Promise((resolve) => setTimeout(resolve, Math.max(0, clickGuardEndsAt - Date.now())));

  async function cleanup() {
    captureCalls.length = 0;
    captured = false;
    await reactMount.cleanup();
    await outwaitClickGuard();
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
      /** The fields of the value `useCalendar` returns. */
      contextKeys: () => Object.keys(context ?? {}),
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

  // happy-dom computes no layout, so the grids get the geometry of a browser: day columns of 100px side by side with
  // the top at 0 and 48px per hour, or month cells of 100px, and the events at the place their style gives them.
  const EVENT_INSET = 2;
  const MONTH_CELL_HEIGHT = 100;
  const MONTH_PILL_TOP = 20;
  const MONTH_PILL_HEIGHT = 18;

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

  function giveMonthGeometry(): void {
    const cells = document.querySelectorAll<HTMLElement>('[data-slot="calendar-month-cell"]');
    cells.forEach((cell, index) => {
      const left = (index % 7) * DAY_WIDTH;
      const top = Math.floor(index / 7) * MONTH_CELL_HEIGHT;
      cell.getBoundingClientRect = rectOf(left, top, DAY_WIDTH, MONTH_CELL_HEIGHT);
      for (const pill of cell.querySelectorAll<HTMLElement>('button')) {
        pill.getBoundingClientRect = rectOf(
          left + EVENT_INSET,
          top + MONTH_PILL_TOP,
          DAY_WIDTH - 2 * EVENT_INSET,
          MONTH_PILL_HEIGHT,
        );
      }
    });
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

  const pointerDriver = createPointerDriver(() => act);

  /** A point on the event, where a pointer picks it up. */
  function eventPoint(id: string): Point {
    giveColumnsGeometry();
    giveMonthGeometry();
    const block = eventBlock(id);
    if (!block) throw new Error(`No event ${id}`);
    const { left, top } = block.getBoundingClientRect();
    return { x: left + 10, y: top + 10 };
  }

  /** Presses the pointer on an event and moves it through `path`, after the few pixels that start the drag. */
  async function holdEvent(id: string, path: Point[]) {
    const start = eventPoint(id);
    startClickGuard();
    await pointerDriver.hold(eventBlock(id) as HTMLElement, [start, { x: start.x, y: start.y + 8 }, ...path]);
  }

  async function dropEvent(at: Point) {
    startClickGuard();
    await pointerDriver.release(at);
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
    outwaitClickGuard,
    captureCalls,
  };
}
