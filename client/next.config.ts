import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  output: "standalone",
};

export default nextConfig;
