import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

type Rgb = readonly [number, number, number];
type Mode = 'root' | 'dark';

const MIN_TEXT_CONTRAST = 4.5;
const BASE_CSS = path.join(import.meta.dir, '../src/styles/base.css');

const blockSelector: Record<Mode, RegExp> = {
  root: /^\s*:root\s*\{/,
  dark: /^\s*\.dark\s*\{/,
};

function readTokens(mode: Mode): Map<string, string> {
  const lines = fs.readFileSync(BASE_CSS, 'utf8').split('\n');
  const start = lines.findIndex((line) => blockSelector[mode].test(line));
  if (start === -1) throw new Error(`base.css has no ${mode} block`);
  const tokens = new Map<string, string>();
  for (const line of lines.slice(start + 1)) {
    if (/^\s*\}/.test(line)) break;
    const declaration = line.match(/^\s*(--[\w-]+):\s*(oklch\([^)]*\));/);
    if (declaration) tokens.set(declaration[1], declaration[2]);
  }
  return tokens;
}

function oklchToSrgb(value: string): Rgb {
  const [lightness, chroma, hue] = value
    .replace(/oklch\(|\)/g, '')
    .trim()
    .split(/\s+/)
    .map(Number);
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const encode = (channel: number) => {
    const clamped = Math.min(1, Math.max(0, channel));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };
  return [encode(linear[0]), encode(linear[1]), encode(linear[2])];
}

function luminance([r, g, b]: Rgb): number {
  const decode = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b);
}

function contrast(foreground: Rgb, background: Rgb): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

function compositeOver(color: Rgb, backdrop: Rgb, alpha: number): Rgb {
  return [0, 1, 2].map((i) => alpha * color[i] + (1 - alpha) * backdrop[i]) as unknown as Rgb;
}

function palette(mode: Mode) {
  const tokens = readTokens(mode);
  const color = (name: string): Rgb => {
    const value = tokens.get(name);
    if (!value) throw new Error(`base.css ${mode} block has no ${name}`);
    return oklchToSrgb(value);
  };
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
    ['background', dark.background],
    ['card', dark.card],
  ])('dark: text-destructive on the /20 tint over %s reaches 4.5:1', (_name, backdrop) => {
    expect(contrast(dark.destructive, dark.tintOver(backdrop, 0.2))).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
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
