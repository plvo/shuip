import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { baseChoices } from '@/lib/base-routes';
import { BaseDropdownMenu } from './base-dropdown';

const PAGES = { base: ['/components/base/side-dialog'], radix: ['/components/radix/side-dialog'] };

const render = (active: 'base' | 'radix') =>
  renderToStaticMarkup(<BaseDropdownMenu choices={baseChoices(`/components/${active}/side-dialog`, active, PAGES)} />);

describe('BaseDropdownMenu', () => {
  test.each([
    ['base', 'Base UI'],
    ['radix', 'Radix'],
  ] as const)('shows the active library on its trigger when the page is %s', (active, label) => {
    expect(render(active)).toContain(`>${label}</span>`);
  });

  test('describes the library on the trigger', () => {
    expect(render('radix')).toContain('Radix UI primitives');
  });

  test('labels the trigger for assistive technology, with the active library', () => {
    expect(render('base')).toContain('aria-label="Primitive library: Base UI"');
  });

  test('opens a menu, which keeps the options out of the page until it is open', () => {
    const markup = render('radix');

    expect(markup).toContain('aria-haspopup="menu"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain('menuitemradio');
  });
});
