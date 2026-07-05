import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@__PROJECT_SLUG__/shared-types'],
};

export default nextConfig;
