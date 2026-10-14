import { describe, expect, test } from 'bun:test';
import { dateMatchModifiers } from 'react-day-picker';
import { dateBoundsMatcher } from './component.radix';

const day = (dayOfMonth: number): Date => new Date(2025, 5, dayOfMonth);
const MIN = day(10);
const MAX = day(20);

const isDisabled = (date: Date, minDate?: Date, maxDate?: Date): boolean => {
  const matcher = dateBoundsMatcher(minDate, maxDate);
  return matcher ? dateMatchModifiers(date, matcher) : false;
};

describe('dateBoundsMatcher', () => {
  test('disables nothing without bounds', () => {
    expect(dateBoundsMatcher()).toBeUndefined();
  });

  test('disables days before the minimum and after the maximum, and keeps the bounds and days between', () => {
    expect(isDisabled(day(9), MIN, MAX)).toBe(true);
    expect(isDisabled(day(21), MIN, MAX)).toBe(true);
    expect(isDisabled(day(10), MIN, MAX)).toBe(false);
    expect(isDisabled(day(15), MIN, MAX)).toBe(false);
    expect(isDisabled(day(20), MIN, MAX)).toBe(false);
  });

  test('only a minimum disables the days before it', () => {
    expect(isDisabled(day(9), MIN)).toBe(true);
    expect(isDisabled(day(10), MIN)).toBe(false);
    expect(isDisabled(day(28), MIN)).toBe(false);
  });

  test('only a maximum disables the days after it', () => {
    expect(isDisabled(day(21), undefined, MAX)).toBe(true);
    expect(isDisabled(day(20), undefined, MAX)).toBe(false);
    expect(isDisabled(day(2), undefined, MAX)).toBe(false);
  });
});
