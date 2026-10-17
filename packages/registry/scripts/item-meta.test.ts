import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DERIVED_FIELDS, readItemMeta } from './item-meta';

describe('readItemMeta', () => {
  let itemDir: string;

  const writeMeta = (meta: unknown) => fs.writeFileSync(path.join(itemDir, 'meta.shuip.json'), JSON.stringify(meta));

  beforeEach(() => {
    itemDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-meta-'));
  });
  afterEach(() => fs.rmSync(itemDir, { recursive: true, force: true }));

  test('an item without a meta file has no metadata', () => {
    expect(readItemMeta(itemDir)).toEqual({});
  });

  test('accepts dependsOn next to every authored field', () => {
    const meta = {
      dependsOn: ['side-dialog'],
      title: 'Demo',
      description: 'A demo item.',
      author: 'plvo',
      categories: ['dialog'],
      docs: 'Wrap the app in the provider.',
      meta: { framework: 'next' },
      cssVars: { theme: { 'font-heading': 'Poppins' }, light: { brand: 'red' }, dark: { brand: 'blue' } },
      css: { '@layer base': { body: { 'font-size': '16px' } } },
      envVars: { API_URL: 'http://localhost' },
    };
    writeMeta(meta);

    expect(readItemMeta(itemDir)).toEqual(meta);
  });

  test.each(DERIVED_FIELDS)('rejects the derived field %s', (field) => {
    writeMeta({ title: 'Demo', [field]: [] });

    expect(() => readItemMeta(itemDir)).toThrow(`sets "${field}", which the generator derives`);
  });

  test('names the file when it is not valid JSON', () => {
    fs.writeFileSync(path.join(itemDir, 'meta.shuip.json'), '{ "title": ');

    expect(() => readItemMeta(itemDir)).toThrow(path.join(itemDir, 'meta.shuip.json'));
  });

  test.each(['[]', 'null'])('names the file when the root is %s instead of an object', (root) => {
    fs.writeFileSync(path.join(itemDir, 'meta.shuip.json'), root);

    expect(() => readItemMeta(itemDir)).toThrow(path.join(itemDir, 'meta.shuip.json'));
  });

  test('rejects a field the registry schema does not know', () => {
    writeMeta({ titel: 'Demo' });

    expect(() => readItemMeta(itemDir)).toThrow('titel');
  });

  test('rejects an authored field of the wrong shape', () => {
    writeMeta({ categories: 'dialog' });

    expect(() => readItemMeta(itemDir)).toThrow('categories');
  });
});
