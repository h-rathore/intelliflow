import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for development warnings
  reactStrictMode: true,

  // Environment variables exposed to the browser must be prefixed with NEXT_PUBLIC_
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  },
};

export default nextConfig;
