import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PUBLISHED_VARIANTS, styleRewrites } from '@repo/registry/style-base';
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

  test('serves the variants the given rewrites route to', async () => {
    const dedicated = serveRegistry(path.join(workDir, 'public'), styleRewrites({ base: 'base', radix: 'radix' }));
    try {
      const fetchVariant = async (style: string) =>
        (await (await fetch(new URL(`/r/${style}/demo.json`, dedicated.origin))).json()) as { variant: string };
      expect((await fetchVariant('base-vega')).variant).toBe('base');
      expect((await fetchVariant('radix-vega')).variant).toBe('radix');
    } finally {
      dedicated.stop();
    }
  });

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
  ])('does not serve a file outside the registry through an %s', async (_, name) => {
    const response = await get(`/r/radix-vega/${name}.json`);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('secret');
  });

  test.each([
    ['overlong utf-8 dot', '%c0%ae'],
    ['truncated utf-8 sequence', '%e0%80%ae'],
    ['unicode escape', '%u002e'],
    ['null byte', 'demo%00'],
  ])('answers a bare 404 to a malformed %s', async (_, name) => {
    const response = await get(`/r/radix-vega/${name}.json`);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
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
