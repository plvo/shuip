import { afterAll, beforeAll, describe, expect, spyOn, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readItemSource } from '@repo/registry/item-source';
import { PUBLISHED_VARIANTS } from '@repo/registry/style-base';
import { build } from './shadcn-build';

const REGISTRY_ROOT = path.resolve(import.meta.dir, '..', '..', '..', 'packages', 'registry');

interface PublishedItem {
  name: string;
  files?: { content: string }[];
}

describe('the source shown for a base', () => {
  let outputDir: string;

  beforeAll(async () => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-published-'));
    const logs = spyOn(console, 'log').mockImplementation(() => {});
    await build({ cwd: REGISTRY_ROOT, registryDir: REGISTRY_ROOT, outputDir });
    logs.mockRestore();
  });

  afterAll(() => {
    fs.rmSync(outputDir, { recursive: true, force: true });
  });

  test.each(PUBLISHED_VARIANTS)('equals the code the CLI installs for every %s item', (variant) => {
    const published = fs
      .readdirSync(path.join(outputDir, variant))
      .filter((file) => file !== 'registry.json')
      .map((file): PublishedItem => JSON.parse(fs.readFileSync(path.join(outputDir, variant, file), 'utf-8')))
      .filter((item) => item.files?.length);

    expect(published.length).toBeGreaterThan(40);
    for (const item of published) {
      expect(readItemSource(variant, item.name, REGISTRY_ROOT)).toBe(item.files?.[0]?.content as string);
    }
  });

  test('differs between the bases for items whose code differs', () => {
    const sideDialog = (variant: 'base' | 'radix') => readItemSource(variant, 'side-dialog', REGISTRY_ROOT);

    expect(sideDialog('base')).not.toBe(sideDialog('radix'));
    expect(sideDialog('base')).not.toContain('asChild');
    expect(sideDialog('radix')).toContain('asChild');
  });
});
