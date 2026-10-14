import fs from 'node:fs';
import path from 'node:path';
import { registryFilename } from './registry-file';
import type { Variant } from './style-base';

const EXAMPLE_KEY = /^([^.]+)\.(?:(.+)\.)?example$/;

interface PublishedRegistry {
  items: { name: string; files?: { path: string }[] }[];
}

/**
 * The source a consumer receives for an item of a variant, read from the files its registry publishes.
 * `name` is the item itself; `name.example` and `name.<variant>.example` are its examples, which live next to the
 * published file and carry the same suffix. `registryRoot` is the registry package folder that holds the registry files.
 */
export const readItemSource = (variant: Variant, key: string, registryRoot: string): string => {
  const example = EXAMPLE_KEY.exec(key);
  const name = example?.[1] ?? key;
  if (!example && key.includes('.')) throw new Error(`${key} is neither an item nor an example`);

  const registry: PublishedRegistry = JSON.parse(
    fs.readFileSync(path.join(registryRoot, registryFilename(variant)), 'utf-8'),
  );
  const publishedFile = registry.items.find((item) => item.name === name)?.files?.[0]?.path;
  if (!publishedFile) throw new Error(`${name} is not published in the ${variant} registry`);

  const filePath = example
    ? path.join(path.dirname(publishedFile), `${example[2] ?? 'default'}.example.${variant}.tsx`)
    : publishedFile;
  const absolutePath = path.join(registryRoot, filePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`${key} has no source for the ${variant} registry`);
  return fs.readFileSync(absolutePath, 'utf-8');
};
