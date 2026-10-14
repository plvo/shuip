import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from './shadcn-build';

describe('build', () => {
  let root: string;
  let outputDir: string;
  let logs: ReturnType<typeof spyOn>;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-build-'));
    outputDir = path.join(root, 'public', 'r');
    fs.mkdirSync(path.join(root, 'items'), { recursive: true });
    fs.mkdirSync(path.join(root, 'generated'), { recursive: true });
    fs.writeFileSync(path.join(root, 'items', 'demo.tsx'), 'export const Demo = () => null;\n');
    fs.writeFileSync(path.join(root, 'generated', 'demo.base.tsx'), 'export const BaseDemo = () => null;\n');
    const registryOf = (file: string) =>
      JSON.stringify({
        name: 'shuip',
        homepage: 'https://example.test',
        items: [
          {
            name: 'demo',
            type: 'registry:ui',
            registryDependencies: ['@shuip/other', 'button'],
            files: [{ path: file, type: 'registry:ui', target: './components/ui/shuip/demo.tsx' }],
          },
        ],
      });
    fs.writeFileSync(path.join(root, 'registry.json'), registryOf('./items/demo.tsx'));
    fs.writeFileSync(path.join(root, 'registry.base.json'), registryOf('./generated/demo.base.tsx'));
    logs = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logs.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });

  const runBuild = () => build({ cwd: root, registryDir: root, outputDir });

  test('publishes items and the registry index under each variant folder', async () => {
    await runBuild();

    expect(fs.readdirSync(outputDir).sort()).toEqual(['base', 'radix']);
    for (const variant of ['base', 'radix']) {
      expect(fs.readdirSync(path.join(outputDir, variant)).sort()).toEqual(['demo.json', 'registry.json']);
    }
  });

  test('inlines the files of each variant into its published item', async () => {
    await runBuild();

    const published = (variant: string) =>
      JSON.parse(fs.readFileSync(path.join(outputDir, variant, 'demo.json'), 'utf-8'));
    expect(published('radix').files[0].content).toBe('export const Demo = () => null;\n');
    expect(published('base').files[0].content).toBe('export const BaseDemo = () => null;\n');
    expect(published('base').registryDependencies).toEqual(['@shuip/other', 'button']);
  });

  test('publishes the registry index of each variant', async () => {
    await runBuild();

    const index = (variant: string) =>
      JSON.parse(fs.readFileSync(path.join(outputDir, variant, 'registry.json'), 'utf-8'));
    expect(index('radix').items[0].files[0].path).toBe('./items/demo.tsx');
    expect(index('base').items[0].files[0].path).toBe('./generated/demo.base.tsx');
  });

  test('removes previously published flat files', async () => {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'demo.json'), '{}');

    await runBuild();

    expect(fs.existsSync(path.join(outputDir, 'demo.json'))).toBe(false);
  });

  test('rejects an invalid registry file without touching the output', async () => {
    fs.writeFileSync(path.join(root, 'registry.base.json'), JSON.stringify({ name: 'shuip' }));

    await expect(runBuild()).rejects.toThrow('Invalid registry file');
    expect(fs.existsSync(outputDir)).toBe(false);
  });
});
