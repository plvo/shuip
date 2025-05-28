import { allDocuments } from 'contentlayer/generated';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';

interface GetItemFromSlugReturns {
  itemName: string | null;
  examples: string[] | null;
}

export function getItemFromSlug(slug: string[]): GetItemFromSlugReturns {
  if (!slug.length) {
    return { itemName: null, examples: [] };
  }

  const [itemName] = slug;
  const examples = COMPONENT_CATEGORIES[itemName] || null;

  return { itemName, examples };
}
