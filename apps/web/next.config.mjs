import path from 'path';

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: path.resolve(process.cwd()),
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }

    return config;
  },
};

export default nextConfig;
