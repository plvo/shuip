import { describe, expect, test } from 'bun:test';
import { buildRegistryDependencies, flattenCatalogs, pinDependencies } from './dependencies';

describe('flattenCatalogs', () => {
  test('merges the default catalog and every named catalog', () => {
    const catalog = flattenCatalogs({
      workspaces: {
        catalog: { zod: '^4.0.0' },
        catalogs: { forms: { 'react-hook-form': '^7.0.0' }, radix: { '@radix-ui/react-select': '^2.0.0' } },
      },
    });
    expect(catalog).toEqual({
      zod: '^4.0.0',
      'react-hook-form': '^7.0.0',
      '@radix-ui/react-select': '^2.0.0',
    });
  });

  test('tolerates a package.json without catalogs', () => {
    expect(flattenCatalogs({})).toEqual({});
  });
});

describe('pinDependencies', () => {
  const catalog = { 'date-fns': '^4.2.1', '@tanstack/react-table': '^8.21.3', react: '^19.2.6' };

  test('appends the catalog range, including to scoped packages', () => {
    expect(pinDependencies(['@tanstack/react-table', 'date-fns'], catalog, 'data-table')).toEqual([
      '@tanstack/react-table@^8.21.3',
      'date-fns@^4.2.1',
    ]);
  });

  test('leaves react, react-dom and next to the consuming project', () => {
    expect(pinDependencies(['react', 'react-dom', 'next', 'date-fns'], catalog, 'calendar')).toEqual([
      'date-fns@^4.2.1',
    ]);
  });

  test('fails loudly, naming the package and the item, when the catalog has no entry', () => {
    expect(() => pinDependencies(['date-fns', 'left-pad'], catalog, 'calendar')).toThrow(
      'calendar imports "left-pad", which has no entry in the root Bun catalog',
    );
  });
});

describe('buildRegistryDependencies', () => {
  test('keeps shadcn primitives bare and namespaces shuip items', () => {
    expect(
      buildRegistryDependencies({
        primitives: ['popover', 'button'],
        shuipItems: ['tsf-form-context', 'time'],
      }),
    ).toEqual(['@shuip/time', '@shuip/tsf-form-context', 'button', 'popover']);
  });

  test('deduplicates items declared more than once', () => {
    expect(buildRegistryDependencies({ primitives: [], shuipItems: ['side-dialog', 'side-dialog'] })).toEqual([
      '@shuip/side-dialog',
    ]);
  });
});
