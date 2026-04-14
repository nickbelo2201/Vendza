import type { NextConfig } from "next";
// @ts-ignore — @ducanh2912/next-pwa não possui declarações de tipo completas
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: false, // desabilitado: cache de HTML causa hidratação incorreta e quebra Server Actions
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  transpilePackages: ["@vendza/ui", "@vendza/utils", "@vendza/types"],
  webpack: (config) => {
    // Desabilita cache de disco para evitar erros EPERM em ambientes OneDrive/cloud-sync
    config.cache = false;
    return config;
  },
};

export default withPWA(nextConfig);
