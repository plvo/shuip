import fs from 'node:fs';
import path from 'node:path';

export const MARK_SOURCE_PATH = path.resolve(import.meta.dir, '..', 'src', 'assets', 'shuip-mark.svg');

/** The site's foreground, background and light-theme foreground tones, as sRGB hex. */
export const ICON_COLORS = {
  ink: '#221f1a',
  paper: '#e6e4e2',
  tile: '#0f0d0a',
} as const;

export interface TileOptions {
  /** The edge of the square image, in pixels. */
  size: number;
  /** The share of the edge left empty on each side of the mark, from 0 to 0.5. */
  inset: number;
  /** The corner radius as a share of the edge, from 0 (square) to 0.5 (circle). */
  radius: number;
}

export interface IcoImage {
  /** The edge of the square image, in pixels, at most 256. */
  size: number;
  /** The image encoded as PNG. */
  data: Uint8Array;
}

export const readMarkSource = (): string => fs.readFileSync(MARK_SOURCE_PATH, 'utf-8');

const round = (value: number): number => Number(value.toFixed(2));

const markContent = (source: string): string => {
  const content = source.match(/<svg[^>]*>(.*)<\/svg>/s)?.[1];
  if (!content) throw new Error('The mark source is not an SVG document');
  return content.trim();
};

/**
 * The mark as a self-contained icon that follows the browser theme.
 * A favicon cannot read the page's CSS, so the colours live in the SVG itself.
 */
export const themedMarkSvg = (source: string): string => {
  const style = `<style>svg{color:${ICON_COLORS.ink}}@media (prefers-color-scheme:dark){svg{color:${ICON_COLORS.paper}}}</style>`;
  return source.trim().replace(/(<svg[^>]*>)/, `$1${style}`);
};

/** The mark in the light colour, centred on a solid dark square, drawn at `size` pixels. */
export const tileSvg = (source: string, { size, inset, radius }: TileOptions): string => {
  const margin = round(size * inset);
  const markSize = round(size - margin * 2);
  const corner = round(size * radius);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" rx="${corner}" fill="${ICON_COLORS.tile}"/>`,
    `<svg x="${margin}" y="${margin}" width="${markSize}" height="${markSize}" viewBox="0 0 32 32" color="${ICON_COLORS.paper}">`,
    markContent(source),
    '</svg>',
    '</svg>',
  ].join('');
};

const ICO_HEADER_BYTES = 6;
const ICO_ENTRY_BYTES = 16;

/** An ICO file holding each PNG image as is. */
export const buildIco = (images: readonly IcoImage[]): Uint8Array => {
  const directoryBytes = ICO_HEADER_BYTES + images.length * ICO_ENTRY_BYTES;
  const ico = new Uint8Array(directoryBytes + images.reduce((total, { data }) => total + data.length, 0));
  const view = new DataView(ico.buffer);

  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);

  let offset = directoryBytes;
  images.forEach(({ size, data }, index) => {
    const entry = ICO_HEADER_BYTES + index * ICO_ENTRY_BYTES;
    view.setUint8(entry, size);
    view.setUint8(entry + 1, size);
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, data.length, true);
    view.setUint32(entry + 12, offset, true);
    ico.set(data, offset);
    offset += data.length;
  });

  return ico;
};
