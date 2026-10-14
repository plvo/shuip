import { listItemExamples, readItemSource } from '@repo/registry/item-source';
import type { Base } from './base-routes';

export interface ItemSources {
  /** What the CLI installs for the item on this base. */
  code: string;
  examples: { key: string; code: string }[];
}

/** The code a docs page shows for an item on a base: the installed source and each example, in display order. */
export const itemSourcesFor = (base: Base, name: string): ItemSources => ({
  code: readItemSource(base, name),
  examples: listItemExamples(base, name).map((key) => ({ key, code: readItemSource(base, key) })),
});
