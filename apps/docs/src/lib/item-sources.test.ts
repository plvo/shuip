import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BASES } from './base-routes';
import { itemSourcesFor } from './item-sources';

// A registry whose two bases publish different files and different examples, so a lookup that ignores the base shows.
describe('itemSourcesFor', () => {
  let root: string;

  const write = (relPath: string, content: string) => {
    const abs = path.join(root, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };

  const registryOf = (mainFile: string) => JSON.stringify({ items: [{ name: 'alpha', files: [{ path: mainFile }] }] });

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-item-sources-'));
    write('registry.json', registryOf('./items/components/alpha/component.radix.tsx'));
    write('registry.base.json', registryOf('./generated/base/consumer/items/components/alpha/component.base.tsx'));
    write('items/components/alpha/component.radix.tsx', 'radix component');
    write('items/components/alpha/default.example.radix.tsx', 'radix default');
    write('items/components/alpha/wide.example.radix.tsx', 'radix wide');
    write('generated/base/consumer/items/components/alpha/component.base.tsx', 'base component');
    write('generated/base/consumer/items/components/alpha/default.example.base.tsx', 'base default');
    write('generated/base/consumer/items/components/alpha/narrow.example.base.tsx', 'base narrow');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('gathers the installed code of the base', () => {
    expect(itemSourcesFor('radix', 'alpha', root).code).toBe('radix component');
    expect(itemSourcesFor('base', 'alpha', root).code).toBe('base component');
  });

  test('gathers the examples of the base, not those of another', () => {
    expect(itemSourcesFor('radix', 'alpha', root).examples).toEqual([
      { key: 'alpha.example', code: 'radix default' },
      { key: 'alpha.wide.example', code: 'radix wide' },
    ]);
    expect(itemSourcesFor('base', 'alpha', root).examples).toEqual([
      { key: 'alpha.example', code: 'base default' },
      { key: 'alpha.narrow.example', code: 'base narrow' },
    ]);
  });

  test.each(BASES)('has no example the %s registry does not publish', (base) => {
    fs.rmSync(path.join(root, 'items/components/alpha/default.example.radix.tsx'));
    fs.rmSync(path.join(root, 'items/components/alpha/wide.example.radix.tsx'));
    fs.rmSync(path.join(root, 'generated/base/consumer/items/components/alpha/default.example.base.tsx'));
    fs.rmSync(path.join(root, 'generated/base/consumer/items/components/alpha/narrow.example.base.tsx'));

    expect(itemSourcesFor(base, 'alpha', root).examples).toEqual([]);
  });
});
