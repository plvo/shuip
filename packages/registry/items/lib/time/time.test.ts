import { describe, expect, test } from 'bun:test';
import {
  addOneHour,
  fromMinutes,
  HOUR_OPTIONS,
  isHourDisabled,
  isMinuteDisabled,
  joinTime,
  MINUTE_OPTIONS,
  MINUTE_STEP,
  nextSlot,
  splitTime,
  toMinutes,
} from './time';

const LAST_SLOT = '23:55';

describe('options', () => {
  test('hours run 00 to 23 and minutes step by MINUTE_STEP up to 55', () => {
    expect(HOUR_OPTIONS).toHaveLength(24);
    expect(HOUR_OPTIONS[0]).toBe('00');
    expect(HOUR_OPTIONS[23]).toBe('23');
    expect(MINUTE_OPTIONS).toHaveLength(60 / MINUTE_STEP);
    expect(MINUTE_OPTIONS.slice(0, 3)).toEqual(['00', '05', '10']);
    expect(MINUTE_OPTIONS.at(-1)).toBe('55');
  });
});

describe('splitTime and joinTime', () => {
  test('a full value round-trips', () => {
    const { hour, minute } = splitTime('09:30');
    expect({ hour, minute }).toEqual({ hour: '09', minute: '30' });
    expect(joinTime(hour, minute)).toBe('09:30');
  });

  test('an empty value splits to empty parts and joins back to an empty value', () => {
    const { hour, minute } = splitTime('');
    expect({ hour, minute }).toEqual({ hour: '', minute: '' });
    expect(joinTime(hour, minute)).toBe('');
  });

  test('a partial value keeps its hour and defaults the minute to 00', () => {
    expect(splitTime('09')).toEqual({ hour: '09', minute: '' });
    expect(joinTime('09', '')).toBe('09:00');
  });

  test('a lone minute defaults the hour to 00', () => {
    expect(joinTime('', '30')).toBe('00:30');
  });
});

describe('toMinutes and fromMinutes', () => {
  test('toMinutes counts minutes since midnight', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('01:05')).toBe(65);
    expect(toMinutes('23:55')).toBe(1435);
  });

  test('toMinutes returns null for an empty, partial or non-numeric value', () => {
    expect(toMinutes('')).toBeNull();
    expect(toMinutes('09')).toBeNull();
    expect(toMinutes('09:')).toBeNull();
    expect(toMinutes('ab:cd')).toBeNull();
  });

  test('fromMinutes formats zero-padded HH:mm and round-trips every slot', () => {
    expect(fromMinutes(65)).toBe('01:05');
    for (const hour of HOUR_OPTIONS) {
      for (const minute of MINUTE_OPTIONS) {
        const time = `${hour}:${minute}`;
        expect(fromMinutes(toMinutes(time) as number)).toBe(time);
      }
    }
  });

  test('fromMinutes clamps below midnight to 00:00', () => {
    expect(fromMinutes(-1)).toBe('00:00');
    expect(fromMinutes(-600)).toBe('00:00');
  });

  test('fromMinutes clamps past the end of the day to the last slot', () => {
    expect(fromMinutes(1435)).toBe(LAST_SLOT);
    expect(fromMinutes(1439)).toBe(LAST_SLOT);
    expect(fromMinutes(1440)).toBe(LAST_SLOT);
    expect(fromMinutes(5000)).toBe(LAST_SLOT);
  });
});

describe('addOneHour', () => {
  test('adds sixty minutes and keeps the minutes', () => {
    expect(addOneHour('09:30')).toBe('10:30');
    expect(addOneHour('00:00')).toBe('01:00');
  });

  test('clamps at the end of the day', () => {
    expect(addOneHour('23:30')).toBe(LAST_SLOT);
    expect(addOneHour('23:00')).toBe(LAST_SLOT);
    expect(addOneHour(LAST_SLOT)).toBe(LAST_SLOT);
  });

  test('returns an incomplete value unchanged', () => {
    expect(addOneHour('')).toBe('');
    expect(addOneHour('09')).toBe('09');
  });
});

describe('nextSlot', () => {
  test('advances by MINUTE_STEP', () => {
    expect(nextSlot('09:00')).toBe('09:05');
    expect(nextSlot('09:30')).toBe('09:35');
  });

  test('rolls over to the next hour', () => {
    expect(nextSlot('09:55')).toBe('10:00');
    expect(nextSlot('00:55')).toBe('01:00');
  });

  test('returns an incomplete value unchanged', () => {
    expect(nextSlot('')).toBe('');
    expect(nextSlot('09')).toBe('09');
  });

  test('start 23:55 has no later slot: the next slot is the start itself', () => {
    expect(nextSlot(LAST_SLOT)).toBe(LAST_SLOT);
  });

  test('as the end minimum, a start of 23:55 leaves only 23:55 itself and nothing after it', () => {
    const bounds = { min: nextSlot(LAST_SLOT) };
    const enabled = HOUR_OPTIONS.filter((hour) => !isHourDisabled(hour, bounds)).flatMap((hour) =>
      MINUTE_OPTIONS.filter((minute) => !isMinuteDisabled(minute, hour, bounds)).map((minute) => `${hour}:${minute}`),
    );
    expect(enabled).toEqual([LAST_SLOT]);
  });
});

describe('isHourDisabled', () => {
  const businessHours = { min: '09:00', max: '17:30' };

  test('is enabled without bounds or without an hour', () => {
    expect(isHourDisabled('03')).toBe(false);
    expect(isHourDisabled('03', {})).toBe(false);
    expect(isHourDisabled('', businessHours)).toBe(false);
  });

  test('disables hours that end before min', () => {
    expect(isHourDisabled('08', businessHours)).toBe(true);
    expect(isHourDisabled('00', businessHours)).toBe(true);
  });

  test('disables hours that start after max', () => {
    expect(isHourDisabled('18', businessHours)).toBe(true);
    expect(isHourDisabled('23', businessHours)).toBe(true);
  });

  test('keeps the hours that contain a bound enabled', () => {
    expect(isHourDisabled('09', businessHours)).toBe(false);
    expect(isHourDisabled('17', businessHours)).toBe(false);
    expect(isHourDisabled('10', { min: '10:30' })).toBe(false);
    expect(isHourDisabled('17', { max: '17:00' })).toBe(false);
  });

  test('an incomplete bound does not constrain', () => {
    expect(isHourDisabled('03', { min: '10' })).toBe(false);
    expect(isHourDisabled('20', { max: '' })).toBe(false);
  });

  test('a range end bounded by nextSlot(start) disables hours before the start', () => {
    const bounds = { min: nextSlot('10:55') };
    expect(isHourDisabled('10', bounds)).toBe(true);
    expect(isHourDisabled('11', bounds)).toBe(false);
  });
});

describe('isMinuteDisabled', () => {
  const businessHours = { min: '09:15', max: '17:30' };

  test('is enabled without bounds or when the hour or minute is missing', () => {
    expect(isMinuteDisabled('00', '03')).toBe(false);
    expect(isMinuteDisabled('00', '', businessHours)).toBe(false);
    expect(isMinuteDisabled('', '03', businessHours)).toBe(false);
  });

  test('disables minutes before min within the min hour', () => {
    expect(isMinuteDisabled('10', '09', businessHours)).toBe(true);
    expect(isMinuteDisabled('15', '09', businessHours)).toBe(false);
    expect(isMinuteDisabled('20', '09', businessHours)).toBe(false);
  });

  test('disables minutes after max within the max hour', () => {
    expect(isMinuteDisabled('35', '17', businessHours)).toBe(true);
    expect(isMinuteDisabled('30', '17', businessHours)).toBe(false);
    expect(isMinuteDisabled('00', '17', businessHours)).toBe(false);
  });

  test('disables every minute of an hour outside the bounds', () => {
    expect(isMinuteDisabled('30', '08', businessHours)).toBe(true);
    expect(isMinuteDisabled('00', '18', businessHours)).toBe(true);
  });

  test('a range end only offers minutes after the start', () => {
    const bounds = { min: nextSlot('10:30') };
    expect(isMinuteDisabled('30', '10', bounds)).toBe(true);
    expect(isMinuteDisabled('35', '10', bounds)).toBe(false);
  });
});
