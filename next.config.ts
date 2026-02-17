import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    isolatedDevBuild: false,
  },
};

export default nextConfig;
