import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildIndexTs, computeStubPath, scanItems, stubExportPath } from './generate';

const REGISTRY_ROOT = path.resolve(import.meta.dir, '..');

describe('scanItems', () => {
  let itemsDir: string;

  const write = (relPath: string, content = '') => {
    const abs = path.join(itemsDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };

  beforeEach(() => {
    itemsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-scan-'));
  });

  afterEach(() => {
    fs.rmSync(itemsDir, { recursive: true, force: true });
  });

  test('finds items with their canonical component and radix examples', () => {
    write('components/alpha/component.radix.tsx');
    write('components/alpha/default.example.radix.tsx');
    write('components/alpha/wide.example.radix.tsx');
    write('components/alpha/index.mdx');
    write('react-hook-form/beta/component.radix.tsx');
    write('lib/time/time.ts');

    const items = scanItems(itemsDir);

    expect(items.map((i) => `${i.category}/${i.folderName}`).sort()).toEqual([
      'components/alpha',
      'lib/time',
      'react-hook-form/beta',
    ]);
    const alpha = items.find((i) => i.folderName === 'alpha');
    expect(alpha?.examples.map((e) => e.filename).sort()).toEqual([
      'default.example.radix.tsx',
      'wide.example.radix.tsx',
    ]);
    expect(alpha?.hasMdx).toBe(true);
  });

  test('skips an item without component.radix.tsx and warns', () => {
    write('components/alpha/component.radix.tsx');
    write('components/orphan/default.example.radix.tsx');
    const warn = spyOn(console, 'warn').mockImplementation(() => {});

    const items = scanItems(itemsDir);

    expect(items.map((i) => i.folderName)).toEqual(['alpha']);
    expect(warn).toHaveBeenCalledWith('[generate] skipping components/orphan: no component.radix.tsx');
    warn.mockRestore();
  });

  test('fails when an item still has a legacy component.tsx', () => {
    write('components/alpha/component.radix.tsx');
    write('components/legacy/component.tsx');

    expect(() => scanItems(itemsDir)).toThrow(
      'components/legacy: component.tsx must be renamed to component.radix.tsx',
    );
  });

  test('fails when an example has no recognised base suffix', () => {
    write('components/alpha/component.radix.tsx');
    write('components/alpha/default.example.tsx');
    write('components/alpha/typo.example.radx.tsx');

    expect(() => scanItems(itemsDir)).toThrow(/default\.example\.tsx has no recognised base suffix/);
    expect(() => scanItems(itemsDir)).toThrow(/typo\.example\.radx\.tsx has no recognised base suffix/);
  });

  test('fails when no items are found', () => {
    expect(() => scanItems(itemsDir)).toThrow('no items found');
  });

  test('fails when every item is skipped', () => {
    write('components/orphan/default.example.radix.tsx');
    const warn = spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => scanItems(itemsDir)).toThrow('no items found');
    warn.mockRestore();
  });
});

describe('generated paths for the registry items', () => {
  const items = scanItems();
  const nonLib = items.filter((i) => i.category !== 'lib');

  test('every stub re-exports an existing component file', () => {
    expect(nonLib.length).toBeGreaterThan(0);
    for (const item of nonLib) {
      const stubDir = path.dirname(computeStubPath(item.category, item.folderName));
      const target = `${path.resolve(stubDir, stubExportPath(item.category, item.folderName))}.tsx`;
      expect(fs.existsSync(target)).toBe(true);
      expect(target).toBe(item.componentPath);
    }
  });

  test('every __index__.ts specifier resolves to an existing file', () => {
    const specifiers = [...buildIndexTs(items).matchAll(/path: '@repo\/registry\/([^']+)'/g)].map(
      (m) => m[1] as string,
    );
    const expectedCount = nonLib.length + nonLib.reduce((n, i) => n + i.examples.length, 0);

    expect(specifiers).toHaveLength(expectedCount);
    for (const specifier of specifiers) {
      expect(fs.existsSync(path.join(REGISTRY_ROOT, `${specifier}.tsx`))).toBe(true);
    }
  });
});
