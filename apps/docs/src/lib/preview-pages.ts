import { parseExampleKey } from '@repo/registry/example-key';
import { listItemExamples } from '@repo/registry/item-source';
import { BASES, type Base } from './base-routes';
import type { SectionSources } from './section-sources';
import { sectionSources } from './source';

export interface PreviewParams {
  base: Base;
  item: string;
  example: string;
}

type DocumentedSources = Pick<SectionSources, 'components' | 'blocks'>;

const documentedPages = (base: Base, { components, blocks }: DocumentedSources) =>
  [components, blocks].flatMap((section) =>
    section[base]
      .getPages()
      .flatMap((page) =>
        page.data.registryName ? [{ item: page.data.registryName, title: page.data.title, url: page.url }] : [],
      ),
  );

export interface PreviewPage {
  title: string;
  url: string;
}

/** The docs page of an item, which the full-page view of its examples names and returns to. */
export const previewPageOf = (
  base: Base,
  item: string,
  sources: DocumentedSources = sectionSources,
): PreviewPage | undefined => {
  const page = documentedPages(base, sources).find((candidate) => candidate.item === item);
  return page && { title: page.title, url: page.url };
};

/** The `generateStaticParams` of the full-page route: every example of every documented item under every base. */
export const previewParams = (sources: DocumentedSources = sectionSources): PreviewParams[] =>
  BASES.flatMap((base) =>
    documentedPages(base, sources).flatMap(({ item }) =>
      listItemExamples(base, item).flatMap((key) => {
        const parsed = parseExampleKey(key);
        return parsed ? [{ base, item, example: parsed.exampleName }] : [];
      }),
    ),
  );
