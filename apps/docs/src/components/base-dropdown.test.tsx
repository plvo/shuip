import { describe, expect, test } from 'bun:test';
import { isLayoutTabActive } from 'fumadocs-ui/layouts/shared';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { type BaseChoice, baseChoices } from '@/lib/base-routes';
import { BaseDropdown, baseDropdownOptions } from './base-dropdown';

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
    expect(options.map((option) => option.description)).toEqual(['Render composition', 'asChild composition']);
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

describe('baseDropdownOptions selection', () => {
  const choice = (base: 'base' | 'radix', href: string, active: boolean): BaseChoice => ({
    base,
    label: base,
    description: '',
    href,
    active,
  });

  test('follows the base marked active, not the address an option happens to be a prefix of', () => {
    const pathname = '/components/radix/side-dialog';
    const options = baseDropdownOptions(
      [choice('radix', pathname, true), choice('base', '/components', false)],
      pathname,
    );

    expect(options.filter((option) => isLayoutTabActive(option, pathname)).map((option) => option.title)).toEqual([
      'radix',
    ]);
  });
});

describe('BaseDropdown', () => {
  const dropdownOn = (pathname: string, base: 'base' | 'radix'): ReactElement<Record<string, unknown>> => {
    let element: ReactElement<Record<string, unknown>> | undefined;
    const Probe = () => {
      element = BaseDropdown({ base, pages: PAGES }) as ReactElement<Record<string, unknown>>;
      return null;
    };
    renderToStaticMarkup(
      <PathnameContext.Provider value={pathname}>
        <Probe />
      </PathnameContext.Provider>,
    );
    if (!element) throw new Error('the dropdown was not rendered');
    return element;
  };

  test.each([
    ['/components/base/side-dialog', 'base', 'Primitive library: Base UI'],
    ['/components/radix/side-dialog', 'radix', 'Primitive library: Radix'],
  ] as const)('labels the dropdown on %s for assistive technology with the active library', (pathname, base, label) => {
    expect(dropdownOn(pathname, base).props['aria-label']).toBe(label);
  });

  test('offers the options of the page the reader is on', () => {
    const options = dropdownOn('/components/radix/side-dialog', 'radix').props.options as { url: string }[];

    expect(options.map((option) => option.url)).toEqual([
      '/components/base/side-dialog',
      '/components/radix/side-dialog',
    ]);
  });
});
