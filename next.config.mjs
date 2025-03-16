/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  webpack: (config) => {
    // This will ignore the 'fs', 'encoding' modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      encoding: false,
    };
    
    return config;
  },
};

export default nextConfig;
