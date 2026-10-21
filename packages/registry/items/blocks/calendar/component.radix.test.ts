import { describe, expect, test } from 'bun:test';
import { isResizeMove, layoutDay, resizeEndOnRelease } from './component.radix';

type Slot = { id: string; start: Date; end: Date };

const at = (hours: number, minutes: number) => new Date(2026, 2, 10, hours, minutes);

const slotOf = (id: string, start: Date, end: Date): Slot => ({ id, start, end });

const layoutOf = (slots: Slot[]) =>
  layoutDay(
    slots,
    (slot) => slot.start,
    (slot) => slot.end,
  ).map(({ item, col, cols }) => ({ id: item.id, col, cols }));

describe('layoutDay', () => {
  test('puts an event with no duration and an event 5 minutes later in two columns', () => {
    const layout = layoutOf([slotOf('a', at(9, 0), at(9, 0)), slotOf('b', at(9, 5), at(9, 45))]);
    expect(layout).toEqual([
      { id: 'a', col: 0, cols: 2 },
      { id: 'b', col: 1, cols: 2 },
    ]);
  });

  test('measures an event under 15 minutes as the 15 minutes the grid draws', () => {
    const overlapping = layoutOf([slotOf('a', at(9, 0), at(9, 5)), slotOf('b', at(9, 10), at(9, 30))]);
    expect(overlapping.map((entry) => entry.col)).toEqual([0, 1]);
    const apart = layoutOf([slotOf('a', at(9, 0), at(9, 5)), slotOf('b', at(9, 15), at(9, 30))]);
    expect(apart.map((entry) => entry.col)).toEqual([0, 0]);
  });

  test('shares a column between events of which one ends when the other starts', () => {
    const layout = layoutOf([slotOf('a', at(9, 0), at(10, 0)), slotOf('b', at(10, 0), at(11, 0))]);
    expect(layout).toEqual([
      { id: 'a', col: 0, cols: 1 },
      { id: 'b', col: 0, cols: 1 },
    ]);
  });

  test('counts the columns over the whole day', () => {
    const layout = layoutOf([
      slotOf('a', at(8, 0), at(9, 0)),
      slotOf('b', at(8, 30), at(9, 30)),
      slotOf('c', at(14, 0), at(15, 0)),
    ]);
    expect(layout).toEqual([
      { id: 'a', col: 0, cols: 2 },
      { id: 'b', col: 1, cols: 2 },
      { id: 'c', col: 0, cols: 2 },
    ]);
  });
});

// The hour is 48px tall and the snap step is 15 minutes, so half a step is 6px.
describe('isResizeMove', () => {
  test('is false just under half a snap step, in both directions', () => {
    expect(isResizeMove(0)).toBe(false);
    expect(isResizeMove(5.9)).toBe(false);
    expect(isResizeMove(-5.9)).toBe(false);
  });

  test('is true from half a snap step, in both directions', () => {
    expect(isResizeMove(6)).toBe(true);
    expect(isResizeMove(6.1)).toBe(true);
    expect(isResizeMove(-6.1)).toBe(true);
  });
});

describe('resizeEndOnRelease', () => {
  const start = at(9, 0);

  test('keeps the end of a tap, even when the end is off the snap grid', () => {
    expect(resizeEndOnRelease(start, at(10, 7), 0)).toBeNull();
  });

  test('keeps the end under half a snap step, in both directions', () => {
    expect(resizeEndOnRelease(start, at(10, 7), 5.9)).toBeNull();
    expect(resizeEndOnRelease(start, at(10, 7), -5.9)).toBeNull();
  });

  test('snaps the end over half a snap step, in both directions', () => {
    expect(resizeEndOnRelease(start, at(10, 0), 6.1)).toEqual(at(10, 15));
    expect(resizeEndOnRelease(start, at(10, 0), -6.1)).toEqual(at(9, 45));
  });

  test('returns nothing when the end stays where it is', () => {
    expect(resizeEndOnRelease(at(9, 45), at(10, 0), -24)).toBeNull();
  });

  test('never ends an event less than a snap step after its start', () => {
    expect(resizeEndOnRelease(start, at(10, 0), -480)).toEqual(at(9, 15));
  });
});
