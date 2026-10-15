import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { shuipRegistryUrl } from '@repo/registry/namespace';

const REPOSITORY_ROOT = path.resolve(import.meta.dir, '..', '..', '..');
const DOCUMENT_ROOTS = [
  path.join(REPOSITORY_ROOT, 'apps/docs/content'),
  path.join(REPOSITORY_ROOT, 'packages/registry/items'),
  path.join(REPOSITORY_ROOT, 'packages/registry/skills'),
];

const REGISTRY_URL = /https?:\/\/[^\s"'`)]*\/r\/[^\s"'`)]*/g;
const INSTALL_COMMAND = /shadcn(?:@latest)? add (\S+)/g;

const markdownFiles = (root: string): string[] =>
  fs.readdirSync(root, { recursive: true, withFileTypes: true }).flatMap((entry) => {
    const file = path.join(entry.parentPath, entry.name);
    return (entry.isFile() || entry.isSymbolicLink()) && /\.(mdx|md)$/.test(file) ? [file] : [];
  });

const documents = [path.join(REPOSITORY_ROOT, 'README.md'), ...DOCUMENT_ROOTS.flatMap(markdownFiles)].map((file) => ({
  name: path.relative(REPOSITORY_ROOT, file),
  text: fs.readFileSync(file, 'utf-8'),
}));

describe('the install instructions of the docs, the README and the skills', () => {
  test('are found', () => {
    expect(documents.length).toBeGreaterThan(40);
  });

  test.each(
    documents.map(({ name, text }) => [name, text] as const),
  )('%s links the registry through the namespace template only', (_name, text) => {
    for (const url of text.match(REGISTRY_URL) ?? []) expect(url).toBe(shuipRegistryUrl());
  });

  test.each(
    documents.map(({ name, text }) => [name, text] as const),
  )('%s installs shuip items through the namespace', (_name, text) => {
    for (const [, target] of text.matchAll(INSTALL_COMMAND)) expect(target).toStartWith('@shuip/');
  });
});
