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
    fs.writeFileSync(path.join(root, 'items', 'demo.tsx'), 'export const Demo = () => null;\n');
    fs.writeFileSync(
      path.join(root, 'registry.json'),
      JSON.stringify({
        name: 'shuip',
        homepage: 'https://example.test',
        items: [
          {
            name: 'demo',
            type: 'registry:ui',
            registryDependencies: ['@shuip/other', 'button'],
            files: [{ path: './items/demo.tsx', type: 'registry:ui', target: './components/ui/shuip/demo.tsx' }],
          },
        ],
      }),
    );
    logs = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logs.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });

  const runBuild = () => build({ cwd: root, registryFile: path.join(root, 'registry.json'), outputDir });

  test('publishes items and the registry index under the radix variant folder only', async () => {
    await runBuild();

    expect(fs.readdirSync(outputDir)).toEqual(['radix']);
    expect(fs.readdirSync(path.join(outputDir, 'radix')).sort()).toEqual(['demo.json', 'registry.json']);
  });

  test('inlines file contents into the published item', async () => {
    await runBuild();

    const item = JSON.parse(fs.readFileSync(path.join(outputDir, 'radix', 'demo.json'), 'utf-8'));
    expect(item.files[0].content).toBe('export const Demo = () => null;\n');
    expect(item.registryDependencies).toEqual(['@shuip/other', 'button']);
  });

  test('removes previously published flat files', async () => {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'demo.json'), '{}');

    await runBuild();

    expect(fs.existsSync(path.join(outputDir, 'demo.json'))).toBe(false);
  });

  test('rejects an invalid registry file without touching the output', async () => {
    fs.writeFileSync(path.join(root, 'registry.json'), JSON.stringify({ name: 'shuip' }));

    await expect(runBuild()).rejects.toThrow('Invalid registry file');
    expect(fs.existsSync(outputDir)).toBe(false);
  });
});
