import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, type Mock, spyOn, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildIndexTs,
  buildRegistryJson,
  buildStubContent,
  computeStubPath,
  readRootCatalog,
  type ScannedItem,
  scanItems,
} from './generate';

const REGISTRY_ROOT = path.resolve(import.meta.dir, '..');

describe('scanItems', () => {
  let itemsDir: string;
  let warn: Mock<typeof console.warn>;

  const write = (relPath: string, content = '') => {
    const abs = path.join(itemsDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };

  beforeEach(() => {
    itemsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-scan-'));
    warn = spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
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

    const items = scanItems(itemsDir);

    expect(items.map((i) => i.folderName)).toEqual(['alpha']);
    expect(warn).toHaveBeenCalledWith('[generate] skipping components/orphan: no component.radix.tsx');
  });

  test('fails when an item has an unsuffixed component.tsx', () => {
    write('components/alpha/component.radix.tsx');
    write('components/unsuffixed/component.tsx');

    expect(() => scanItems(itemsDir)).toThrow(
      'components/unsuffixed: component.tsx must be renamed to component.radix.tsx',
    );
  });

  test('fails when an example has no recognised base suffix', () => {
    write('components/alpha/component.radix.tsx');
    write('components/alpha/default.example.tsx');
    write('components/alpha/typo.example.radx.tsx');

    expect(() => scanItems(itemsDir)).toThrow(/default\.example\.tsx has no recognised base suffix/);
    expect(() => scanItems(itemsDir)).toThrow(/typo\.example\.radx\.tsx has no recognised base suffix/);
  });

  test('pairs Base UI overrides with the canonical files they replace', () => {
    write('components/alpha/component.radix.tsx');
    write('components/alpha/component.base.tsx');
    write('components/alpha/default.example.radix.tsx');
    write('components/alpha/default.example.base.tsx');
    write('components/alpha/wide.example.radix.tsx');

    const [alpha] = scanItems(itemsDir);

    expect(alpha?.componentOverridePath).toBe(path.join(itemsDir, 'components/alpha/component.base.tsx'));
    const overrides = Object.fromEntries(
      (alpha?.examples ?? []).map((e) => [e.filename, e.overridePath && path.basename(e.overridePath)]),
    );
    expect(overrides).toEqual({
      'default.example.radix.tsx': 'default.example.base.tsx',
      'wide.example.radix.tsx': undefined,
    });
  });

  test('fails when an example override has no canonical example', () => {
    write('components/alpha/component.radix.tsx');
    write('components/alpha/lonely.example.base.tsx');

    expect(() => scanItems(itemsDir)).toThrow(
      'components/alpha: lonely.example.base.tsx overrides lonely.example.radix.tsx, which does not exist',
    );
  });

  test('fails when no items are found', () => {
    expect(() => scanItems(itemsDir)).toThrow('no items found');
  });

  test('fails when every item is skipped', () => {
    write('components/orphan/default.example.radix.tsx');

    expect(() => scanItems(itemsDir)).toThrow('no items found');
  });
});

describe('generated paths for the registry items', () => {
  const items = scanItems();
  const nonLib = items.filter((i) => i.category !== 'lib');

  test('every stub re-exports an existing component file', () => {
    expect(nonLib.length).toBeGreaterThan(0);
    for (const item of nonLib) {
      const stubDir = path.dirname(computeStubPath(item.category, item.folderName));
      const content = buildStubContent(item.category, item.folderName);
      const specifier = content.match(/export \* from '([^']+)'/)?.[1];

      expect(specifier).toBeDefined();
      expect(`${path.resolve(stubDir, specifier as string)}.tsx`).toBe(item.componentPath);
    }
  });

  test('every __index__.ts path and lazy import specifier resolves to an existing file', () => {
    const index = buildIndexTs(items);
    const pathSpecifiers = [...index.matchAll(/path: '(@repo\/registry\/[^']+)'/g)].map((m) => m[1] as string);
    const importSpecifiers = [...index.matchAll(/import\('(@repo\/registry\/[^']+)'\)/g)].map((m) => m[1] as string);
    const expectedCount = nonLib.length + nonLib.reduce((n, i) => n + i.examples.length, 0);

    expect(pathSpecifiers).toHaveLength(expectedCount);
    expect(importSpecifiers).toEqual(pathSpecifiers);
    for (const specifier of importSpecifiers) {
      expect(fs.existsSync(path.join(REGISTRY_ROOT, `${specifier.replace('@repo/registry/', '')}.tsx`))).toBe(true);
    }
  });

  test('the Base UI index lazily imports the generated copy of every component and example', () => {
    const index = buildIndexTs(items, 'base');
    const pathSpecifiers = [...index.matchAll(/path: '([^']+)'/g)].map((m) => m[1] as string);
    const importSpecifiers = [...index.matchAll(/import\('([^']+)'\)/g)].map((m) => m[1] as string);
    const expectedCount = nonLib.length + nonLib.reduce((n, i) => n + i.examples.length, 0);

    expect(pathSpecifiers).toHaveLength(expectedCount);
    expect(importSpecifiers).toEqual(pathSpecifiers);
    for (const specifier of importSpecifiers) {
      expect(specifier).toMatch(/^\.\/items\/.+\.base$/);
      expect(fs.existsSync(path.join(REGISTRY_ROOT, 'generated', 'base', `${specifier}.tsx`))).toBe(true);
    }
  });

  test('both indexes expose the same keys', () => {
    const keysOf = (index: string) => [...index.matchAll(/^ {2}'([^']+)': \{/gm)].map((m) => m[1]);

    expect(keysOf(buildIndexTs(items, 'base'))).toEqual(keysOf(buildIndexTs(items)));
  });

  test.each(['radix', 'base'] as const)('the %s index leaves the sources to the server', (variant) => {
    expect(buildIndexTs(items, variant)).not.toContain('code:');
  });
});

const PRIMITIVES_DIR = path.resolve(import.meta.dir, '../../ui/src/components/ui');

const writeItem = (
  root: string,
  category: ScannedItem['category'],
  folderName: string,
  source: string,
  meta?: object,
): ScannedItem => {
  const itemDir = path.join(root, 'items', category, folderName);
  fs.mkdirSync(itemDir, { recursive: true });
  const componentPath = path.join(itemDir, 'component.radix.tsx');
  fs.writeFileSync(componentPath, source);
  if (meta) fs.writeFileSync(path.join(itemDir, 'meta.shuip.json'), JSON.stringify(meta));
  return { category, folderName, itemDir, componentPath, examples: [], extras: [], hasMdx: false };
};

describe('buildRegistryJson', () => {
  let root: string;
  let entries: Record<string, { dependencies?: string[]; registryDependencies?: string[] }>;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-generate-'));
    const items = [
      writeItem(
        root,
        'tanstack-form',
        'widget',
        [
          "import { Input } from '@/components/ui/input';",
          "import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';",
          "import { format } from 'date-fns';",
          "import { useState } from 'react';",
        ].join('\n'),
      ),
      writeItem(
        root,
        'components',
        'panel',
        [
          "import { Button } from '@/components/ui/button';",
          "import { cn } from '@/lib/utils';",
          "import { parseTime } from '@/lib/time';",
          "import { SideDialog } from '@/components/ui/shuip/side-dialog';",
        ].join('\n'),
        { dependsOn: ['title-section'] },
      ),
    ];
    const registry = buildRegistryJson(items, { 'date-fns': '^4.2.1' });
    entries = Object.fromEntries(registry.items.map((item) => [item.name, item]));
  });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  test('namespaces the shuip item behind a prefixed category and keeps the primitive bare', () => {
    expect(entries['tsf-widget']?.registryDependencies).toEqual(['@shuip/tsf-form-context', 'input']);
  });

  test('pins npm packages from the catalog and leaves react to the project', () => {
    expect(entries['tsf-widget']?.dependencies).toEqual(['date-fns@^4.2.1']);
  });

  test('namespaces lib items, direct shuip imports and meta dependsOn, ignoring @/lib/utils', () => {
    expect(entries.panel?.registryDependencies).toEqual([
      '@shuip/side-dialog',
      '@shuip/time',
      '@shuip/title-section',
      'button',
    ]);
  });

  test('fails when an imported package has no catalog entry', () => {
    const item = writeItem(root, 'components', 'orphan', "import x from 'left-pad';");
    expect(() => buildRegistryJson([item], {})).toThrow('orphan imports "left-pad"');
  });
});

describe('real registry items', () => {
  test('every imported npm package has an entry in the root catalog', () => {
    expect(() => buildRegistryJson(scanItems(), readRootCatalog())).not.toThrow();
  });

  const { items } = buildRegistryJson(scanItems(), readRootCatalog());
  const published = new Set(items.map((item) => item.name));

  test('tsf fields depend on the namespaced form context', () => {
    const field = items.find((item) => item.name === 'tsf-input-field');
    expect(field?.registryDependencies).toContain('@shuip/tsf-form-context');
  });

  test('every dependency is either a namespaced published item or a bare shadcn primitive', () => {
    const primitives = new Set(fs.readdirSync(PRIMITIVES_DIR).map((filename) => filename.replace(/\.tsx$/, '')));
    const misclassified = items.flatMap((item) =>
      (item.registryDependencies ?? [])
        .filter((dep) =>
          dep.startsWith('@shuip/') ? !published.has(dep.slice('@shuip/'.length)) : !primitives.has(dep),
        )
        .map((dep) => `${item.name} -> ${dep}`),
    );
    expect(misclassified).toEqual([]);
  });
});
