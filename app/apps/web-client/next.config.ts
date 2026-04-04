import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@vendza/ui", "@vendza/utils", "@vendza/types"],
  // Fix: múltiplos lockfiles confundem o Next.js no monorepo — definir root explícito
  outputFileTracingRoot: path.join(__dirname, "../../"),
  webpack: (config) => {
    // Desabilita cache de disco para evitar erros EPERM em ambientes OneDrive/cloud-sync
    config.cache = false;
    return config;
  },
};

export default nextConfig;
