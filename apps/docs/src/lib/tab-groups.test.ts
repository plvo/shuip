import { describe, expect, test } from 'bun:test';
import { BASES } from './base-routes';
import { itemSourcesFor } from './item-sources';
import { previewGroupId, TAB_GROUPS } from './tab-groups';

const ITEMS = ['side-dialog', 'copy-button', 'rhf-select-field'];

const exampleKeys = (base: (typeof BASES)[number], item: string) =>
  itemSourcesFor(base, item).examples.map((example) => example.key);

describe('previewGroupId', () => {
  test.each(
    ITEMS,
  )('is the same for every example of %s whichever base shows it, so a base switch keeps its tab', (item) => {
    const [first, ...others] = BASES.map((base) => exampleKeys(base, item).map(previewGroupId));

    expect(first?.length).toBeGreaterThan(0);
    for (const ids of others) expect(ids).toEqual(first as string[]);
  });

  test.each(ITEMS)('names no base in the groups of %s', (item) => {
    for (const base of BASES) {
      for (const key of exampleKeys(base, item)) {
        const words = previewGroupId(key).split(/[^a-z]+/);

        for (const name of BASES) expect(words).not.toContain(name);
      }
    }
  });

  test('differs between examples, so each one remembers its own tab', () => {
    const ids = ITEMS.flatMap((item) => exampleKeys('base', item).map(previewGroupId));

    expect(new Set(ids).size).toBe(ids.length);
  });

  test('stays apart from the package manager group and carries the namespace of the site', () => {
    const id = previewGroupId('side-dialog.example');

    expect(id).not.toBe(TAB_GROUPS.packageManager);
    expect(id).toStartWith('shuip-');
  });
});

describe('TAB_GROUPS.packageManager', () => {
  test('namespaces the storage key shared with everything else served from the same origin', () => {
    expect(TAB_GROUPS.packageManager).toStartWith('shuip-');
  });
});
