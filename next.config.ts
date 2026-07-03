import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.STANDALONE_OUTPUT === "1" ? "standalone" : undefined
};

export default nextConfig;
