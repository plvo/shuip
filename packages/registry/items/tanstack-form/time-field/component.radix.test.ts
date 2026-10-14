import { describe, expect, test } from 'bun:test';
import { updateTimePart } from './component.radix';

describe('updateTimePart', () => {
  test('clears the whole value when the hour is cleared', () => {
    expect(updateTimePart('09:30', 'hour', null)).toBe('');
  });

  test('clears the whole value when the minute is cleared', () => {
    expect(updateTimePart('09:30', 'minute', null)).toBe('');
  });

  test('composes HH:mm from the part that is set and the one that is already there', () => {
    expect(updateTimePart('', 'hour', '09')).toBe('09:00');
    expect(updateTimePart('', 'minute', '30')).toBe('00:30');
    expect(updateTimePart('09:00', 'minute', '30')).toBe('09:30');
  });

  test('updates one part of an existing value and keeps the other', () => {
    expect(updateTimePart('09:30', 'hour', '14')).toBe('14:30');
    expect(updateTimePart('09:30', 'minute', '45')).toBe('09:45');
  });
});
