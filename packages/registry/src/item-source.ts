import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exampleKey, parseExampleKey } from './example-key';
import { registryFilename } from './registry-file';
import type { Variant } from './style-base';

const REGISTRY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface PublishedRegistry {
  items: { name: string; files?: { path: string }[] }[];
}

const publishedFileOf = (variant: Variant, name: string, registryRoot: string): string => {
  const registry: PublishedRegistry = JSON.parse(
    fs.readFileSync(path.join(registryRoot, registryFilename(variant)), 'utf-8'),
  );
  const publishedFile = registry.items.find((item) => item.name === name)?.files?.[0]?.path;
  if (!publishedFile) throw new Error(`${name} is not published in the ${variant} registry`);
  return publishedFile;
};

/**
 * The source a consumer receives for an item of a variant, read from the files its registry publishes.
 * `key` is the item name, or the key of one of its examples (see `exampleKey`); an example lives next to the
 * published file and carries the suffix of the variant. `registryRoot` is the registry package folder.
 */
export const readItemSource = (variant: Variant, key: string, registryRoot: string = REGISTRY_ROOT): string => {
  const example = parseExampleKey(key);
  if (!example && key.includes('.')) throw new Error(`${key} is neither an item nor an example`);

  const publishedFile = publishedFileOf(variant, example?.itemName ?? key, registryRoot);
  const filePath = example
    ? path.join(path.dirname(publishedFile), `${example.exampleName}.example.${variant}.tsx`)
    : publishedFile;
  const absolutePath = path.join(registryRoot, filePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`${key} has no source for the ${variant} registry`);
  return fs.readFileSync(absolutePath, 'utf-8');
};

/** The example keys of an item for a variant, in the order the docs show them. */
export const listItemExamples = (variant: Variant, name: string, registryRoot: string = REGISTRY_ROOT): string[] => {
  const folder = path.join(registryRoot, path.dirname(publishedFileOf(variant, name, registryRoot)));
  const suffix = `.example.${variant}.tsx`;
  return fs
    .readdirSync(folder)
    .filter((file) => file.endsWith(suffix))
    .map((file) => exampleKey(name, file.slice(0, -suffix.length)))
    .sort();
};
