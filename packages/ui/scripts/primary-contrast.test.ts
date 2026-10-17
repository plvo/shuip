import { describe, expect, test } from 'bun:test';
import {
  compositeOver,
  contrast,
  isInSrgbGamut,
  MIN_TEXT_CONTRAST,
  type Mode,
  type Rgb,
  tokenReader,
} from '../src/lib/contrast';

const MIN_NON_TEXT_CONTRAST = 3;

function palette(mode: Mode) {
  const { color, value } = tokenReader(mode);
  const primary = color('--primary');
  return {
    primaryValue: value('--primary'),
    primary,
    foreground: color('--primary-foreground'),
    ring: color('--ring'),
    sidebarPrimary: color('--sidebar-primary'),
    sidebarPrimaryForeground: color('--sidebar-primary-foreground'),
    sidebarRing: color('--sidebar-ring'),
    sidebar: color('--sidebar'),
    surfaces: {
      '--background': color('--background'),
      '--card': color('--card'),
      '--popover': color('--popover'),
      '--muted': color('--muted'),
      '--secondary': color('--secondary'),
      '--accent': color('--accent'),
    },
    tintOver: (backdrop: Rgb, alpha: number) => compositeOver(primary, backdrop, alpha),
  };
}

describe.each([
  ['dark', 'dark'],
  ['light', 'root'],
] as const)('primary contrast in %s mode', (_label, mode) => {
  const p = palette(mode);

  test('--primary stays inside the sRGB gamut, so no channel is clamped', () => {
    expect(isInSrgbGamut(p.primaryValue)).toBe(true);
  });

  test.each(Object.entries(p.surfaces))('text-primary on %s reaches 4.5:1', (_name, surface) => {
    expect(contrast(p.primary, surface)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  test('the selected tab of the fumadocs Tabs (text-fd-primary on bg-fd-secondary) reaches 4.5:1', () => {
    expect(contrast(p.primary, p.surfaces['--secondary'])).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  test('--primary-foreground on solid bg-primary reaches 4.5:1', () => {
    expect(contrast(p.foreground, p.primary)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  test('--sidebar-primary-foreground on solid bg-sidebar-primary reaches 4.5:1', () => {
    expect(contrast(p.sidebarPrimaryForeground, p.sidebarPrimary)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  test('--sidebar-primary on --sidebar reaches 4.5:1', () => {
    expect(contrast(p.sidebarPrimary, p.sidebar)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  test.each([
    ['--background', p.surfaces['--background']],
    ['--card', p.surfaces['--card']],
  ])('the focus ring on %s reaches 3:1', (_name, surface) => {
    expect(contrast(p.ring, surface)).toBeGreaterThanOrEqual(MIN_NON_TEXT_CONTRAST);
  });

  test('--sidebar-ring on --sidebar reaches 3:1', () => {
    expect(contrast(p.sidebarRing, p.sidebar)).toBeGreaterThanOrEqual(MIN_NON_TEXT_CONTRAST);
  });

  test.each([
    ['/10 tint over background', 0.1, '--background'],
    ['/10 tint over card', 0.1, '--card'],
  ] as const)('text-primary on the %s reaches 4.5:1', (_name, alpha, surface) => {
    expect(contrast(p.primary, p.tintOver(p.surfaces[surface], alpha))).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });
});

describe('primary hover state', () => {
  const HOVER_CONTRAST_FLOOR = { root: 3.44, dark: 5.68 } as const;

  test.each([
    ['dark', 'dark'],
    ['light', 'root'],
  ] as const)('%s: --primary-foreground on bg-primary/80 over --background keeps its level', (_label, mode) => {
    const p = palette(mode);
    const hovered = p.tintOver(p.surfaces['--background'], 0.8);
    expect(contrast(p.foreground, hovered)).toBeGreaterThanOrEqual(HOVER_CONTRAST_FLOOR[mode]);
  });
});
