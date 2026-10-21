import { describe, expect, test } from 'bun:test';
import { useTimeZone } from '../../../scripts/time-zone';
import { isResizeMove, layoutDay, pressedSlotRange, resizedEnd, wallClockDate } from './component.radix';

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

describe('resizedEnd', () => {
  const start = at(9, 0);

  test('keeps the end of a tap, even when the end is off the snap grid', () => {
    expect(resizedEnd(start, at(10, 7), 0)).toBeNull();
  });

  test('keeps the end under half a snap step, in both directions', () => {
    expect(resizedEnd(start, at(10, 7), 5.9)).toBeNull();
    expect(resizedEnd(start, at(10, 7), -5.9)).toBeNull();
  });

  test('snaps the end over half a snap step, in both directions', () => {
    expect(resizedEnd(start, at(10, 0), 6.1)).toEqual(at(10, 15));
    expect(resizedEnd(start, at(10, 0), -6.1)).toEqual(at(9, 45));
  });

  test('returns nothing when the end stays where it is', () => {
    expect(resizedEnd(at(9, 45), at(10, 0), -24)).toBeNull();
  });

  test('never ends an event less than a snap step after its start', () => {
    expect(resizedEnd(start, at(10, 0), -480)).toEqual(at(9, 15));
  });

  test('stops at the end of the day of the start', () => {
    expect(resizedEnd(at(23, 0), at(23, 45), 480)).toEqual(new Date(2026, 2, 11, 0, 0));
    expect(resizedEnd(at(23, 0), at(24, 30), 6)).toEqual(new Date(2026, 2, 11, 0, 0));
  });

  test('ends an event that starts in the last snap step at the end of the day', () => {
    expect(resizedEnd(at(23, 50), at(23, 55), 24)).toEqual(new Date(2026, 2, 11, 0, 0));
  });

  test('returns nothing for an end already at the end of the day', () => {
    expect(resizedEnd(at(23, 0), new Date(2026, 2, 11, 0, 0), 480)).toBeNull();
  });
});

const minutesAt = (hours: number, minutes: number) => hours * 60 + minutes;

describe('pressedSlotRange', () => {
  test('gives a click the hour from the snap step under the press', () => {
    expect(pressedSlotRange(minutesAt(9, 53), minutesAt(9, 53))).toEqual({
      startMin: minutesAt(9, 45),
      endMin: minutesAt(10, 45),
    });
  });

  test('gives a release within 5 minutes of the press the same hour', () => {
    expect(pressedSlotRange(minutesAt(9, 53), minutesAt(9, 57))).toEqual({
      startMin: minutesAt(9, 45),
      endMin: minutesAt(10, 45),
    });
    expect(pressedSlotRange(minutesAt(9, 53), minutesAt(9, 49))).toEqual({
      startMin: minutesAt(9, 45),
      endMin: minutesAt(10, 45),
    });
  });

  test('floors the press and keeps the release on a drag down', () => {
    expect(pressedSlotRange(minutesAt(9, 53), minutesAt(11, 0))).toEqual({
      startMin: minutesAt(9, 45),
      endMin: minutesAt(11, 0),
    });
  });

  test('keeps the release and ends at the end of the pressed slot on a drag up', () => {
    expect(pressedSlotRange(minutesAt(9, 53), minutesAt(9, 0))).toEqual({
      startMin: minutesAt(9, 0),
      endMin: minutesAt(10, 0),
    });
    expect(pressedSlotRange(minutesAt(9, 46), minutesAt(9, 0))).toEqual({
      startMin: minutesAt(9, 0),
      endMin: minutesAt(10, 0),
    });
  });

  test('keeps the slot of a press on a boundary on a drag up', () => {
    expect(pressedSlotRange(minutesAt(10, 0), minutesAt(9, 54))).toEqual({
      startMin: minutesAt(10, 0),
      endMin: minutesAt(10, 15),
    });
    expect(pressedSlotRange(minutesAt(10, 0), minutesAt(9, 0))).toEqual({
      startMin: minutesAt(9, 0),
      endMin: minutesAt(10, 15),
    });
  });

  test('keeps a press on a slot boundary as the start of a click and a drag down', () => {
    expect(pressedSlotRange(minutesAt(10, 0), minutesAt(10, 0))).toEqual({
      startMin: minutesAt(10, 0),
      endMin: minutesAt(11, 0),
    });
    expect(pressedSlotRange(minutesAt(10, 0), minutesAt(11, 30))).toEqual({
      startMin: minutesAt(10, 0),
      endMin: minutesAt(11, 30),
    });
  });

  test('snaps the release and keeps the 15-minute minimum', () => {
    expect(pressedSlotRange(minutesAt(9, 53), minutesAt(10, 6))).toEqual({
      startMin: minutesAt(9, 45),
      endMin: minutesAt(10, 0),
    });
    expect(pressedSlotRange(minutesAt(9, 46), minutesAt(9, 52))).toEqual({
      startMin: minutesAt(9, 45),
      endMin: minutesAt(10, 0),
    });
  });
});

describe('pressedSlotRange within the day', () => {
  test('ends a click in the last hour at the end of the day', () => {
    expect(pressedSlotRange(minutesAt(23, 50), minutesAt(23, 50))).toEqual({
      startMin: minutesAt(23, 45),
      endMin: minutesAt(24, 0),
    });
  });

  test('ends a drag below the column at the end of the day', () => {
    expect(pressedSlotRange(minutesAt(23, 10), minutesAt(26, 30))).toEqual({
      startMin: minutesAt(23, 0),
      endMin: minutesAt(24, 0),
    });
  });

  test('starts a drag above the column at the start of the day, keeping the pressed slot', () => {
    expect(pressedSlotRange(minutesAt(0, 20), -minutesAt(1, 0))).toEqual({
      startMin: minutesAt(0, 0),
      endMin: minutesAt(0, 30),
    });
  });
});

describe('wallClockDate', () => {
  useTimeZone('Europe/Paris');

  test('gives the hour and the minute written on the clock of a day with 25 hours', () => {
    const day = new Date(2026, 9, 25);
    expect(wallClockDate(day, minutesAt(23, 0))).toEqual(new Date(2026, 9, 25, 23, 0));
    expect(wallClockDate(day, minutesAt(1, 30))).toEqual(new Date(2026, 9, 25, 1, 30));
  });

  test('gives the hour and the minute written on the clock of a day with 23 hours', () => {
    const day = new Date(2026, 2, 29);
    expect(wallClockDate(day, minutesAt(23, 0))).toEqual(new Date(2026, 2, 29, 23, 0));
    expect(wallClockDate(day, minutesAt(4, 0))).toEqual(new Date(2026, 2, 29, 4, 0));
  });

  test('gives the start of the next day for 24:00', () => {
    expect(wallClockDate(new Date(2026, 9, 25, 15), minutesAt(24, 0))).toEqual(new Date(2026, 9, 26));
    expect(wallClockDate(new Date(2026, 2, 29, 15), minutesAt(24, 0))).toEqual(new Date(2026, 2, 30));
  });
});

describe('resizedEnd on a day with daylight saving', () => {
  useTimeZone('Europe/Paris');

  test('ends at the time of the clock under the pointer when the end moves past the switch', () => {
    const start = new Date(2026, 2, 29, 1, 0);
    expect(resizedEnd(start, new Date(2026, 2, 29, 1, 30), 72)).toEqual(new Date(2026, 2, 29, 3, 0));
  });

  test('stops at the start of the next day on a day with 25 hours', () => {
    expect(resizedEnd(new Date(2026, 9, 25, 22, 0), new Date(2026, 9, 25, 23, 0), 480)).toEqual(new Date(2026, 9, 26));
  });
});
