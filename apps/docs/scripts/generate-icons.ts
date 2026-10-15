/**
 * Derives the site icons in `src/app/` from the mark in `src/assets/shuip-mark.svg`:
 *   icon.svg        the mark, light or dark with the browser theme
 *   apple-icon.png  180x180 tile for the iOS home screen
 *   favicon.ico     16, 32 and 48 pixel tiles for browsers without SVG favicons
 *
 * Run it with `bun run icons:generate` from `apps/docs` after changing the mark, and commit the outputs.
 * Rasterising uses `bunx sharp-cli`, fetched on demand rather than installed in the repository.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildIco, readMarkSource, type TileOptions, themedMarkSvg, tileSvg } from './icons';

const APP_DIRECTORY = path.resolve(import.meta.dir, '..', 'src', 'app');

const APPLE_ICON: TileOptions = { size: 180, inset: 0.1, radius: 0 };
const FAVICON_TILES: TileOptions[] = [16, 32, 48].map((size) => ({ size, inset: 0.08, radius: 0.22 }));

const rasterise = async (svg: string, workDirectory: string, name: string): Promise<Uint8Array> => {
  const input = path.join(workDirectory, `${name}.svg`);
  const output = path.join(workDirectory, `${name}.png`);
  fs.writeFileSync(input, svg);
  const converter = Bun.spawn(['bunx', 'sharp-cli', '-i', input, '-o', output], { stderr: 'inherit' });
  if ((await converter.exited) !== 0) throw new Error(`sharp-cli failed to rasterise ${name}`);
  return fs.readFileSync(output);
};

const generate = async (): Promise<void> => {
  const source = readMarkSource();
  const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-icons-'));
  try {
    fs.writeFileSync(path.join(APP_DIRECTORY, 'icon.svg'), `${themedMarkSvg(source)}\n`);

    fs.writeFileSync(
      path.join(APP_DIRECTORY, 'apple-icon.png'),
      await rasterise(tileSvg(source, APPLE_ICON), workDirectory, 'apple-icon'),
    );

    const images = await Promise.all(
      FAVICON_TILES.map(async (tile) => ({
        size: tile.size,
        data: await rasterise(tileSvg(source, tile), workDirectory, `favicon-${tile.size}`),
      })),
    );
    fs.writeFileSync(path.join(APP_DIRECTORY, 'favicon.ico'), buildIco(images));
  } finally {
    fs.rmSync(workDirectory, { recursive: true });
  }
};

await generate();
