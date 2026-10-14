import { blocks, components, docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import React from 'react';
import { BASES, type Base, type BasedSection, DEFAULT_BASE, otherVariantsNote, sectionUrl } from './base-routes';
import { buildSidebarTree } from './sidebar-tree';

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

// One loader per base over the same content, so each page tree and each page address carries its base.
const blocksLoader = (base: Base) =>
  loader({ baseUrl: sectionUrl('blocks', base), source: blocks.toFumadocsSource(), icon });

const componentsLoader = (base: Base) =>
  loader({ baseUrl: sectionUrl('components', base), source: components.toFumadocsSource(), icon });

const loadersByBase = <T>(create: (base: Base) => T): Record<Base, T> =>
  Object.fromEntries(BASES.map((base) => [base, create(base)])) as Record<Base, T>;

export const blocksSources = loadersByBase(blocksLoader);

export const componentsSources = loadersByBase(componentsLoader);

type AnyPage = InferPageType<typeof docsSource | ReturnType<typeof blocksLoader> | ReturnType<typeof componentsLoader>>;

export const pageSource = (section: 'docs' | BasedSection, base: Base = DEFAULT_BASE) =>
  ({ docs: docsSource, blocks: blocksSources[base], components: componentsSources[base] })[section];

// Search and llms-full.txt list the pages of the default base only; each page points at its other variants.
export const allPages = () => [
  ...docsSource.getPages(),
  ...blocksSources[DEFAULT_BASE].getPages(),
  ...componentsSources[DEFAULT_BASE].getPages(),
];

export const sidebarTrees = loadersByBase((base) =>
  buildSidebarTree({
    base,
    guides: docsSource.pageTree.children,
    pages: componentsSources[base].getPages(),
  }),
);

export function getPageImage(page: AnyPage, docsType: 'docs' | 'blocks' | 'components') {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/og/${docsType}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: AnyPage) {
  const processed = await page.data.getText('processed');
  const note = otherVariantsNote(page.url);

  return `# ${page.data.title} (${page.url})
${note ? `\n${note}\n` : ''}
${processed}`;
}
