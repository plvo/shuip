import { blocks, components, docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { type Base, DEFAULT_BASE, type Section } from './base-routes';
import { icon } from './page-icon';
import { type SidebarSources, sectionLoaders, sidebarTreeFor } from './section-sources';
import { unbasedSidebarTree } from './sidebar-tree';

export const docsSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  icon,
});

export const blocksSources = sectionLoaders('blocks', blocks.toFumadocsSource());

export const componentsSources = sectionLoaders('components', components.toFumadocsSource());

type AnyPage = InferPageType<typeof docsSource | (typeof blocksSources)[Base] | (typeof componentsSources)[Base]>;

export const pageSource = (section: Section, base: Base = DEFAULT_BASE) =>
  ({ docs: docsSource, blocks: blocksSources[base], components: componentsSources[base] })[section];

// Search and llms-full.txt list the pages of the default base only; each page points at its other variants.
export const allPages = () => [
  ...docsSource.getPages(),
  ...blocksSources[DEFAULT_BASE].getPages(),
  ...componentsSources[DEFAULT_BASE].getPages(),
];

/** What the sidebars of every section are built from. */
export const sidebarSources: SidebarSources = {
  components: componentsSources,
  blocks: blocksSources,
  guides: docsSource.pageTree.children,
};

/** The sidebar of the guides under `/docs`, whose component links follow the base the reader visited last. */
export const docsSidebarTree = () => unbasedSidebarTree(sidebarTreeFor('components', DEFAULT_BASE, sidebarSources));

export function getPageImage(page: AnyPage, section: Section) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/og/${section}/${segments.join('/')}`,
  };
}
