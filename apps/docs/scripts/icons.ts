import { SHUIP_MARK } from '../src/lib/shuip-mark';

/** The mark's light tone, as used on the site's dark theme, and the dark tile behind it, as sRGB hex. */
export const ICON_COLORS = {
  paper: '#e6e4e2',
  tile: '#0f0d0a',
} as const;

export interface TileOptions {
  /** The edge of the square image, in pixels. */
  size: number;
  /** The share of the edge left empty on each side of the mark, from 0 to 0.5, snapped to whole pixels. */
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

export const APPLE_ICON: TileOptions = { size: 180, inset: 0.2, radius: 0 };

const FAVICON_TILE = { inset: 0.06, radius: 0.22 } as const;

export const SITE_ICON: TileOptions = { size: 32, ...FAVICON_TILE };

export const FAVICON_TILES: readonly TileOptions[] = [16, 32, 48].map((size) => ({ size, ...FAVICON_TILE }));

const round = (value: number): number => Number(value.toFixed(2));

const arcsSvg = (): string => {
  const { strokeWidth, strokeLinecap, arcs } = SHUIP_MARK;
  return arcs
    .map(({ d, ...arc }) => {
      const opacity = 'opacity' in arc ? ` opacity="${arc.opacity}"` : '';
      return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}"${opacity}/>`;
    })
    .join('');
};

/** The mark in the light colour, centred on a solid dark square, drawn at `size` pixels. */
export const tileSvg = ({ size, inset, radius }: TileOptions): string => {
  const margin = Math.round(size * inset);
  const markSize = size - margin * 2;
  const corner = round(size * radius);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" rx="${corner}" fill="${ICON_COLORS.tile}"/>`,
    `<svg x="${margin}" y="${margin}" width="${markSize}" height="${markSize}" viewBox="${SHUIP_MARK.viewBox}" color="${ICON_COLORS.paper}">`,
    arcsSvg(),
    '</svg>',
    '</svg>',
  ].join('');
};

/** The SVG favicon: the same tile as the ICO, so every browser shows one identity. */
export const siteIconSvg = (): string => tileSvg(SITE_ICON);

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
