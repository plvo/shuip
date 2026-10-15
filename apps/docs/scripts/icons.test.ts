import { describe, expect, test } from 'bun:test';
import { buildIco, ICON_COLORS, readMarkSource, themedMarkSvg, tileSvg } from './icons';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

const fakePng = (size: number): { size: number; data: Uint8Array } => ({
  size,
  data: Uint8Array.from([...PNG_SIGNATURE, size]),
});

describe('readMarkSource', () => {
  test('reads the mark with strokes that follow the text colour', () => {
    const source = readMarkSource();

    expect(source).toContain('viewBox="0 0 32 32"');
    expect(source).toContain('stroke="currentColor"');
  });
});

describe('themedMarkSvg', () => {
  const source = readMarkSource();
  const svg = themedMarkSvg(source);

  test('draws dark strokes by default and light strokes in a dark colour scheme', () => {
    expect(svg).toContain(`color:${ICON_COLORS.ink}`);
    expect(svg).toMatch(new RegExp(`@media \\(prefers-color-scheme: ?dark\\)\\{svg\\{color:${ICON_COLORS.paper}\\}`));
  });

  test('keeps the mark itself untouched', () => {
    expect(svg.replace(/<style>.*<\/style>/, '')).toBe(source.trim());
  });
});

describe('tileSvg', () => {
  const source = readMarkSource();

  test('renders at the requested pixel size on a solid background', () => {
    const svg = tileSvg(source, { size: 180, inset: 0.2, radius: 0 });

    expect(svg).toContain('width="180"');
    expect(svg).toContain('height="180"');
    expect(svg).toContain(`fill="${ICON_COLORS.tile}"`);
  });

  test('draws the mark in the light colour, inside the padding', () => {
    const svg = tileSvg(source, { size: 100, inset: 0.2, radius: 0 });

    expect(svg).toContain(`color="${ICON_COLORS.paper}"`);
    expect(svg).toContain('x="20"');
    expect(svg).toContain('y="20"');
    expect(svg).toContain('width="60"');
  });

  test('rounds the corners when asked to', () => {
    expect(tileSvg(source, { size: 48, inset: 0.1, radius: 0.2 })).toContain('rx="9.6"');
  });
});

describe('buildIco', () => {
  const pngs = [fakePng(16), fakePng(32), fakePng(48)];
  const ico = buildIco(pngs);
  const view = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);

  test('starts with an icon directory listing every image', () => {
    expect(view.getUint16(0, true)).toBe(0);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(3);
  });

  test('describes each image by its size and where its PNG data sits', () => {
    pngs.forEach(({ size, data }, index) => {
      const entry = 6 + index * 16;
      const offset = view.getUint32(entry + 12, true);

      expect(view.getUint8(entry)).toBe(size);
      expect(view.getUint8(entry + 1)).toBe(size);
      expect(view.getUint32(entry + 8, true)).toBe(data.length);
      expect([...ico.slice(offset, offset + data.length)]).toEqual([...data]);
    });
  });
});
