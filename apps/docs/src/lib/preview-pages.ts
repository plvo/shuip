import { parseExampleKey } from '@repo/registry/example-key';
import { listItemExamples } from '@repo/registry/item-source';
import { BASES, type Base } from './base-routes';
import { blocksSources, componentsSources } from './source';

export interface PreviewParams {
  base: Base;
  item: string;
  example: string;
}

interface PageList {
  getPages(): { url: string; data: { title: string; registryName?: string } }[];
}

/** The pages of the docs that document registry items, per base. */
export interface DocumentedSources {
  components: Record<Base, PageList>;
  blocks: Record<Base, PageList>;
}

const DOCS: DocumentedSources = { components: componentsSources, blocks: blocksSources };

const documentedPages = (base: Base, sources: DocumentedSources) =>
  [sources.components, sources.blocks].flatMap((section) =>
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
export const previewPageOf = (base: Base, item: string, sources = DOCS): PreviewPage | undefined => {
  const page = documentedPages(base, sources).find((candidate) => candidate.item === item);
  return page && { title: page.title, url: page.url };
};

/** The `generateStaticParams` of the full-page route: every example of every documented item under every base. */
export const previewParams = (sources = DOCS): PreviewParams[] =>
  BASES.flatMap((base) =>
    documentedPages(base, sources).flatMap(({ item }) =>
      listItemExamples(base, item).flatMap((key) => {
        const parsed = parseExampleKey(key);
        return parsed ? [{ base, item, example: parsed.exampleName }] : [];
      }),
    ),
  );
