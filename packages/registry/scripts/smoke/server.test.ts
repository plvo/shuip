import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PUBLISHED_VARIANTS } from '@repo/registry/style-base';
import { serveRegistry } from './server';

describe('serveRegistry', () => {
  let publicDir: string;
  let server: ReturnType<typeof serveRegistry>;

  beforeAll(() => {
    publicDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-serve-'));
    for (const variant of PUBLISHED_VARIANTS) {
      fs.mkdirSync(path.join(publicDir, 'r', variant), { recursive: true });
      fs.writeFileSync(path.join(publicDir, 'r', variant, 'demo.json'), JSON.stringify({ name: 'demo', variant }));
    }
    server = serveRegistry(publicDir);
  });

  afterAll(() => {
    server.stop(true);
    fs.rmSync(publicDir, { recursive: true, force: true });
  });

  const get = (pathname: string): Promise<Response> => fetch(new URL(pathname, server.url));

  test.each(['radix-vega', 'new-york-v4', 'default'])('serves a %s consumer the radix variant', async (style) => {
    const response = await get(`/r/${style}/demo.json`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: 'demo', variant: 'radix' });
  });

  test('serves the variant folder directly, like the static host', async () => {
    expect((await get('/r/radix/demo.json')).status).toBe(200);
  });

  test('answers 404 for an unknown item', async () => {
    expect((await get('/r/radix-vega/missing.json')).status).toBe(404);
  });
});
