import { styleRewrites } from '@repo/registry/style-base';
import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';

const withMDX = createMDX();

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    registry: ['../../packages/registry/items/**/*', '../../packages/registry/__index__.ts'],
  },

  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],

  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_APP_URL: process.env.PORTLESS_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://shuip.plvo.dev',
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  rewrites: async () => styleRewrites(),

  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*' }],
  },
};

export default withMDX(nextConfig);
