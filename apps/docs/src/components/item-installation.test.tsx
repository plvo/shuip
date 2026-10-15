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

  test('offers the namespace setup as a collapsed disclosure', () => {
    const markup = render();
    expect(markup).toMatch(/<button[^>]*aria-expanded="false"[^>]*>[\s\S]*One-time setup/);
    expect(markup).not.toContain('"registries"');
  });
});
