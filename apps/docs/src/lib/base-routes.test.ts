import { describe, expect, test } from 'bun:test';
import { rewrittenPathname } from '@repo/registry/rewrite-match';
import {
  BASES,
  baseLabel,
  baseRedirects,
  DEFAULT_BASE,
  isBase,
  llmsUrl,
  otherVariantsNote,
  parseBasedPath,
  sectionUrl,
  siblingUrl,
  withBase,
} from './base-routes';

describe('bases', () => {
  test('Base UI is the default and both published variants are served', () => {
    expect(DEFAULT_BASE).toBe('base');
    expect(BASES).toEqual(['base', 'radix']);
  });

  test.each([
    ['base', true],
    ['radix', true],
    ['llms.mdx', false],
    ['Base', false],
    ['', false],
  ])('isBase(%p) is %p', (value, expected) => {
    expect(isBase(value)).toBe(expected);
  });

  test('labels the bases the way readers know them', () => {
    expect(baseLabel('base')).toBe('Base UI');
    expect(baseLabel('radix')).toBe('Radix');
  });
});

describe('sectionUrl', () => {
  test('puts the base right after the section', () => {
    expect(sectionUrl('components', 'radix', ['react-hook-form', 'input-field'])).toBe(
      '/components/radix/react-hook-form/input-field',
    );
    expect(sectionUrl('blocks', 'base', ['kanban'])).toBe('/blocks/base/kanban');
  });

  test('addresses the index of a section without slugs', () => {
    expect(sectionUrl('components', 'base')).toBe('/components/base');
  });
});

describe('llmsUrl', () => {
  test('follows the base segment after the markdown prefix', () => {
    expect(llmsUrl('components', 'radix', ['side-dialog'])).toBe('/components/llms.mdx/radix/side-dialog');
    expect(llmsUrl('blocks', 'base', [])).toBe('/blocks/llms.mdx/base');
  });
});

describe('parseBasedPath', () => {
  test('reads the section, the base and the slugs of a page', () => {
    expect(parseBasedPath('/components/radix/react-hook-form/input-field')).toEqual({
      section: 'components',
      base: 'radix',
      slugs: ['react-hook-form', 'input-field'],
    });
    expect(parseBasedPath('/blocks/base')).toEqual({ section: 'blocks', base: 'base', slugs: [] });
  });

  test.each([
    '/components',
    '/components/side-dialog',
    '/components/llms.mdx/base/side-dialog',
    '/docs/installation',
    '/',
  ])('ignores %s', (pathname) => {
    expect(parseBasedPath(pathname)).toBeNull();
  });
});

describe('siblingUrl', () => {
  test('links the same item in the other base', () => {
    expect(siblingUrl('/components/base/side-dialog', 'radix')).toBe('/components/radix/side-dialog');
    expect(siblingUrl('/components/radix/tanstack-form/input-field', 'base')).toBe(
      '/components/base/tanstack-form/input-field',
    );
    expect(siblingUrl('/blocks/base/kanban', 'radix')).toBe('/blocks/radix/kanban');
  });

  test('links the index of the section in the other base', () => {
    expect(siblingUrl('/components/base', 'radix')).toBe('/components/radix');
  });

  test('is the identity on the current base', () => {
    expect(siblingUrl('/components/radix/side-dialog', 'radix')).toBe('/components/radix/side-dialog');
  });

  test('has no sibling for a page that has no base', () => {
    expect(siblingUrl('/docs/installation', 'radix')).toBeNull();
  });
});

describe('withBase', () => {
  test('keeps a link to a component or block inside the base', () => {
    expect(withBase('/blocks/data-board', 'radix')).toBe('/blocks/radix/data-board');
    expect(withBase('/components/tanstack-form/form-context', 'base')).toBe(
      '/components/base/tanstack-form/form-context',
    );
  });

  test('keeps the hash and the query of the link', () => {
    expect(withBase('/blocks/kanban#props', 'radix')).toBe('/blocks/radix/kanban#props');
    expect(withBase('/components/side-dialog?tab=code', 'radix')).toBe('/components/radix/side-dialog?tab=code');
  });

  test.each([
    '/components/base/side-dialog',
    '/components/radix',
    '/components/llms.mdx/base/side-dialog',
    '/docs/installation',
    '/blocksmith',
    'https://example.com/components/side-dialog',
    '#props',
    './sibling',
  ])('leaves %s alone', (href) => {
    expect(withBase(href, 'radix')).toBe(href);
  });

  test('keeps a link to a section index inside the base', () => {
    expect(withBase('/components', 'radix')).toBe('/components/radix');
    expect(withBase('/blocks', 'base')).toBe('/blocks/base');
  });
});

describe('baseRedirects', () => {
  const redirects = baseRedirects();
  const redirected = (pathname: string) => rewrittenPathname(pathname, redirects);

  test('every redirect is permanent', () => {
    expect(redirects.length).toBeGreaterThan(0);
    expect(redirects.every((redirect) => redirect.permanent)).toBe(true);
  });

  test.each([
    ['/components', '/components/base'],
    ['/blocks', '/blocks/base'],
    ['/components/side-dialog', '/components/base/side-dialog'],
    ['/blocks/kanban', '/blocks/base/kanban'],
    ['/components/react-hook-form', '/components/base/react-hook-form'],
    ['/components/react-hook-form/input-field', '/components/base/react-hook-form/input-field'],
    ['/components/tanstack-query/query-boundary', '/components/base/tanstack-query/query-boundary'],
    ['/components/baseline', '/components/base/baseline'],
    ['/components/radixal/thing', '/components/base/radixal/thing'],
    ['/components/llms.mdx', '/components/llms.mdx/base'],
    ['/components/llms.mdx/side-dialog', '/components/llms.mdx/base/side-dialog'],
    ['/blocks/llms.mdx/kanban', '/blocks/llms.mdx/base/kanban'],
  ])('sends %s to %s', (from, to) => {
    expect(redirected(from)).toBe(to);
  });

  test.each([
    '/components/base',
    '/components/base/side-dialog',
    '/components/radix',
    '/components/radix/react-hook-form/input-field',
    '/blocks/radix/kanban',
    '/components/llms.mdx/base/side-dialog',
    '/components/llms.mdx/radix',
    '/docs/installation',
    '/docs/llms.mdx/installation',
    '/r/base/side-dialog.json',
    '/',
  ])('leaves %s where it is', (pathname) => {
    expect(redirected(pathname)).toBeNull();
  });
});

describe('otherVariantsNote', () => {
  test('names the base of the page and points at the other bases', () => {
    expect(otherVariantsNote('/components/base/side-dialog')).toBe(
      'This is the Base UI variant. Radix variant: /components/radix/side-dialog',
    );
    expect(otherVariantsNote('/blocks/radix/kanban')).toBe(
      'This is the Radix variant. Base UI variant: /blocks/base/kanban',
    );
  });

  test('has nothing to say about a page that has no base', () => {
    expect(otherVariantsNote('/docs/installation')).toBeNull();
  });
});
