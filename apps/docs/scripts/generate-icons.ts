/**
 * Derives the site icons in `src/app/` from the mark in `src/lib/shuip-mark.ts`:
 *   icon.svg        the mark on a dark rounded tile
 *   apple-icon.png  180x180 tile for the iOS home screen
 *   favicon.ico     16, 32 and 48 pixel tiles for browsers without SVG favicons
 * and `.github/assets/shuip-mark.svg`, the white-on-black mark shown at the top of the README.
 *
 * Run it with `bun run icons:generate` from `apps/docs` after changing the mark, and commit the outputs.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  APP_DIRECTORY,
  APPLE_ICON,
  buildIco,
  FAVICON_TILES,
  README_MARK_PATH,
  readmeMarkSvg,
  siteIconSvg,
  type TileOptions,
  tileSvg,
} from './icons';

const rasterise = (tile: TileOptions): Promise<Uint8Array> =>
  sharp(Buffer.from(tileSvg(tile)))
    .png()
    .toBuffer();

const generate = async (): Promise<void> => {
  fs.writeFileSync(path.join(APP_DIRECTORY, 'icon.svg'), `${siteIconSvg()}\n`);
  fs.mkdirSync(path.dirname(README_MARK_PATH), { recursive: true });
  fs.writeFileSync(README_MARK_PATH, `${readmeMarkSvg()}\n`);
  fs.writeFileSync(path.join(APP_DIRECTORY, 'apple-icon.png'), await rasterise(APPLE_ICON));

  const images = await Promise.all(
    FAVICON_TILES.map(async (tile) => ({ size: tile.size, data: await rasterise(tile) })),
  );
  fs.writeFileSync(path.join(APP_DIRECTORY, 'favicon.ico'), buildIco(images));
};

await generate();
