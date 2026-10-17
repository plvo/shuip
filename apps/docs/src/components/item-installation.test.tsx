import { describe, expect, test } from 'bun:test';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TAB_GROUPS } from '@/lib/tab-groups';
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

  test('mutes the setup row instead of keeping the accordion defaults next to the overrides', () => {
    const row = render().match(/<div[^>]*class="[^"]*"[^>]*><button[^>]*aria-expanded/)?.[0] ?? '';

    expect(row).toContain('text-fd-muted-foreground');
    expect(row).not.toContain('text-fd-card-foreground');
    expect(row).not.toContain('font-medium');
  });

  test('adds no heading to the outline of the page', () => {
    expect(render()).not.toMatch(/<h[1-6][\s>]/);
  });
});

describe('InstallationCmd tabs', () => {
  const [tabs] = (InstallationCmd({ itemName: 'side-dialog' }) as ReactElement<{ children: ReactElement[] }>).props
    .children as ReactElement<Record<string, unknown>>[];

  test('keep the package manager across items and bases, in the group the whole site shares', () => {
    expect(tabs?.props.groupId).toBe(TAB_GROUPS.packageManager);
  });

  test('remember the package manager beyond the session', () => {
    expect(tabs?.props.persist).toBe(true);
  });

  test('show the manual source in a manual tab', () => {
    const element = InstallationCmd({ itemName: 'side-dialog', manualSource: 'MANUAL SOURCE' }) as ReactElement<{
      children: ReactElement<{ items: string[]; children: ReactElement<{ children: unknown }>[] }>[];
    }>;
    const [manualTabs] = element.props.children;
    const manual = manualTabs?.props.children.at(-1);

    expect(manualTabs?.props.items).toEqual(['npm', 'pnpm', 'bun', 'manual']);
    expect(manual?.props.children).toBe('MANUAL SOURCE');
  });

  test('offer no manual tab without a manual source', () => {
    expect(tabs?.props.items).toEqual(['npm', 'pnpm', 'bun']);
  });
});
