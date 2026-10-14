import type { Item, Node, Root, Separator } from 'fumadocs-core/page-tree';
import { type Base, sectionUrl } from './base-routes';
import { COMPONENT_CATEGORIES } from './component-categories';

export interface SidebarPage {
  url: string;
  slugs: string[];
  data: { title: string; registryName?: string };
}

const byTitle = (a: SidebarPage, b: SidebarPage): number => a.data.title.localeCompare(b.data.title);

const pageNode = (page: Pick<SidebarPage, 'url'> & { data: { title: string } }): Item => ({
  type: 'page',
  name: page.data.title,
  url: page.url,
});

const separator = (name: string): Separator => ({ type: 'separator', name });

/**
 * One sidebar for the docs and the components section, merged by hand because fumadocs flattens a folder's index
 * and children into one position. `pages` are the component pages of `base`, so every link stays in that base;
 * `guides` are the pages under `/docs`, which have no base.
 */
export const buildSidebarTree = ({
  base,
  guides,
  pages,
}: {
  base: Base;
  guides: Node[];
  pages: SidebarPage[];
}): Root => {
  const guide = (slugs: string[]): Node[] => {
    const url = sectionUrl('components', base, slugs);
    const found = pages.find((page) => page.url === url);
    return found ? [pageNode(found)] : [];
  };
  const itemsOf = (category: string): Node[] =>
    pages
      .filter((page) =>
        category === 'components'
          ? page.slugs.length === 1 && page.data.registryName
          : page.slugs[0] === category && page.slugs.length === 2,
      )
      .sort(byTitle)
      .map(pageNode);

  return {
    name: 'Documentation',
    children: [
      ...guides,
      { type: 'page', url: '/llms-full.txt', name: 'llms-full.txt' },
      ...guide([]),
      ...COMPONENT_CATEGORIES.filter((category) => category.hasGuide).flatMap((category) => guide([category.id])),
      ...COMPONENT_CATEGORIES.flatMap((category) => [separator(category.label), ...itemsOf(category.id)]),
    ],
  };
};
