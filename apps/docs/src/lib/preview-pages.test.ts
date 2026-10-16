import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { REGISTRY_INDEX as RADIX_INDEX } from '@repo/registry/__index__';
import { REGISTRY_INDEX as BASE_INDEX } from '@repo/registry/__index__.base';
import { exampleKey } from '@repo/registry/example-key';
import { BASES, type Base } from './base-routes';
import { itemTitleOf, previewPageOf, previewParams } from './preview-pages';
import { sectionLoaders } from './section-sources';

const CONTENT_DIR = path.resolve(import.meta.dir, '..', '..', 'content');

const INDEXES: Record<Base, Record<string, unknown>> = { base: BASE_INDEX, radix: RADIX_INDEX };

const exampleKeysOf = (base: Base) => Object.keys(INDEXES[base]).filter((key) => key.endsWith('.example'));

const frontmatterOf = (file: string): Record<string, string> =>
  Object.fromEntries(
    [...(/^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(file, 'utf-8'))?.[1] ?? '').matchAll(/^(\w+):\s*(.+)$/gm)].map(
      ([, key, value]) => [key, (value as string).trim()],
    ),
  );

/** The pages of a section as the docs load them, from the MDX files and their frontmatter. */
const pagesOf = (section: 'components' | 'blocks') => {
  const root = path.join(CONTENT_DIR, section);
  return fs
    .readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => (entry.isFile() || entry.isSymbolicLink()) && entry.name.endsWith('.mdx'))
    .map((entry) => {
      const file = path.join(entry.parentPath, entry.name);
      const { title, registryName } = frontmatterOf(file);
      return { type: 'page' as const, path: path.relative(root, file), data: { title: title as string, registryName } };
    });
};

const docs = {
  components: sectionLoaders('components', { files: pagesOf('components') }),
  blocks: sectionLoaders('blocks', { files: pagesOf('blocks') }),
};

describe('the docs pages the full-page route is built from', () => {
  test('are read from the content of the docs', () => {
    const items = docs.components.base
      .getPages()
      .concat(docs.blocks.base.getPages())
      .flatMap((page) => page.data.registryName ?? []);

    expect(items).toContain('copy-button');
    expect(items).toContain('rhf-input-field');
    expect(items).toContain('kanban');
  });
});

describe('previewParams', () => {
  const params = previewParams(docs);

  test.each(BASES)('has one entry per example of the %s registry, so no example is left without a page', (base) => {
    const keys = params.filter((param) => param.base === base).map((param) => exampleKey(param.item, param.example));

    expect([...keys].sort()).toEqual(exampleKeysOf(base).sort());
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('has an entry for the example of a component and one of a block', () => {
    expect(params).toContainEqual({ base: 'base', item: 'copy-button', example: 'default' });
    expect(params).toContainEqual({ base: 'radix', item: 'kanban', example: 'default' });
  });

  test('leaves out an item the docs have no page for', () => {
    const withoutCopyButton = previewParams({
      components: sectionLoaders('components', {
        files: pagesOf('components').filter((page) => page.data.registryName !== 'copy-button'),
      }),
      blocks: docs.blocks,
    });

    expect(withoutCopyButton.map((param) => param.item)).not.toContain('copy-button');
  });
});

describe('previewPageOf', () => {
  test('finds the docs page of a component, under the base asked for, with the title the page shows', () => {
    expect(previewPageOf('radix', 'rhf-input-field', docs)).toEqual({
      title: 'Input Field',
      url: '/components/radix/react-hook-form/input-field',
    });
  });

  test('finds the docs page of a block', () => {
    expect(previewPageOf('base', 'kanban', docs)).toEqual({ title: 'Kanban', url: '/blocks/base/kanban' });
  });

  test('finds nothing for an item with no docs page', () => {
    expect(previewPageOf('base', 'no-such-item', docs)).toBeUndefined();
  });
});

describe('itemTitleOf', () => {
  test('is the title of the docs page of the item of an example, not its category-prefixed registry name', () => {
    expect(itemTitleOf('base', 'rhf-input-field.example', docs)).toBe('Input Field');
    expect(itemTitleOf('radix', 'rhf-input-field.with-label.example', docs)).toBe('Input Field');
  });

  test('is the title of a block page', () => {
    expect(itemTitleOf('base', 'kanban.custom-card.example', docs)).toBe('Kanban');
  });

  test('is nothing for an item with no docs page or a key that is no example', () => {
    expect(itemTitleOf('base', 'no-such-item.example', docs)).toBeUndefined();
    expect(itemTitleOf('base', 'kanban', docs)).toBeUndefined();
  });
});
