import { blocks, components, docs } from 'fumadocs-mdx:collections/server';
import type { Item, Node, Root, Separator } from 'fumadocs-core/page-tree';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import React from 'react';

const icon = (icon?: string) => {
  if (!icon) {
    return null;
  }
  if (icon in icons) return React.createElement(icons[icon as keyof typeof icons]);
};

export const docsSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  icon,
});

export const blocksSource = loader({
  baseUrl: '/blocks',
  source: blocks.toFumadocsSource(),
  icon,
});

export const componentsSource = loader({
  baseUrl: '/components',
  source: components.toFumadocsSource(),
  icon,
});

export const allPages = () => [...docsSource.getPages(), ...blocksSource.getPages(), ...componentsSource.getPages()];

function buildSidebarTree(): Root {
  const pages = componentsSource.getPages();
  const pageNode = (page: { url: string; data: { title: string } }): Item => ({
    type: 'page',
    name: page.data.title,
    url: page.url,
  });
  const separator = (name: string): Separator => ({ type: 'separator', name });
  const guide = (url: string): Node[] => {
    const page = pages.find((p) => p.url === url);
    return page ? [pageNode(page)] : [];
  };
  const fields = (category: string): Node[] =>
    pages
      .filter((page) => page.slugs[0] === category && page.slugs.length === 2)
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map(pageNode);
  const uiComponents = (): Node[] =>
    pages
      .filter((page) => page.slugs.length === 1 && page.data.registryName)
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map(pageNode);

  return {
    name: 'Documentation',
    children: [
      ...docsSource.pageTree.children,
      { type: 'page', url: '/llms-full.txt', name: 'llms-full.txt' },
      ...guide('/components'),
      ...guide('/components/react-hook-form'),
      ...guide('/components/tanstack-form'),
      ...guide('/components/tanstack-query'),
      separator('Components'),
      ...uiComponents(),
      separator('React Hook Form'),
      ...fields('react-hook-form'),
      separator('TanStack Form'),
      ...fields('tanstack-form'),
      separator('TanStack Query'),
      ...fields('tanstack-query'),
    ],
  };
}

export const sidebarTree = buildSidebarTree();

export function getPageImage(
  page: InferPageType<typeof docsSource | typeof blocksSource | typeof componentsSource>,
  docsType: 'docs' | 'blocks' | 'components',
) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/og/${docsType}/${segments.join('/')}`,
  };
}

export async function getLLMText(
  page: InferPageType<typeof docsSource | typeof blocksSource | typeof componentsSource>,
) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
