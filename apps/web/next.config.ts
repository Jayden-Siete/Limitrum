import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  ...(isDev ? { distDir: "tmp-next-dev" } : {}),
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
