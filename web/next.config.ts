import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: process.env.NEXT_PUBLIC_ROOT_PATH,
  trailingSlash: true,
};

export default nextConfig;
