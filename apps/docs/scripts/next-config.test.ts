import { describe, expect, test } from 'bun:test';
import { styleRewrites } from '@repo/registry/style-base';
import nextConfig from '../next.config';

describe('next config', () => {
  test('serves the registry through the shared style rewrites', async () => {
    expect(await nextConfig.rewrites?.()).toEqual(styleRewrites());
  });
});
