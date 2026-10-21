import { describe, expect, test } from 'bun:test';
import { runInTimeZone } from '../../../scripts/time-zone';
import {
  clampTranslation,
  isResizeMove,
  layoutDay,
  movedStart,
  pressedSlotRange,
  resizedEnd,
  wallClockDate,
} from './component.radix';

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

  test('keeps a press at or past the end of the day in the last snap step', () => {
    const lastStep = { startMin: minutesAt(23, 45), endMin: minutesAt(24, 0) };
    expect(pressedSlotRange(minutesAt(24, 0), minutesAt(24, 0))).toEqual(lastStep);
    expect(pressedSlotRange(minutesAt(23, 50), minutesAt(23, 50))).toEqual(lastStep);
    expect(pressedSlotRange(minutesAt(24, 20), minutesAt(23, 0))).toEqual({
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
  runInTimeZone('Europe/Paris');

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
  runInTimeZone('Europe/Paris');

  test('ends at the time of the clock under the pointer when the end moves past the switch', () => {
    const start = new Date(2026, 2, 29, 1, 0);
    expect(resizedEnd(start, new Date(2026, 2, 29, 1, 30), 72)).toEqual(new Date(2026, 2, 29, 3, 0));
  });

  test('stops at the start of the next day on a day with 25 hours', () => {
    expect(resizedEnd(new Date(2026, 9, 25, 22, 0), new Date(2026, 9, 25, 23, 0), 480)).toEqual(new Date(2026, 9, 26));
  });
});

// The hour is 48px tall, so 48px is one hour and 12px is one snap step.
describe('movedStart', () => {
  const day = new Date(2026, 2, 11);
  const nextDay = new Date(2026, 2, 12);

  test('moves the start by the vertical move, snapped to the snap step', () => {
    expect(movedStart(at(10, 0), at(11, 0), 48, day)).toEqual(new Date(2026, 2, 11, 11, 0));
    expect(movedStart(at(10, 0), at(11, 0), 20, day)).toEqual(new Date(2026, 2, 11, 10, 30));
    expect(movedStart(at(10, 0), at(11, 0), -9, day)).toEqual(new Date(2026, 2, 11, 9, 45));
  });

  test('keeps the time of the start on the day it is dropped on', () => {
    expect(movedStart(at(10, 0), at(11, 0), 0, nextDay)).toEqual(new Date(2026, 2, 12, 10, 0));
  });

  test('starts an event dragged above the top at the start of the aimed day', () => {
    expect(movedStart(at(0, 30), at(1, 30), -100, day)).toEqual(new Date(2026, 2, 11, 0, 0));
    expect(movedStart(at(0, 30), at(1, 30), -100, nextDay)).toEqual(new Date(2026, 2, 12, 0, 0));
  });

  test('ends an event dragged past the bottom at the end of the aimed day', () => {
    expect(movedStart(at(10, 0), at(11, 0), 5000, day)).toEqual(new Date(2026, 2, 11, 23, 0));
    expect(movedStart(at(23, 0), at(23, 45), 200, day)).toEqual(new Date(2026, 2, 11, 23, 15));
  });

  test('stops an event longer than the space left so that it still ends in the day', () => {
    expect(movedStart(at(20, 0), at(23, 0), 96, day)).toEqual(new Date(2026, 2, 11, 21, 0));
  });

  test('starts an event of a day or more at the start of the day', () => {
    expect(movedStart(at(10, 0), new Date(2026, 2, 11, 12, 0), 96, day)).toEqual(new Date(2026, 2, 11, 0, 0));
  });

  test('clamps an event that crosses midnight into the day it is moved to', () => {
    expect(movedStart(at(23, 0), new Date(2026, 2, 11, 1, 0), 0, day)).toEqual(new Date(2026, 2, 11, 22, 0));
    expect(movedStart(at(23, 0), new Date(2026, 2, 11, 1, 0), 0, nextDay)).toEqual(new Date(2026, 2, 12, 22, 0));
  });
});

describe('movedStart on a day with daylight saving', () => {
  runInTimeZone('Europe/Paris');

  test('lands at the time written on the clock under the pointer on a day with 25 hours', () => {
    const day = new Date(2026, 9, 25);
    const start = new Date(2026, 9, 25, 20, 0);
    expect(movedStart(start, new Date(2026, 9, 25, 21, 0), 144, day)).toEqual(new Date(2026, 9, 25, 23, 0));
  });

  test('lands at the time written on the clock under the pointer on a day with 23 hours', () => {
    const day = new Date(2026, 2, 29);
    const start = new Date(2026, 2, 29, 1, 0);
    expect(movedStart(start, new Date(2026, 2, 29, 2, 0), 144, day)).toEqual(new Date(2026, 2, 29, 4, 0));
  });

  test('keeps the time written on the clock when the event moves to a day with 25 hours', () => {
    const start = new Date(2026, 9, 24, 23, 0);
    expect(movedStart(start, new Date(2026, 9, 25, 0, 0), 0, new Date(2026, 9, 25))).toEqual(
      new Date(2026, 9, 25, 23, 0),
    );
  });
});

describe('clampTranslation', () => {
  const grid = { left: 100, top: 200, right: 800, bottom: 1400 };
  const node = { left: 300, top: 400, right: 400, bottom: 448 };

  test('leaves a translation that keeps the node in the grid', () => {
    expect(clampTranslation({ x: 50, y: -100 }, node, grid)).toEqual({ x: 50, y: -100 });
  });

  test('stops the node at each edge of the grid', () => {
    expect(clampTranslation({ x: -900, y: -900 }, node, grid)).toEqual({ x: -200, y: -200 });
    expect(clampTranslation({ x: 9000, y: 9000 }, node, grid)).toEqual({ x: 400, y: 952 });
  });
});
