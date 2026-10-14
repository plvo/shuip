import { describe, expect, test } from 'bun:test';
import { SHUIP_REGISTRY_URL } from './namespace';
import { rewrittenPathname } from './rewrite-match';
import { PUBLISHED_VARIANTS, styleRewrites, styleToBase } from './style-base';

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

describe('published variants', () => {
  test('both variants are published', () => {
    expect(PUBLISHED_VARIANTS).toEqual(['base', 'radix']);
  });

  test('every published variant is reachable through a style rewrite', () => {
    const destinations = styleRewrites().map(({ destination }) => destination);
    expect(destinations).toEqual(PUBLISHED_VARIANTS.map((variant) => `/r/${variant}/:name.json`));
  });
});

describe('styleRewrites', () => {
  const rewrites = styleRewrites();

  test.each([
    ['base-vega', 'base'],
    ['base-nova', 'base'],
    ['radix-vega', 'radix'],
    ['radix-nova', 'radix'],
    ['new-york', 'radix'],
    ['new-york-v4', 'radix'],
    ['default', 'radix'],
  ])('routes /r/%s/x.json to the %s variant', (style, variant) => {
    expect(rewrittenPathname(`/r/${style}/x.json`, rewrites)).toBe(`/r/${variant}/x.json`);
  });

  test('leaves unsupported styles, the variant folders and flat urls unrouted', () => {
    expect(rewrittenPathname('/r/aria-nova/x.json', rewrites)).toBeNull();
    expect(rewrittenPathname('/r/base/x.json', rewrites)).toBeNull();
    expect(rewrittenPathname('/r/radix/x.json', rewrites)).toBeNull();
    expect(rewrittenPathname('/r/x.json', rewrites)).toBeNull();
  });
});

describe('SHUIP_REGISTRY_URL', () => {
  const requestPath = (style: string, name: string): string =>
    new URL(SHUIP_REGISTRY_URL.replace('{style}', style).replace('{name}', name)).pathname;

  test.each([
    ['base-nova', 'base'],
    ['radix-vega', 'radix'],
    ['new-york-v4', 'radix'],
    ['default', 'radix'],
  ])('a consumer on %s is routed to the published %s item', (style, variant) => {
    expect(rewrittenPathname(requestPath(style, 'tsf-input-field'), styleRewrites())).toBe(
      `/r/${variant}/tsf-input-field.json`,
    );
  });

  test('a consumer on an unsupported style is not routed', () => {
    expect(rewrittenPathname(requestPath('aria-nova', 'tsf-input-field'), styleRewrites())).toBeNull();
  });
});
