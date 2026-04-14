import type { NextConfig } from "next";
// @ts-ignore — @ducanh2912/next-pwa não possui declarações de tipo completas
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  disable: true, // desabilitado até configuração correta do SW — evita quebra de Server Actions
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
