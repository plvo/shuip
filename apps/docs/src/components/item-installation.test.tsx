import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { InstallationCmd } from './item-installation';

const render = () => renderToStaticMarkup(<InstallationCmd itemName='side-dialog' />);

describe('InstallationCmd', () => {
  test('shows the namespace command for the item', () => {
    expect(render()).toContain('npx shadcn@latest add @shuip/side-dialog');
  });

  test('says the command is the same for Base UI and Radix', () => {
    expect(render()).toContain('same for Base UI and Radix');
  });

  test('offers the namespace setup as a collapsed disclosure that says when it is needed', () => {
    const markup = render();

    expect(markup).toMatch(
      /<button[^>]*aria-expanded="false"[^>]*>[\s\S]*Command fails\? Add the @shuip namespace first/,
    );
    expect(markup).not.toContain('registries');
  });

  test('adds no heading to the outline of the page', () => {
    expect(render()).not.toMatch(/<h[1-6][\s>]/);
  });
});
