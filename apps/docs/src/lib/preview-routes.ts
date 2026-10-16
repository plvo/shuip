import { exampleKey, parseExampleKey } from '@repo/registry/example-key';
import { filenameToTitle } from '@/lib/utils';
import type { Base } from './base-routes';

const PREVIEW_SEGMENT = 'preview';

/** The address of the full-page view of an example, which `registryName` is the key of. */
export const previewUrl = (base: Base, registryName: string): string => {
  const parsed = parseExampleKey(registryName);
  if (!parsed) throw new Error(`${registryName} is not an example`);
  return ['', PREVIEW_SEGMENT, base, parsed.itemName, parsed.exampleName].join('/');
};

export const exampleKeyOf = (item: string, example: string): string => exampleKey(item, example);

/** What the reader calls an example: `Default` for the one every item has, the title of its name otherwise. */
export const exampleTitle = (registryName: string): string => {
  const parsed = parseExampleKey(registryName);
  return filenameToTitle(parsed?.exampleName ?? registryName);
};

/** The accessible name of the button that opens an example full page. */
export const previewLabel = (registryName: string): string => {
  const parsed = parseExampleKey(registryName);
  const subject = parsed?.exampleName === 'default' ? [] : [exampleTitle(registryName)];
  return ['Open', filenameToTitle(parsed?.itemName ?? registryName), ...subject, 'full page'].join(' ');
};
