import { blocks, components, docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { resolveBaseOnly } from './base-only';
import {
  type Base,
  type BasedSection,
  DEFAULT_BASE,
  otherVariantsNote,
  parseBasedPath,
  type Section,
} from './base-routes';
import { icon, sectionLoaders, sectionParams, sidebarTreeFor } from './section-sources';

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

/** The `generateStaticParams` of the `[base]/[[...slug]]` routes of a section. */
export const paramsOfSection = (section: BasedSection) =>
  sectionParams(section === 'components' ? componentsSources : blocksSources);

// Search and llms-full.txt list the pages of the default base only; each page points at its other variants.
export const allPages = () => [
  ...docsSource.getPages(),
  ...blocksSources[DEFAULT_BASE].getPages(),
  ...componentsSources[DEFAULT_BASE].getPages(),
];

export const sidebarTreeOf = (section: BasedSection, base: Base) =>
  sidebarTreeFor(section, base, {
    components: componentsSources,
    blocks: blocksSources,
    guides: docsSource.pageTree.children,
  });

export function getPageImage(page: AnyPage, section: Section) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/og/${section}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: AnyPage) {
  const base = parseBasedPath(page.url)?.base;
  const processed = await page.data.getText('processed');
  const note = otherVariantsNote(page.url);

  return `# ${page.data.title} (${page.url})
${note ? `\n${note}\n` : ''}
${base ? resolveBaseOnly(processed, base) : processed}`;
}
