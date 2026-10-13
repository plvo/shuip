import { describe, expect, test } from 'bun:test';
import { match } from 'next/dist/compiled/path-to-regexp';
import { SHUIP_REGISTRY_URL } from './namespace';
import { PUBLISHED_VARIANTS, publishedVariants, styleRewrites, styleToBase, type VariantForBase } from './style-base';

describe('styleToBase', () => {
  test.each(['base-nova', 'base-vega'])('maps %s to base', (style) => {
    expect(styleToBase(style)).toBe('base');
  });

  test.each(['radix-vega', 'radix-nova', 'new-york', 'new-york-v4', 'default'])('maps %s to radix', (style) => {
    expect(styleToBase(style)).toBe('radix');
  });

  test.each(['aria-nova', 'unknown-style', 'base', 'radix', 'new-york-v5', ''])('rejects %p', (style) => {
    expect(styleToBase(style)).toBeNull();
  });
});

const routeTo = (rewrites: ReturnType<typeof styleRewrites>, pathname: string): string | null => {
  for (const { source, destination } of rewrites) {
    const matched = match(source, { decode: decodeURIComponent })(pathname);
    if (matched) {
      return destination.replace(/:(\w+)/g, (_, key: string) => (matched.params as Record<string, string>)[key]);
    }
  }
  return null;
};

describe('published variants', () => {
  test('only radix is published for now', () => {
    expect(PUBLISHED_VARIANTS).toEqual(['radix']);
  });
});

describe('styleRewrites with the shipped mapping', () => {
  const rewrites = styleRewrites();

  test.each([
    'base-nova',
    'radix-vega',
    'new-york',
    'new-york-v4',
    'default',
  ])('routes /r/%s/x.json to the radix variant', (style) => {
    expect(routeTo(rewrites, `/r/${style}/x.json`)).toBe('/r/radix/x.json');
  });

  test('leaves unsupported styles, the variant folder and flat urls unrouted', () => {
    expect(routeTo(rewrites, '/r/aria-nova/x.json')).toBeNull();
    expect(routeTo(rewrites, '/r/radix/x.json')).toBeNull();
    expect(routeTo(rewrites, '/r/x.json')).toBeNull();
  });
});

describe('styleRewrites once a base variant is published', () => {
  const dedicatedBase: VariantForBase = { base: 'base', radix: 'radix' };
  const rewrites = styleRewrites(dedicatedBase);

  test('publishes both variants', () => {
    expect(publishedVariants(dedicatedBase)).toEqual(['base', 'radix']);
  });

  test('routes base styles to the base variant and radix styles to the radix variant', () => {
    expect(routeTo(rewrites, '/r/base-nova/x.json')).toBe('/r/base/x.json');
    expect(routeTo(rewrites, '/r/radix-vega/x.json')).toBe('/r/radix/x.json');
    expect(routeTo(rewrites, '/r/new-york-v4/x.json')).toBe('/r/radix/x.json');
  });

  test('still leaves unsupported styles and the variant folders unrouted', () => {
    expect(routeTo(rewrites, '/r/aria-nova/x.json')).toBeNull();
    expect(routeTo(rewrites, '/r/base/x.json')).toBeNull();
    expect(routeTo(rewrites, '/r/radix/x.json')).toBeNull();
  });
});

describe('SHUIP_REGISTRY_URL', () => {
  const requestPath = (style: string, name: string): string =>
    new URL(SHUIP_REGISTRY_URL.replace('{style}', style).replace('{name}', name)).pathname;

  test.each([
    'base-nova',
    'radix-vega',
    'new-york-v4',
    'default',
  ])('a consumer on %s is routed to the published radix item', (style) => {
    expect(routeTo(styleRewrites(), requestPath(style, 'tsf-input-field'))).toBe('/r/radix/tsf-input-field.json');
  });

  test('a consumer on an unsupported style is not routed', () => {
    expect(routeTo(styleRewrites(), requestPath('aria-nova', 'tsf-input-field'))).toBeNull();
  });
});
