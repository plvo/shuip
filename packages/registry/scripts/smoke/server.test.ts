import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PUBLISHED_VARIANTS } from '@repo/registry/style-base';
import { type RegistryServer, serveRegistry } from './server';

describe('serveRegistry', () => {
  let workDir: string;
  let server: RegistryServer;

  beforeAll(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-serve-'));
    const publicDir = path.join(workDir, 'public');
    for (const variant of PUBLISHED_VARIANTS) {
      fs.mkdirSync(path.join(publicDir, 'r', variant), { recursive: true });
      fs.writeFileSync(path.join(publicDir, 'r', variant, 'demo.json'), JSON.stringify({ name: 'demo', variant }));
    }
    fs.writeFileSync(path.join(workDir, 'secret.json'), '{"secret":true}');
    server = serveRegistry(publicDir);
  });

  afterAll(() => {
    server.stop();
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  const get = (pathname: string): Promise<Response> => fetch(new URL(pathname, server.origin));

  test.each([
    'base-vega',
    'radix-vega',
    'new-york-v4',
    'default',
  ])('serves a %s consumer the radix variant', async (style) => {
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

  test('records the paths it served, and only those', async () => {
    await get('/r/radix-vega/demo.json');
    await get('/r/radix-vega/missing.json');
    expect(server.servedPaths.has('/r/radix-vega/demo.json')).toBe(true);
    expect(server.servedPaths.has('/r/radix-vega/missing.json')).toBe(false);
  });

  test.each([
    ['encoded slash', '..%2F..%2F..%2Fsecret'],
    ['encoded dots and slash', '%2e%2e%2f%2e%2e%2f%2e%2e%2fsecret'],
    ['encoded backslash', '..%5C..%5C..%5Csecret'],
    ['encoded dots and backslash', '%2e%2e%5c%2e%2e%5c%2e%2e%5csecret'],
    ['double encoded slash', '..%252F..%252F..%252Fsecret'],
  ])('answers 404 to a traversal with an %s', async (_, name) => {
    expect((await get(`/r/radix-vega/${name}.json`)).status).toBe(404);
    expect((await get(`/r/radix/${name}.json`)).status).toBe(404);
  });

  test('listens on the loopback interface only', async () => {
    expect(new URL(server.origin).hostname).toBe('127.0.0.1');

    const externalAddress = Object.values(os.networkInterfaces())
      .flat()
      .find((networkInterface) => networkInterface?.family === 'IPv4' && !networkInterface.internal)?.address;
    if (externalAddress) {
      const reachable = await fetch(`http://${externalAddress}:${new URL(server.origin).port}/r/radix/demo.json`).then(
        () => true,
        () => false,
      );
      expect(reachable).toBe(false);
    }
  });
});
