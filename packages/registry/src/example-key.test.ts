import { describe, expect, test } from 'bun:test';
import { exampleKey, parseExampleKey } from './example-key';

describe('exampleKey', () => {
  test('names the default example after the item', () => {
    expect(exampleKey('side-dialog', 'default')).toBe('side-dialog.example');
  });

  test('names another example after the item and itself', () => {
    expect(exampleKey('side-dialog', 'scrollable')).toBe('side-dialog.scrollable.example');
  });
});

describe('parseExampleKey', () => {
  test.each([
    ['side-dialog.example', { itemName: 'side-dialog', exampleName: 'default' }],
    ['rhf-input-field.tooltip.example', { itemName: 'rhf-input-field', exampleName: 'tooltip' }],
  ])('reads %s', (key, parsed) => {
    expect(parseExampleKey(key)).toEqual(parsed);
  });

  test.each(['side-dialog', 'side-dialog.scrollable', 'side-dialog.', '.example'])('rejects %p', (key) => {
    expect(parseExampleKey(key)).toBeNull();
  });

  test('is the inverse of exampleKey', () => {
    expect(parseExampleKey(exampleKey('tsf-input-field', 'wide'))).toEqual({
      itemName: 'tsf-input-field',
      exampleName: 'wide',
    });
  });
});
