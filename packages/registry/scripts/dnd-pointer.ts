import type { act as ReactAct } from 'react';

export type Point = { x: number; y: number };

export const settle = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

function pointerEvent(type: string, target: EventTarget, { x, y }: Point) {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(event, 'isPrimary', { value: true });
  target.dispatchEvent(event);
}

/**
 * The pointer of a dnd-kit drag in a DOM without a layout engine. The sensor listens on the document for the moves and
 * the release, and starts the drag at the first move over its activation distance. `getAct` answers React's `act` once
 * the suite has loaded React.
 */
export function createPointerDriver(getAct: () => typeof ReactAct) {
  async function moveTo(point: Point) {
    await getAct()(async () => {
      pointerEvent('pointermove', document, point);
      await settle();
    });
  }

  /** Presses on `handle` at the first point of `path` and moves through the others. */
  async function hold(handle: HTMLElement, path: Point[]) {
    const [start, ...rest] = path;
    if (!start) return;
    await getAct()(async () => {
      pointerEvent('pointerdown', handle, start);
    });
    for (const point of rest) await moveTo(point);
  }

  async function release(point: Point) {
    await getAct()(async () => {
      pointerEvent('pointerup', document, point);
      await settle();
    });
  }

  return { moveTo, hold, release };
}
