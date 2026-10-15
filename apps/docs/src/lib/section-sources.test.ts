import { describe, expect, test } from 'bun:test';
import type { Node } from 'fumadocs-core/page-tree';
import { BASES } from './base-routes';
import { mapBases, sectionLoaders, sectionPageUrls, sectionParams, sidebarTreeFor } from './section-sources';

const page = (path: string, title: string, registryName?: string) => ({
  type: 'page' as const,
  path,
  data: { title, registryName },
});

const COMPONENT_FILES = [
  page('index.mdx', 'Components'),
  page('react-hook-form/index.mdx', 'React Hook Form'),
  page('tanstack-form/index.mdx', 'TanStack Form'),
  page('tanstack-query/index.mdx', 'TanStack Query'),
  page('side-dialog.mdx', 'Side Dialog', 'side-dialog'),
  page('react-hook-form/input-field.mdx', 'Input Field', 'rhf-input-field'),
  page('tanstack-query/query-boundary.mdx', 'Query Boundary', 'tsq-query-boundary'),
];

const BLOCK_FILES = [page('index.mdx', 'Overview'), page('kanban.mdx', 'Kanban', 'kanban')];

const components = sectionLoaders('components', { files: COMPONENT_FILES });
const blocks = sectionLoaders('blocks', { files: BLOCK_FILES });
const guides: Node[] = [{ type: 'page', name: 'Introduction', url: '/docs' }];

const urlsOf = (nodes: Node[]): string[] => nodes.flatMap((node) => (node.type === 'page' ? [node.url] : []));
const basedUrlsOf = (nodes: Node[]) => urlsOf(nodes).filter((url) => url !== '/docs' && url !== '/llms-full.txt');

describe('mapBases', () => {
  test('creates one value per base', () => {
    expect(mapBases((base) => `${base}!`)).toEqual({ base: 'base!', radix: 'radix!' });
  });
});

describe('sectionLoaders', () => {
  test.each(BASES)('every page of the %s loader is addressed inside that base', (base) => {
    const urls = components[base].getPages().map((p) => p.url);

    expect(urls.length).toBe(COMPONENT_FILES.length);
    for (const url of urls) expect(url === `/components/${base}` || url.startsWith(`/components/${base}/`)).toBe(true);
  });

  test('addresses blocks inside their section and base', () => {
    expect(blocks.radix.getPages().map((p) => p.url)).toContain('/blocks/radix/kanban');
  });
});

const sources = { components, blocks, guides };

describe('sectionPageUrls', () => {
  test('lists the address of every page of the section under each base', () => {
    const urls = sectionPageUrls('components', sources);

    expect(urls.radix).toContain('/components/radix');
    expect(urls.radix).toContain('/components/radix/react-hook-form/input-field');
    expect(urls.base).toContain('/components/base/side-dialog');
  });

  test('lists the pages of the section asked for, not of the other one', () => {
    const urls = sectionPageUrls('blocks', sources);

    expect(urls.base).toContain('/blocks/base/kanban');
    for (const base of BASES) expect(urls[base].every((url) => url.startsWith(`/blocks/${base}`))).toBe(true);
  });
});

describe('sectionParams', () => {
  test('lists every page once per base', () => {
    const params = sectionParams(components);

    expect(params.length).toBe(COMPONENT_FILES.length * BASES.length);
    expect(params).toContainEqual({ base: 'radix', slug: ['react-hook-form', 'input-field'] });
    expect(params).toContainEqual({ base: 'base', slug: [] });
  });
});

describe('sidebarTreeFor', () => {
  const sources = { components, blocks, guides };

  test.each(BASES)('the components tree of %s links no other base', (base) => {
    const other = BASES.find((candidate) => candidate !== base);
    const links = basedUrlsOf(sidebarTreeFor('components', base, sources).children);

    expect(links.length).toBeGreaterThan(5);
    for (const url of links) {
      expect(url.startsWith(`/components/${base}`)).toBe(true);
      expect(url).not.toContain(`/${other}/`);
    }
  });

  test('links the category guides inside the base of the tree', () => {
    const links = urlsOf(sidebarTreeFor('components', 'radix', sources).children);

    expect(links).toContain('/components/radix');
    expect(links).toContain('/components/radix/react-hook-form');
    expect(links).toContain('/components/radix/tanstack-form');
    expect(links).toContain('/components/radix/tanstack-query');
  });

  test('keeps the guides under /docs outside the base', () => {
    expect(urlsOf(sidebarTreeFor('components', 'radix', sources).children)).toContain('/docs');
  });

  test.each(BASES)('the blocks tree of %s links that base only', (base) => {
    const urls = urlsOf(sidebarTreeFor('blocks', base, sources).children);

    expect(urls).toContain(`/blocks/${base}/kanban`);
    for (const url of urls) expect(url.startsWith(`/blocks/${base}`)).toBe(true);
  });
});
