import { createFromSource } from 'fumadocs-core/search/server';
import { blocksSource, componentsSource, docsSource } from '@/lib/source';

export const { GET } = createFromSource(docsSource, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
});

export const { GET: GETComponents } = createFromSource(componentsSource, {
  language: 'english',
});

export const { GET: GETBlocks } = createFromSource(blocksSource, {
  language: 'english',
});
