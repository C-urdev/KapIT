import path from 'path';

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;