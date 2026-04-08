import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vendza/ui", "@vendza/utils", "@vendza/types"],
  webpack: (config) => {
    // Desabilita cache de disco para evitar erros EPERM em ambientes OneDrive/cloud-sync
    config.cache = false;
    return config;
  },
};

export default nextConfig;
