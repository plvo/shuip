import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { BASE_ONLY_BLOCK } from '../src/lib/base-only';
import { BASES } from '../src/lib/base-routes';

const REPOSITORY_ROOT = path.resolve(import.meta.dir, '..', '..', '..');
const MDX_ROOTS = [
  path.join(REPOSITORY_ROOT, 'packages/registry/items'),
  path.join(REPOSITORY_ROOT, 'apps/docs/content'),
];

// Written for Radix only. A page of either base renders its prose, so these belong inside a Radix `<BaseOnly>`.
const RADIX_ONLY_API = /asChild|onOpenAutoFocus|onCloseAutoFocus|PopoverAnchor|checked=["']indeterminate["']|radix-ui/;

const mdxFiles = (root: string): string[] =>
  fs.readdirSync(root, { recursive: true, withFileTypes: true }).flatMap((entry) => {
    const file = path.join(entry.parentPath, entry.name);
    return (entry.isFile() || entry.isSymbolicLink()) && file.endsWith('.mdx') ? [file] : [];
  });

const documents = MDX_ROOTS.flatMap(mdxFiles).map((file) => ({
  name: path.relative(REPOSITORY_ROOT, file),
  text: fs.readFileSync(file, 'utf-8'),
}));

describe('the prose of the docs pages', () => {
  test('is found', () => {
    expect(documents.length).toBeGreaterThan(40);
  });

  test.each(
    documents.map(({ name, text }) => [name, text] as const),
  )('%s shows no Radix-only API outside a Radix block', (_name, text) => {
    const sharedProse = text.replace(BASE_ONLY_BLOCK, (block, base: string) => (base === 'radix' ? '' : block));

    expect(sharedProse.match(RADIX_ONLY_API)).toBeNull();
  });

  test.each(
    documents.map(({ name, text }) => [name, text] as const),
  )('%s only writes blocks for known bases', (_name, text) => {
    const written = [...text.matchAll(BASE_ONLY_BLOCK)].map((match) => match[1]);
    const opened = text.match(/<BaseOnly\b/g)?.length ?? 0;

    expect(written.length).toBe(opened);
    for (const base of written) expect(BASES as readonly (string | undefined)[]).toContain(base);
  });
});
