import { describe, expect, test } from 'bun:test';
import { exampleKeyOf, exampleTitle, previewLabel, previewUrl } from './preview-routes';

describe('previewUrl', () => {
  test('addresses the default example of an item by the name default', () => {
    expect(previewUrl('base', 'copy-button.example')).toBe('/preview/base/copy-button/default');
  });

  test('addresses another example by its name, under the base', () => {
    expect(previewUrl('radix', 'copy-button.with-custom-icons.example')).toBe(
      '/preview/radix/copy-button/with-custom-icons',
    );
  });
});

describe('exampleKeyOf', () => {
  test.each([
    ['copy-button', 'default', 'copy-button.example'],
    ['copy-button', 'with-custom-icons', 'copy-button.with-custom-icons.example'],
  ])('names the example %s/%s %s', (item, example, key) => {
    expect(exampleKeyOf(item, example)).toBe(key);
  });
});

describe('exampleTitle', () => {
  test('titles the default example Default', () => {
    expect(exampleTitle('copy-button.example')).toBe('Default');
  });

  test('titles another example from its name', () => {
    expect(exampleTitle('copy-button.with-custom-icons.example')).toBe('With Custom Icons');
  });
});

describe('previewLabel', () => {
  test('names the item and, past the default, the example the button opens', () => {
    expect(previewLabel('copy-button.example')).toBe('Open Copy Button full page');
    expect(previewLabel('copy-button.with-custom-icons.example')).toBe('Open Copy Button With Custom Icons full page');
  });
});
