import { describe, expect, test } from 'bun:test';
import { isLayoutTabActive } from 'fumadocs-ui/layouts/shared';
import { baseChoices } from '@/lib/base-routes';
import { baseDropdownOptions } from './base-dropdown';

const PAGES = {
  base: ['/components/base/side-dialog', '/components/base/popover-anchor'],
  radix: ['/components/radix/side-dialog'],
};

const optionsOn = (pathname: string, active: 'base' | 'radix') =>
  baseDropdownOptions(baseChoices(pathname, active, PAGES), pathname);

const selectedOn = (pathname: string, active: 'base' | 'radix') =>
  optionsOn(pathname, active)
    .filter((option) => isLayoutTabActive(option, pathname))
    .map((option) => option.title);

describe('baseDropdownOptions', () => {
  test('offers each base with its description, in the order of the bases', () => {
    const options = optionsOn('/components/radix/side-dialog', 'radix');

    expect(options.map((option) => option.title)).toEqual(['Base UI', 'Radix']);
    expect(options.map((option) => option.description)).toEqual([
      'Base UI primitives, render composition',
      'Radix primitives, asChild composition',
    ]);
  });

  test('links each base to the page it switches to', () => {
    expect(optionsOn('/components/radix/side-dialog', 'radix').map((option) => option.url)).toEqual([
      '/components/base/side-dialog',
      '/components/radix/side-dialog',
    ]);
  });

  test('links the index of the section for a base that lacks the page', () => {
    expect(optionsOn('/components/base/popover-anchor', 'base').map((option) => option.url)).toEqual([
      '/components/base/popover-anchor',
      '/components/radix',
    ]);
  });

  test.each([
    ['/components/base/side-dialog', 'base', 'Base UI'],
    ['/components/radix/side-dialog', 'radix', 'Radix'],
  ] as const)('marks only the base of the page %s as the selected one', (pathname, active, title) => {
    expect(selectedOn(pathname, active)).toEqual([title]);
  });

  test('marks the base of the page even when the other one links to the index of its section', () => {
    expect(selectedOn('/components/base/popover-anchor', 'base')).toEqual(['Base UI']);
  });
});
