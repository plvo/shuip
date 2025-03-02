import type { NextConfig } from 'next';
import { createContentlayerPlugin } from 'next-contentlayer2';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    registry: ['./registry/**/*'],
  },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactStrictMode: true,
};

const withContentlayer = createContentlayerPlugin({});

export default withContentlayer(nextConfig);
