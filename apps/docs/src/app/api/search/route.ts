import { createSearchAPI } from 'fumadocs-core/search/server';
import { allPages } from '@/lib/source';

export const { GET } = createSearchAPI('advanced', {
  language: 'english',
  indexes: allPages().map((page) => ({
    id: page.url,
    url: page.url,
    title: page.data.title,
    description: page.data.description,
    structuredData: page.data.structuredData,
  })),
});
