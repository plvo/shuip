import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { SHUIP_NAMESPACE, shuipRegistryUrl } from '@repo/registry/namespace';
import { filesUnder, REPOSITORY_ROOT, readDocuments } from './documents';
import { installTargets } from './install-commands';

const REGISTRY_URL = /https?:\/\/[^\s"'`)]*\/r\/[^\s"'`)]*/g;

const under = (...segments: string[]): string => path.join(REPOSITORY_ROOT, ...segments);

const rootMarkdown = fs
  .readdirSync(REPOSITORY_ROOT)
  .filter((file) => file.endsWith('.md'))
  .map((file) => under(file));

const documents = readDocuments([
  ...rootMarkdown,
  under('.claude/CLAUDE.md'),
  ...['.claude/skills', 'apps/docs/content', 'packages/registry/items', 'packages/registry/skills'].flatMap(
    (directory) => filesUnder(under(directory), ['.md', '.mdx']),
  ),
]);

describe('installTargets', () => {
  test('reads the item after `add` for any shadcn tag or version', () => {
    const text = [
      'npx shadcn@latest add @shuip/a',
      'pnpm dlx shadcn@canary add @shuip/b',
      'bun x shadcn@3.1.0 add @shuip/c',
      'npx shadcn add @shuip/d',
    ].join('\n');

    expect(installTargets(text)).toEqual(['@shuip/a', '@shuip/b', '@shuip/c', '@shuip/d']);
  });

  test('skips the flags between `add` and the item', () => {
    expect(installTargets('npx shadcn add -y --overwrite @shuip/x')).toEqual(['@shuip/x']);
    expect(installTargets('npx shadcn add -y side-dialog')).toEqual(['side-dialog']);
  });

  test('reports a URL as the target it is', () => {
    expect(installTargets('npx shadcn@latest add https://shuip.plvo.dev/r/input-field')).toEqual([
      'https://shuip.plvo.dev/r/input-field',
    ]);
  });
});

describe('the install instructions of the docs, the README and the skills', () => {
  test('are found', () => {
    expect(documents.length).toBeGreaterThan(40);
    expect(documents.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['README.md', '.claude/CLAUDE.md', '.claude/skills/creating-registry-item/SKILL.md']),
    );
  });

  test.each(
    documents.map(({ name, text }) => [name, text] as const),
  )('%s links the registry through the namespace template only', (_name, text) => {
    for (const url of text.match(REGISTRY_URL) ?? []) expect(url).toBe(shuipRegistryUrl());
  });

  test.each(
    documents.map(({ name, text }) => [name, text] as const),
  )('%s installs shuip items through the namespace', (_name, text) => {
    for (const target of installTargets(text)) expect(target).toStartWith(`${SHUIP_NAMESPACE}/`);
  });
});
