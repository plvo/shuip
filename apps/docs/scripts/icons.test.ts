import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { SHUIP_MARK } from '../src/lib/shuip-mark';
import {
  APP_DIRECTORY,
  APPLE_ICON,
  buildIco,
  FAVICON_TILES,
  ICON_COLORS,
  README_MARK_PATH,
  readmeMarkSvg,
  siteIconSvg,
  type TileOptions,
  tileSvg,
} from './icons';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const fakePng = (size: number): { size: number; data: Uint8Array } => ({
  size,
  data: Uint8Array.from([...PNG_SIGNATURE, size]),
});

const readCommitted = (name: string): Uint8Array => new Uint8Array(fs.readFileSync(path.join(APP_DIRECTORY, name)));

const hasPngSignature = (bytes: Uint8Array, offset = 0): boolean =>
  PNG_SIGNATURE.every((byte, index) => bytes[offset + index] === byte);

const dataView = (bytes: Uint8Array): DataView => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

/** The width and height written in the IHDR chunk of the PNG starting at `offset`. */
const pngDimensions = (bytes: Uint8Array, offset = 0): { width: number; height: number } => {
  const view = dataView(bytes);
  return { width: view.getUint32(offset + 16), height: view.getUint32(offset + 20) };
};

const [, VIEW_BOX_Y, , VIEW_BOX_HEIGHT] = SHUIP_MARK.viewBox.split(' ').map(Number);
/** The vertical position, on the mark's grid, of the middle of the stroke at the top of the first arc. */
const TOP_ARC_Y = 6;

/** A pixel of `tile` that is only background, and one on the top arc of the mark. */
const probesOf = ({ size, inset }: TileOptions): { background: Pixel; arc: Pixel } => {
  const margin = Math.round(size * inset);
  const scale = (size - margin * 2) / VIEW_BOX_HEIGHT;
  return {
    background: { x: margin - 1, y: Math.floor(size / 2) },
    arc: { x: Math.floor(size / 2), y: Math.round(margin + (TOP_ARC_Y - VIEW_BOX_Y) * scale) },
  };
};

interface Pixel {
  x: number;
  y: number;
}

const rgbOf = (hex: string): number[] => [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));

const pixelOf = async (png: Uint8Array, { x, y }: Pixel): Promise<number[]> => {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const start = (y * info.width + x) * info.channels;
  return [...data.subarray(start, start + 3)];
};

const expectPixelColour = async (png: Uint8Array, pixel: Pixel, hex: string): Promise<void> => {
  const actual = await pixelOf(png, pixel);
  rgbOf(hex).forEach((channel, index) => {
    expect(Math.abs(actual[index] - channel)).toBeLessThanOrEqual(2);
  });
};

const expectTileDrawn = async (png: Uint8Array, tile: TileOptions): Promise<void> => {
  const { background, arc } = probesOf(tile);
  await expectPixelColour(png, background, ICON_COLORS.tile);
  await expectPixelColour(png, arc, ICON_COLORS.mark);
};

describe('tileSvg', () => {
  test('renders at the requested pixel size on a solid background', () => {
    const svg = tileSvg({ size: 180, inset: 0.2, radius: 0 });

    expect(svg).toContain('width="180"');
    expect(svg).toContain('height="180"');
    expect(svg).toContain(`fill="${ICON_COLORS.tile}"`);
  });

  test('draws the mark in the light colour, inside the padding', () => {
    const svg = tileSvg({ size: 100, inset: 0.2, radius: 0 });

    expect(svg).toContain(`stroke="${ICON_COLORS.mark}"`);
    expect(svg).toContain('x="20"');
    expect(svg).toContain('y="20"');
    expect(svg).toContain('width="60"');
  });

  test('snaps the padding to whole pixels', () => {
    expect(tileSvg({ size: 16, inset: 0.06, radius: 0 })).toContain('x="1"');
    expect(tileSvg({ size: 32, inset: 0.06, radius: 0 })).toContain('x="2"');
  });

  test('rounds the corners when asked to', () => {
    expect(tileSvg({ size: 48, inset: 0.1, radius: 0.2 })).toContain('rx="9.6"');
  });

  test('draws the geometry of the mark', () => {
    const svg = tileSvg({ size: 64, inset: 0.1, radius: 0 });
    const { viewBox, strokeWidth, strokeLinecap, arcs } = SHUIP_MARK;

    expect(svg).toContain(`viewBox="${viewBox}"`);
    expect(svg).toContain(`stroke-width="${strokeWidth}"`);
    expect(svg).toContain(`stroke-linecap="${strokeLinecap}"`);
    for (const { d, opacity } of arcs) {
      expect(svg).toContain(`d="${d}"`);
      if (opacity !== undefined) expect(svg).toContain(`opacity="${opacity}"`);
    }
  });
});

describe('siteIconSvg', () => {
  test('is the same tile as the favicon, whatever the colour scheme', () => {
    const svg = siteIconSvg();

    expect(svg).toContain(`fill="${ICON_COLORS.tile}"`);
    expect(svg).not.toContain('prefers-color-scheme');
  });
});

describe('readmeMarkSvg', () => {
  test('is the mark in white on a black rounded tile', () => {
    const svg = readmeMarkSvg();

    expect(svg).toContain('fill="#000"');
    expect(svg).toContain('stroke="#fff"');
    expect(svg).toContain('opacity="0.45"');
    expect(svg).not.toContain('href=');
  });
});

describe('committed icons', () => {
  test('icon.svg is what the generator writes', () => {
    expect(fs.readFileSync(path.join(APP_DIRECTORY, 'icon.svg'), 'utf-8')).toBe(`${siteIconSvg()}\n`);
  });

  test('the README mark is what the generator writes', () => {
    expect(fs.readFileSync(README_MARK_PATH, 'utf-8')).toBe(`${readmeMarkSvg()}\n`);
  });

  test('apple-icon.png is a PNG of the requested size', () => {
    const png = readCommitted('apple-icon.png');

    expect(hasPngSignature(png)).toBe(true);
    expect(pngDimensions(png)).toEqual({ width: APPLE_ICON.size, height: APPLE_ICON.size });
  });

  test('apple-icon.png shows the mark on the tile colour', async () => {
    await expectTileDrawn(readCommitted('apple-icon.png'), APPLE_ICON);
  });

  test('favicon.ico holds a valid 32-bit PNG for each favicon size', () => {
    const ico = readCommitted('favicon.ico');
    const view = dataView(ico);
    const count = view.getUint16(4, true);
    const entries = Array.from({ length: count }, (_, index) => {
      const entry = 6 + index * 16;
      const offset = view.getUint32(entry + 12, true);
      return {
        width: view.getUint8(entry),
        height: view.getUint8(entry + 1),
        planes: view.getUint16(entry + 4, true),
        bitCount: view.getUint16(entry + 6, true),
        offset,
        png: hasPngSignature(ico, offset),
        dimensions: pngDimensions(ico, offset),
      };
    });

    expect(entries.map(({ width }) => width)).toEqual(FAVICON_TILES.map(({ size }) => size));
    for (const { width, height, planes, bitCount, png, dimensions } of entries) {
      expect(height).toBe(width);
      expect(planes).toBe(1);
      expect(bitCount).toBe(32);
      expect(png).toBe(true);
      expect(dimensions).toEqual({ width, height });
    }
  });

  test('favicon.ico shows the mark on the tile colour in its larger sizes', async () => {
    const ico = readCommitted('favicon.ico');
    const view = dataView(ico);

    for (const [index, tile] of FAVICON_TILES.entries()) {
      if (tile.size < 32) continue;
      const entry = 6 + index * 16;
      const offset = view.getUint32(entry + 12, true);
      await expectTileDrawn(ico.slice(offset, offset + view.getUint32(entry + 8, true)), tile);
    }
  });
});

describe('buildIco', () => {
  const pngs = [fakePng(16), fakePng(32), fakePng(48)];
  const ico = buildIco(pngs);
  const view = dataView(ico);

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
