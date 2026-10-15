import type { Node, Root } from 'fumadocs-core/page-tree';
import { loader } from 'fumadocs-core/source';
import { BASES, type Base, type BasedSection, sectionUrl } from './base-routes';
import { icon } from './page-icon';
import { buildSidebarTree, type SidebarPage } from './sidebar-tree';

type LoaderSource = Parameters<typeof loader>[0]['source'];

/** One value per base, in the order of `BASES`. */
export const mapBases = <T>(create: (base: Base) => T): Record<Base, T> =>
  Object.fromEntries(BASES.map((base) => [base, create(base)])) as Record<Base, T>;

/** The pages of a section under one base, so each page address and each page tree carries that base. */
const sectionLoader = <Source extends LoaderSource>(section: BasedSection, base: Base, source: Source) =>
  loader({ baseUrl: sectionUrl(section, base), source, icon });

/** A loader per base over the same content. */
export const sectionLoaders = <Source extends LoaderSource>(section: BasedSection, source: Source) =>
  mapBases((base) => sectionLoader(section, base, source));

/** The `generateStaticParams` of a `[base]/[[...slug]]` route: every page of the section under every base. */
export const sectionParams = (
  loaders: Record<Base, { generateParams(): { slug?: string[] }[] }>,
): { base: Base; slug?: string[] }[] =>
  BASES.flatMap((base) => loaders[base].generateParams().map((params) => ({ base, ...params })));

export interface SidebarSources {
  components: Record<Base, { getPages(): SidebarPage[] }>;
  blocks: Record<Base, { pageTree: Root }>;
  /** The pages under `/docs`, which have no base. */
  guides: Node[];
}

/** The sidebar of a page of `section` under `base`. */
export const sidebarTreeFor = (
  section: BasedSection,
  base: Base,
  { components, blocks, guides }: SidebarSources,
): Root =>
  section === 'components'
    ? buildSidebarTree({ base, guides, pages: components[base].getPages() })
    : blocks[base].pageTree;
