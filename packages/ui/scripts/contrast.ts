import * as fs from 'node:fs';
import * as path from 'node:path';

export type Rgb = readonly [number, number, number];
export type Mode = 'root' | 'dark';

export const MIN_TEXT_CONTRAST = 4.5;
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

function oklchToLinearSrgb(value: string): Rgb {
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
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const GAMUT_TOLERANCE = 1e-4;

export function isInSrgbGamut(value: string): boolean {
  return oklchToLinearSrgb(value).every((channel) => channel >= -GAMUT_TOLERANCE && channel <= 1 + GAMUT_TOLERANCE);
}

function oklchToSrgb(value: string): Rgb {
  const encode = (channel: number) => {
    const clamped = Math.min(1, Math.max(0, channel));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };
  const [r, g, b] = oklchToLinearSrgb(value);
  return [encode(r), encode(g), encode(b)];
}

export function tokenReader(mode: Mode) {
  const tokens = readTokens(mode);
  const value = (name: string): string => {
    const declared = tokens.get(name);
    if (!declared) throw new Error(`base.css ${mode} block has no ${name}`);
    return declared;
  };
  return { value, color: (name: string): Rgb => oklchToSrgb(value(name)) };
}

function luminance([r, g, b]: Rgb): number {
  const decode = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b);
}

export function contrast(foreground: Rgb, background: Rgb): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

export function compositeOver(color: Rgb, backdrop: Rgb, alpha: number): Rgb {
  return [0, 1, 2].map((i) => alpha * color[i] + (1 - alpha) * backdrop[i]) as unknown as Rgb;
}
