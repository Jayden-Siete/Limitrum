import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "tmp-next-dev",
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
