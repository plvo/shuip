import { describe, expect, test } from 'bun:test';
import { PUBLISHED_VARIANTS, styleRewrites, styleToBase, styleToVariant } from './style-base';

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

describe('styleToVariant', () => {
  test('serves the radix variant to every supported base while only radix is published', () => {
    expect(PUBLISHED_VARIANTS).toEqual(['radix']);
    for (const style of ['base-nova', 'radix-vega', 'new-york', 'new-york-v4', 'default']) {
      expect(styleToVariant(style)).toBe('radix');
    }
  });

  test('returns null for unsupported styles', () => {
    expect(styleToVariant('aria-nova')).toBeNull();
  });
});

describe('styleRewrites', () => {
  test('emits one rewrite per published variant, targeting its folder', () => {
    expect(styleRewrites().map((r) => r.destination)).toEqual(['/r/radix/:name.json']);
  });

  test('covers every supported style family and never the variant folder itself', () => {
    const [{ source }] = styleRewrites();
    const styles = source.match(/:style\((.+)\)/)?.[1].split('|') ?? [];
    expect(styles).toEqual(expect.arrayContaining(['base-[^/]+', 'radix-[^/]+', 'new-york', 'new-york-v4', 'default']));
    const matcher = new RegExp(`^(?:${styles.join('|')})$`);
    expect(matcher.test('radix')).toBe(false);
    expect(matcher.test('aria-nova')).toBe(false);
    expect(matcher.test('base-nova')).toBe(true);
  });
});
