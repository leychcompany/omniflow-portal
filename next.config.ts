import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NEXT_BUILD_DIST_DIR
    ? { distDir: process.env.NEXT_BUILD_DIST_DIR }
    : {}),
  async redirects() {
    return [
      { source: "/admin/manuals", destination: "/admin/documents", permanent: true },
      { source: "/admin/manuals/add", destination: "/admin/documents/add", permanent: true },
      { source: "/admin/manuals/:id/edit", destination: "/admin/documents/:id/edit", permanent: true },
    ];
  },
  experimental: {
    isolatedDevBuild: false,
    proxyClientMaxBodySize: "1gb",
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
