import { describe, expect, test } from 'bun:test';
import { initArgs, parseScaffoldStyle } from './scaffold';

describe('parseScaffoldStyle', () => {
  test.each([
    ['base-vega', 'base', 'vega'],
    ['radix-nova', 'radix', 'nova'],
  ])('splits %s into the %s base and the %s preset', (style, base, preset) => {
    expect(parseScaffoldStyle(style)).toEqual({ style, base, preset });
  });

  test.each(['default', 'new-york', 'new-york-v4', 'base', 'radix', 'aria-nova', ''])('cannot scaffold %p', (style) => {
    expect(parseScaffoldStyle(style)).toBeNull();
  });
});

describe('initArgs', () => {
  const flagValue = (args: string[], flag: string): string | undefined => args[args.indexOf(flag) + 1];

  test.each([
    ['base-vega', 'base', 'vega'],
    ['radix-nova', 'radix', 'nova'],
  ])('passes the base and the preset of %s to the shadcn CLI', (style, base, preset) => {
    const args = initArgs(parseScaffoldStyle(style) as NonNullable<ReturnType<typeof parseScaffoldStyle>>);
    expect(flagValue(args, '-b')).toBe(base);
    expect(flagValue(args, '-p')).toBe(preset);
  });
});
