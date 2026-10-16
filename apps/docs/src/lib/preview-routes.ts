import { DEFAULT_EXAMPLE, parseExampleKey } from '@repo/registry/example-key';
import { filenameToTitle } from '@/lib/utils';
import type { Base } from './base-routes';

const PREVIEW_SEGMENT = 'preview';

/** The address of the full-page view of an example, which `registryName` is the key of. */
export const previewUrl = (base: Base, registryName: string): string => {
  const parsed = parseExampleKey(registryName);
  if (!parsed) throw new Error(`${registryName} is not an example`);
  return ['', PREVIEW_SEGMENT, base, parsed.itemName, parsed.exampleName].join('/');
};

/** What the reader calls an example: `Default` for the one every item has, the title of its name otherwise. */
export const exampleTitle = (registryName: string): string => {
  const parsed = parseExampleKey(registryName);
  return filenameToTitle(parsed?.exampleName ?? registryName);
};

/**
 * The accessible name of the button that opens an example full page. `itemTitle` is the title of the docs page of
 * the item, which is what the page says; without one the name of the item stands in.
 */
export const previewLabel = (registryName: string, itemTitle?: string): string => {
  const parsed = parseExampleKey(registryName);
  const subject = parsed?.exampleName === DEFAULT_EXAMPLE ? [] : [exampleTitle(registryName)];
  return ['Open', itemTitle ?? filenameToTitle(parsed?.itemName ?? registryName), ...subject, 'full page'].join(' ');
};

export interface PreviewCardWiring {
  registryName: string;
  slot: string;
  href: string;
  label: string;
}

/** What a preview card needs to open its example full page: where the page is and what to call the button. */
export const previewCardWiring = (
  base: Base,
  registryName: string,
  slot: string,
  itemTitle?: string,
): PreviewCardWiring => ({
  registryName,
  slot,
  href: previewUrl(base, registryName),
  label: previewLabel(registryName, itemTitle),
});
