import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@cursor/sdk",
    "@cursor/sdk-win32-x64",
    "@cursor/sdk-linux-x64",
  ],
};

export default nextConfig;
