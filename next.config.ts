import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    isolatedDevBuild: false,
    proxyClientMaxBodySize: "1gb",
  },
};

export default nextConfig;
