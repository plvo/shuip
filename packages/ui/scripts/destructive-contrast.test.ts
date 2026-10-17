import { describe, expect, test } from 'bun:test';
import { compositeOver, contrast, MIN_TEXT_CONTRAST, type Mode, type Rgb, tokenReader } from './contrast';

function palette(mode: Mode) {
  const { color } = tokenReader(mode);
  const destructive = color('--destructive');
  const background = color('--background');
  const card = color('--card');
  return {
    destructive,
    foreground: color('--destructive-foreground'),
    background,
    card,
    popover: color('--popover'),
    tintOver: (backdrop: Rgb, alpha: number) => compositeOver(destructive, backdrop, alpha),
  };
}

describe.each([
  ['dark', 'dark'],
  ['light', 'root'],
] as const)('destructive contrast in %s mode', (_label, mode) => {
  const p = palette(mode);

  test.each([
    ['--background', p.background],
    ['--card', p.card],
    ['--popover', p.popover],
  ])('text-destructive on %s reaches 4.5:1', (_name, surface) => {
    expect(contrast(p.destructive, surface)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  test('--destructive-foreground on solid bg-destructive reaches 4.5:1', () => {
    expect(contrast(p.foreground, p.destructive)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });
});

describe('destructive tints', () => {
  const dark = palette('dark');

  test.each([
    ['/20 tint over background', 0.2, 'background'],
    ['/20 tint over card', 0.2, 'card'],
    ['/30 tint over background', 0.3, 'background'],
    ['/30 tint over card', 0.3, 'card'],
  ] as const)('dark: text-destructive on the %s reaches 4.5:1', (_name, alpha, surface) => {
    expect(contrast(dark.destructive, dark.tintOver(dark[surface], alpha))).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  const light = palette('root');

  test.each([
    ['/10 tint over background', 0.1, 'background'],
    ['/10 tint over card', 0.1, 'card'],
    ['/20 tint over background', 0.2, 'background'],
    ['/20 tint over card', 0.2, 'card'],
  ] as const)('light: text-destructive on the %s reaches 4.5:1', (_name, alpha, surface) => {
    expect(contrast(light.destructive, light.tintOver(light[surface], alpha))).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });
});
