import type { NextConfig } from "next";
// @ts-ignore — @ducanh2912/next-pwa não possui declarações de tipo completas
import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(withPWA(nextConfig), {
  // Suprime logs do Sentry CLI durante o build
  silent: true,
  // Desabilita upload de source maps (sem auth token configurado)
  disableSourceMapUpload: true,
});
