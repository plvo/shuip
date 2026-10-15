import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listItemExamples, readItemSource } from './item-source';

describe('readItemSource', () => {
  let root: string;

  const write = (relPath: string, content: string) => {
    const abs = path.join(root, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };

  const registryOf = (mainFile: string) =>
    JSON.stringify({
      name: 'shuip',
      homepage: 'https://example.test',
      items: [{ name: 'rhf-alpha', type: 'registry:ui', files: [{ path: mainFile, type: 'registry:ui' }] }],
    });

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-item-source-'));
    write('registry.json', registryOf('./items/react-hook-form/alpha/component.radix.tsx'));
    write('registry.base.json', registryOf('./generated/base/consumer/items/react-hook-form/alpha/component.base.tsx'));
    write('items/react-hook-form/alpha/component.radix.tsx', 'radix component');
    write('items/react-hook-form/alpha/default.example.radix.tsx', 'radix default example');
    write('items/react-hook-form/alpha/wide.example.radix.tsx', 'radix wide example');
    write('generated/base/consumer/items/react-hook-form/alpha/component.base.tsx', 'base component');
    write('generated/base/consumer/items/react-hook-form/alpha/default.example.base.tsx', 'base default example');
    write('generated/base/consumer/items/react-hook-form/alpha/wide.example.base.tsx', 'base wide example');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('reads the file the Radix registry publishes for an item', () => {
    expect(readItemSource('radix', 'rhf-alpha', root)).toBe('radix component');
  });

  test('reads the file the Base UI registry publishes for an item', () => {
    expect(readItemSource('base', 'rhf-alpha', root)).toBe('base component');
  });

  test('reads the default example next to the published file of the base', () => {
    expect(readItemSource('radix', 'rhf-alpha.example', root)).toBe('radix default example');
    expect(readItemSource('base', 'rhf-alpha.example', root)).toBe('base default example');
  });

  test('reads a named example next to the published file of the base', () => {
    expect(readItemSource('radix', 'rhf-alpha.wide.example', root)).toBe('radix wide example');
    expect(readItemSource('base', 'rhf-alpha.wide.example', root)).toBe('base wide example');
  });

  test('fails for an item the registry does not publish', () => {
    expect(() => readItemSource('base', 'missing', root)).toThrow('missing is not published in the base registry');
  });

  test('fails for an example the item does not have', () => {
    expect(() => readItemSource('base', 'rhf-alpha.absent.example', root)).toThrow('rhf-alpha.absent.example');
  });

  test('fails for a key that names neither an item nor an example', () => {
    expect(() => readItemSource('base', 'rhf-alpha.wide', root)).toThrow('rhf-alpha.wide');
  });
});

describe('listItemExamples', () => {
  let root: string;

  const write = (relPath: string) => {
    const abs = path.join(root, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, '');
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-item-examples-'));
    const registryOf = (mainFile: string) =>
      JSON.stringify({ items: [{ name: 'alpha', files: [{ path: mainFile }] }] });
    fs.writeFileSync(path.join(root, 'registry.json'), registryOf('./items/components/alpha/component.radix.tsx'));
    fs.writeFileSync(
      path.join(root, 'registry.base.json'),
      registryOf('./generated/base/consumer/items/components/alpha/component.base.tsx'),
    );
    write('items/components/alpha/component.radix.tsx');
    write('items/components/alpha/default.example.radix.tsx');
    write('items/components/alpha/wide.example.radix.tsx');
    write('items/components/alpha/component.base.tsx');
    write('generated/base/consumer/items/components/alpha/component.base.tsx');
    write('generated/base/consumer/items/components/alpha/default.example.base.tsx');
    write('generated/base/consumer/items/components/alpha/narrow.example.base.tsx');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('lists the examples published next to the item of the variant', () => {
    expect(listItemExamples('radix', 'alpha', root)).toEqual(['alpha.example', 'alpha.wide.example']);
    expect(listItemExamples('base', 'alpha', root)).toEqual(['alpha.example', 'alpha.narrow.example']);
  });

  test('lists nothing for an item without examples', () => {
    fs.rmSync(path.join(root, 'items/components/alpha/default.example.radix.tsx'));
    fs.rmSync(path.join(root, 'items/components/alpha/wide.example.radix.tsx'));

    expect(listItemExamples('radix', 'alpha', root)).toEqual([]);
  });

  test('fails for an item the registry does not publish', () => {
    expect(() => listItemExamples('radix', 'missing', root)).toThrow('missing is not published in the radix registry');
  });
});

describe('the registry root', () => {
  const registryFolder = path.resolve(import.meta.dir, '..');

  const publishedPath = (variant: 'base' | 'radix') => {
    const registry = JSON.parse(
      fs.readFileSync(path.join(registryFolder, variant === 'radix' ? 'registry.json' : 'registry.base.json'), 'utf-8'),
    );
    return registry.items.find((item: { name: string }) => item.name === 'side-dialog').files[0].path;
  };

  test('defaults to the package that holds the registry files', () => {
    for (const variant of ['radix', 'base'] as const) {
      expect(readItemSource(variant, 'side-dialog')).toBe(
        fs.readFileSync(path.join(registryFolder, publishedPath(variant)), 'utf-8'),
      );
    }
    expect(listItemExamples('base', 'side-dialog')).toContain('side-dialog.example');
  });
});
