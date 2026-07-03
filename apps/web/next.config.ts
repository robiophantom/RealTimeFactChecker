import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.31.159'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;