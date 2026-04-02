import path from 'path';

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: path.resolve(process.cwd()),
};

export default nextConfig;
