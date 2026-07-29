import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://127.0.0.1:3001/api/:path*" }];
  },
};

export default nextConfig;
