import { describe, expect, test } from 'bun:test';
import { rewrittenPathname } from '@repo/registry/rewrite-match';
import {
  BASE_COOKIE,
  BASES,
  baseCookie,
  baseLabel,
  baseParams,
  baseRedirects,
  DEFAULT_BASE,
  isBase,
  llmsUrl,
  otherVariantsNote,
  parseBasedPath,
  sectionEntryUrl,
  sectionUrl,
  siblingUrl,
  unbasedUrl,
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

  // Next applies a redirect with a cookie condition only when the cookie holds exactly that value.
  const redirected = (pathname: string, cookie?: string) => {
    for (const rule of redirects) {
      if (rule.has && !rule.has.every((condition) => condition.key === BASE_COOKIE && condition.value === cookie))
        continue;
      const destination = rewrittenPathname(pathname, [rule]);
      if (destination) return destination;
    }
    return null;
  };

  test('every redirect is temporary, so a browser does not pin the answer for a reader who switches base', () => {
    expect(redirects.length).toBeGreaterThan(0);
    expect(redirects.every((redirect) => redirect.permanent === false)).toBe(true);
  });

  test('only the redirects to another base than the default depend on the cookie', () => {
    const conditional = redirects.filter((redirect) => redirect.has);

    expect(conditional.length).toBeGreaterThan(0);
    expect(conditional.every((redirect) => redirect.destination.includes('/radix'))).toBe(true);
    expect(redirects.slice(-1)[0]?.has).toBeUndefined();
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
  ])('sends %s to %s without a cookie', (from, to) => {
    expect(redirected(from)).toBe(to);
  });

  test.each([
    ['/components', '/components/radix'],
    ['/blocks', '/blocks/radix'],
    ['/components/side-dialog', '/components/radix/side-dialog'],
    ['/components/react-hook-form/input-field', '/components/radix/react-hook-form/input-field'],
    ['/blocks/kanban', '/blocks/radix/kanban'],
    ['/components/llms.mdx', '/components/llms.mdx/radix'],
    ['/components/llms.mdx/side-dialog', '/components/llms.mdx/radix/side-dialog'],
    ['/blocks/llms.mdx/kanban', '/blocks/llms.mdx/radix/kanban'],
  ])('sends %s to %s for a reader whose last base is Radix', (from, to) => {
    expect(redirected(from, 'radix')).toBe(to);
  });

  test.each(['base', 'garbage', 'Radix', 'radixx', ''])('sends a reader with the cookie %p to Base UI', (cookie) => {
    expect(redirected('/components/side-dialog', cookie)).toBe('/components/base/side-dialog');
    expect(redirected('/blocks', cookie)).toBe('/blocks/base');
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
  ])('leaves %s where it is whatever the cookie', (pathname) => {
    expect(redirected(pathname)).toBeNull();
    expect(redirected(pathname, 'radix')).toBeNull();
  });
});

describe('the base cookie', () => {
  test('keeps the base for a year, for every page of the site', () => {
    expect(baseCookie('radix')).toBe('shuip-base=radix; path=/; max-age=31536000; SameSite=Lax');
    expect(baseCookie('base')).toBe('shuip-base=base; path=/; max-age=31536000; SameSite=Lax');
  });
});

describe('sectionEntryUrl', () => {
  test('points at the section of a base when a base is given', () => {
    expect(sectionEntryUrl('components', 'radix')).toBe('/components/radix');
  });

  test('points at the address without a base otherwise, which redirects to the last base of the reader', () => {
    expect(sectionEntryUrl('blocks')).toBe('/blocks');
  });
});

describe('unbasedUrl', () => {
  test.each([
    ['/components/base', '/components'],
    ['/components/base/side-dialog', '/components/side-dialog'],
    ['/blocks/radix/kanban', '/blocks/kanban'],
    ['/components/radix/react-hook-form/input-field', '/components/react-hook-form/input-field'],
  ])('removes the base from %s', (url, expected) => {
    expect(unbasedUrl(url)).toBe(expected);
  });

  test.each([
    '/docs/installation',
    '/llms-full.txt',
    '/components/side-dialog',
    '/components/llms.mdx/base/x',
  ])('leaves %s alone', (url) => {
    expect(unbasedUrl(url)).toBe(url);
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

describe('baseParams', () => {
  test('lists one parameter per base for the base segment', () => {
    expect(baseParams()).toEqual([{ base: 'base' }, { base: 'radix' }]);
  });
});
