import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    return config;
  },
  basePath: process.env.NEXT_PUBLIC_ROOT_PATH,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "dev.hiraise.net" },
      { protocol: "https", hostname: "hiraise.net" },
    ],
  },
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
