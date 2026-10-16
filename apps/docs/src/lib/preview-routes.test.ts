import { describe, expect, test } from 'bun:test';
import { DEFAULT_EXAMPLE, exampleKey } from '@repo/registry/example-key';
import { exampleTitle, previewCardWiring, previewLabel, previewUrl } from './preview-routes';

describe('previewUrl', () => {
  test('addresses the default example of an item by the name of the default example', () => {
    expect(previewUrl('base', 'copy-button.example')).toBe(`/preview/base/copy-button/${DEFAULT_EXAMPLE}`);
  });

  test('addresses another example by its name, under the base', () => {
    expect(previewUrl('radix', 'copy-button.with-custom-icons.example')).toBe(
      '/preview/radix/copy-button/with-custom-icons',
    );
  });

  test('addresses every example the key of which the route can rebuild', () => {
    const [, , , item, example] = previewUrl('base', 'rhf-input-field.with-label.example').split('/');

    expect(exampleKey(item as string, example as string)).toBe('rhf-input-field.with-label.example');
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
  test('names the item the way its docs page does, and, past the default, the example', () => {
    expect(previewLabel('rhf-input-field.example', 'Input Field')).toBe('Open Input Field full page');
    expect(previewLabel('rhf-input-field.with-label.example', 'Input Field')).toBe(
      'Open Input Field With Label full page',
    );
  });

  test('falls back on the name of the item when it has no docs page title', () => {
    expect(previewLabel('copy-button.example')).toBe('Open Copy Button full page');
  });
});

describe('previewCardWiring', () => {
  test('points the card at the full page of its example, under the base of the page', () => {
    expect(previewCardWiring('radix', 'copy-button.with-custom-icons.example', 'page').href).toBe(
      '/preview/radix/copy-button/with-custom-icons',
    );
  });

  test('labels the card after the title of the docs page', () => {
    expect(previewCardWiring('base', 'rhf-input-field.example', 'page', 'Input Field').label).toBe(
      'Open Input Field full page',
    );
  });

  test('keeps the example and the slot that tell the card apart from the others of its page', () => {
    expect(previewCardWiring('base', 'copy-button.example', 'header')).toMatchObject({
      registryName: 'copy-button.example',
      slot: 'header',
    });
  });
});
