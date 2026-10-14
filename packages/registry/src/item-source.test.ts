import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readItemSource } from './item-source';

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
