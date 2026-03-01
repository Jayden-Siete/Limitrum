import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  ...(isDev ? { distDir: "tmp-next-dev" } : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
