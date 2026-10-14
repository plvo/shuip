import { describe, expect, test } from 'bun:test';
import type { Node } from 'fumadocs-core/page-tree';
import { type Base, sectionUrl } from './base-routes';
import { buildSidebarTree, type SidebarPage } from './sidebar-tree';

const page = (base: Base, slugs: string[], title: string, registryName?: string): SidebarPage => ({
  url: sectionUrl('components', base, slugs),
  slugs,
  data: { title, registryName },
});

const pagesOf = (base: Base): SidebarPage[] => [
  page(base, [], 'Components'),
  page(base, ['react-hook-form'], 'React Hook Form'),
  page(base, ['tanstack-form'], 'TanStack Form'),
  page(base, ['tanstack-query'], 'TanStack Query'),
  page(base, ['side-dialog'], 'Side Dialog', 'side-dialog'),
  page(base, ['copy-button'], 'Copy Button', 'copy-button'),
  page(base, ['react-hook-form', 'select-field'], 'Select Field', 'rhf-select-field'),
  page(base, ['react-hook-form', 'input-field'], 'Input Field', 'rhf-input-field'),
  page(base, ['tanstack-form', 'input-field'], 'Input Field', 'tsf-input-field'),
  page(base, ['tanstack-query', 'query-boundary'], 'Query Boundary', 'tsq-query-boundary'),
];

const guides: Node[] = [{ type: 'page', name: 'Introduction', url: '/docs' }];

const labels = (nodes: Node[]) => nodes.map((node) => ('name' in node ? node.name : undefined));
const urls = (nodes: Node[]) => nodes.flatMap((node) => (node.type === 'page' ? [node.url] : []));

describe('buildSidebarTree', () => {
  const tree = buildSidebarTree({ base: 'base', guides, pages: pagesOf('base') });

  test('lists the guides, the category guides, then each category under a separator', () => {
    expect(labels(tree.children)).toEqual([
      'Introduction',
      'llms-full.txt',
      'Components',
      'React Hook Form',
      'TanStack Form',
      'TanStack Query',
      'Components',
      'Copy Button',
      'Side Dialog',
      'React Hook Form',
      'Input Field',
      'Select Field',
      'TanStack Form',
      'Input Field',
      'TanStack Query',
      'Query Boundary',
    ]);
    expect(tree.children.filter((node) => node.type === 'separator').map((node) => labels([node])[0])).toEqual([
      'Components',
      'React Hook Form',
      'TanStack Form',
      'TanStack Query',
    ]);
  });

  test('keeps the guides of /docs on their own addresses', () => {
    expect(urls(tree.children)).toContain('/docs');
    expect(urls(tree.children)).toContain('/llms-full.txt');
  });

  test('leaves out a category guide that has no page', () => {
    const withoutGuide = pagesOf('base').filter((p) => p.url !== '/components/base/tanstack-query');
    const reduced = buildSidebarTree({ base: 'base', guides, pages: withoutGuide });

    expect(urls(reduced.children)).not.toContain('/components/base/tanstack-query');
    expect(urls(reduced.children)).toContain('/components/base/tanstack-query/query-boundary');
  });
});
