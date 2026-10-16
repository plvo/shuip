import { describe, expect, test } from 'bun:test';
import { REGISTRY_INDEX as RADIX_INDEX } from '@repo/registry/__index__';
import { REGISTRY_INDEX as BASE_INDEX } from '@repo/registry/__index__.base';
import { parseExampleKey } from '@repo/registry/example-key';
import { BASES, type Base } from './base-routes';
import { previewPageOf, previewParams } from './preview-pages';
import { exampleKeyOf } from './preview-routes';
import { sectionLoaders } from './section-sources';

const INDEXES: Record<Base, Record<string, unknown>> = { base: BASE_INDEX, radix: RADIX_INDEX };

const exampleKeysOf = (base: Base) => Object.keys(INDEXES[base]).filter((key) => key.endsWith('.example'));

const BLOCKS = ['kanban', 'responsive-dialog', 'title-section'];

const itemsOf = (base: Base) => [
  ...new Set(exampleKeysOf(base).flatMap((key) => parseExampleKey(key)?.itemName ?? [])),
];

const page = (item: string) => ({
  type: 'page' as const,
  path: `${item}.mdx`,
  data: { title: item.toUpperCase(), registryName: item },
});

const index = { type: 'page' as const, path: 'index.mdx', data: { title: 'Index' } };

const documented = {
  components: sectionLoaders('components', {
    files: [
      index,
      ...itemsOf('base')
        .filter((item) => !BLOCKS.includes(item))
        .map(page),
    ],
  }),
  blocks: sectionLoaders('blocks', { files: [index, ...BLOCKS.map(page)] }),
};

describe('previewParams', () => {
  const params = previewParams(documented);

  test.each(BASES)('has one entry per example of the %s registry, and no other', (base) => {
    const keys = params.filter((param) => param.base === base).map((param) => exampleKeyOf(param.item, param.example));

    expect([...keys].sort()).toEqual(exampleKeysOf(base).sort());
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('has an entry for the example of a component and one of a block', () => {
    expect(params).toContainEqual({ base: 'base', item: 'copy-button', example: 'default' });
    expect(params).toContainEqual({ base: 'radix', item: 'kanban', example: 'default' });
  });

  test('leaves out an item the docs have no page for', () => {
    const withoutCopyButton = previewParams({
      components: sectionLoaders('components', { files: [index, page('side-dialog')] }),
      blocks: sectionLoaders('blocks', { files: [index] }),
    });

    expect(withoutCopyButton.map((param) => param.item)).not.toContain('copy-button');
    expect(withoutCopyButton.map((param) => param.item)).toContain('side-dialog');
  });
});

describe('previewPageOf', () => {
  test('finds the docs page of a component and of a block under the base asked for', () => {
    expect(previewPageOf('base', 'copy-button', documented)).toEqual({
      title: 'COPY-BUTTON',
      url: '/components/base/copy-button',
    });
    expect(previewPageOf('radix', 'kanban', documented)).toEqual({ title: 'KANBAN', url: '/blocks/radix/kanban' });
  });

  test('finds nothing for an item with no docs page', () => {
    expect(previewPageOf('base', 'no-such-item', documented)).toBeUndefined();
  });
});
