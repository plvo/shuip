import { describe, expect, test } from 'bun:test';
import { styleRewrites } from '@repo/registry/style-base';
import nextConfig from '../next.config';
import { baseRedirects } from '../src/lib/base-routes';

describe('next config', () => {
  test('serves the registry through the shared style rewrites', async () => {
    expect(await nextConfig.rewrites?.()).toEqual(styleRewrites());
  });

  test('redirects the addresses without a base permanently to the default base', async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];

    expect(redirects).toEqual(baseRedirects());
    expect(redirects.length).toBeGreaterThan(0);
    expect(redirects.every((redirect) => redirect.permanent)).toBe(true);
  });
});
