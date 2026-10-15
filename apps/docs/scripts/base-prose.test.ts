import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { BASE_ONLY_BLOCK } from '../src/lib/base-only';
import { BASES } from '../src/lib/base-routes';
import { filesUnder, REPOSITORY_ROOT, readDocuments } from './documents';

const MDX_ROOTS = [
  path.join(REPOSITORY_ROOT, 'packages/registry/items'),
  path.join(REPOSITORY_ROOT, 'apps/docs/content'),
];

// Written for Radix only. A page of either base renders its prose, so these belong inside a Radix `<BaseOnly>`.
const RADIX_ONLY_API = /asChild|onOpenAutoFocus|onCloseAutoFocus|PopoverAnchor|checked=["']indeterminate["']|radix-ui/;

// Guides outside the per-base sections that explain how the two bases differ, so they name both APIs on purpose.
const GUIDES_ON_BOTH_BASES = ['apps/docs/content/docs/agent-skills.mdx', 'apps/docs/content/docs/contribution.mdx'];

const documents = readDocuments(MDX_ROOTS.flatMap((root) => filesUnder(root, ['.mdx'])));

const withoutRadixBlocks = (text: string): string =>
  text.replace(BASE_ONLY_BLOCK, (block, base: string) => (base === 'radix' ? '' : block));

describe('the prose of the docs pages', () => {
  test('is found', () => {
    expect(documents.length).toBeGreaterThan(40);
  });

  test.each(
    documents.filter(({ name }) => !GUIDES_ON_BOTH_BASES.includes(name)).map(({ name, text }) => [name, text] as const),
  )('%s shows no Radix-only API outside a Radix block', (_name, text) => {
    expect(withoutRadixBlocks(text).match(RADIX_ONLY_API)).toBeNull();
  });

  test.each(GUIDES_ON_BOTH_BASES)('%s is exempt because it names a Radix-only API on purpose', (name) => {
    const guide = documents.find((document) => document.name === name);

    expect(guide).toBeDefined();
    expect(withoutRadixBlocks(guide?.text ?? '').match(RADIX_ONLY_API)).not.toBeNull();
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
