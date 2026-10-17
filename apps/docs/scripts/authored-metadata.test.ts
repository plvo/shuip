import { afterAll, beforeAll, describe, expect, spyOn, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildRegistries, scanItems, writeBaseVariant, writeRegistries } from '@repo/registry/generate';
import { registryFilename } from '@repo/registry/registry-file';
import { PUBLISHED_VARIANTS } from '@repo/registry/style-base';
import { build } from './shadcn-build';

const REGISTRY_ROOT = path.resolve(import.meta.dir, '..', '..', '..', 'packages', 'registry');

const AUTHORED_FIELDS = {
  title: 'Demo',
  description: 'An item that carries authored metadata.',
  author: 'plvo',
  categories: ['demo', 'dialog'],
  docs: 'Mount the provider once.',
  meta: { stability: 'stable' },
  cssVars: { theme: { 'font-demo': 'Poppins' }, light: { demo: 'red' }, dark: { demo: 'blue' } },
  css: { '@layer base': { body: { 'font-size': '16px' } } },
  envVars: { DEMO_URL: 'http://localhost:3000' },
};

describe('authored metadata of meta.shuip.json', () => {
  let root: string;
  let registryDir: string;
  let outputDir: string;

  const readJson = (...segments: string[]) => JSON.parse(fs.readFileSync(path.join(...segments), 'utf-8'));

  beforeAll(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-authored-'));
    registryDir = path.join(root, 'registry');
    outputDir = path.join(root, 'public', 'r');
    const itemsDir = path.join(registryDir, 'items');
    const itemDir = path.join(itemsDir, 'components', 'demo');
    fs.mkdirSync(itemDir, { recursive: true });
    fs.writeFileSync(path.join(itemDir, 'component.radix.tsx'), 'export const Demo = () => null;\n');
    fs.writeFileSync(path.join(itemDir, 'meta.shuip.json'), JSON.stringify(AUTHORED_FIELDS));

    const items = scanItems(itemsDir);
    const baseVariant = writeBaseVariant(items, { outDir: path.join(registryDir, 'generated', 'base'), itemsDir });
    writeRegistries(
      registryDir,
      buildRegistries({
        items,
        catalog: {},
        publishedComponentPath: baseVariant.publishedComponentPath,
        extraItems: [],
      }),
    );
    const logs = spyOn(console, 'log').mockImplementation(() => {});
    await build({ cwd: REGISTRY_ROOT, registryDir, outputDir });
    logs.mockRestore();
  });

  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  test.each(PUBLISHED_VARIANTS)('reach the %s registry file', (variant) => {
    const registry = readJson(registryDir, registryFilename(variant));

    expect(registry.items[0]).toMatchObject({ name: 'demo', ...AUTHORED_FIELDS });
  });

  test.each(PUBLISHED_VARIANTS)('reach the %s item and registry index that are published', (variant) => {
    const item = readJson(outputDir, variant, 'demo.json');
    const index = readJson(outputDir, variant, 'registry.json');

    expect(item).toMatchObject(AUTHORED_FIELDS);
    expect(item.files).toHaveLength(1);
    expect(index.items[0]).toMatchObject(AUTHORED_FIELDS);
  });
});
