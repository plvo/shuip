import { describe, expect, test } from 'bun:test';
import { timePartHandlers as rhfTimeField } from '../items/react-hook-form/time-field/component.radix';
import { timePartHandlers as rhfTimeRange } from '../items/react-hook-form/time-range/component.radix';
import { timePartHandlers as tsfTimeField } from '../items/tanstack-form/time-field/component.radix';
import { timePartHandlers as tsfTimeRange } from '../items/tanstack-form/time-range/component.radix';

const implementations = [
  ['rhf time-field', rhfTimeField],
  ['rhf time-range', rhfTimeRange],
  ['tsf time-field', tsfTimeField],
  ['tsf time-range', tsfTimeRange],
] as const;

const record = (handlers: typeof rhfTimeField, value: string) => {
  const changes: string[] = [];
  return { ...handlers(value, (next) => changes.push(next)), changes };
};

describe.each(implementations)('timePartHandlers of %s', (_, timePartHandlers) => {
  test('an hour change keeps the minute', () => {
    const { onHourChange, changes } = record(timePartHandlers, '09:30');
    onHourChange('14');
    expect(changes).toEqual(['14:30']);
  });

  test('a minute change keeps the hour', () => {
    const { onMinuteChange, changes } = record(timePartHandlers, '09:30');
    onMinuteChange('45');
    expect(changes).toEqual(['09:45']);
  });

  test('clearing the hour clears the whole value', () => {
    const { onHourChange, changes } = record(timePartHandlers, '09:30');
    onHourChange(null);
    expect(changes).toEqual(['']);
  });

  test('clearing the minute clears the whole value', () => {
    const { onMinuteChange, changes } = record(timePartHandlers, '09:30');
    onMinuteChange(null);
    expect(changes).toEqual(['']);
  });

  test('from an empty value, setting a part fills the other with 00', () => {
    const hour = record(timePartHandlers, '');
    hour.onHourChange('09');
    const minute = record(timePartHandlers, '');
    minute.onMinuteChange('30');
    expect(hour.changes).toEqual(['09:00']);
    expect(minute.changes).toEqual(['00:30']);
  });

  test('from an empty value, clearing a part stays empty', () => {
    const { onHourChange, changes } = record(timePartHandlers, '');
    onHourChange(null);
    expect(changes).toEqual(['']);
  });

  test('reports exactly one change per call', () => {
    const { onHourChange, onMinuteChange, changes } = record(timePartHandlers, '09:30');
    onHourChange('10');
    onMinuteChange('15');
    expect(changes).toEqual(['10:30', '09:15']);
  });
});
