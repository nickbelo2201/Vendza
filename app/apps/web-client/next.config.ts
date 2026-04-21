import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vendza/ui", "@vendza/utils", "@vendza/types"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.com",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/render/image/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.com",
        pathname: "/storage/v1/render/image/public/**",
      },
    ],
  },
  webpack: (config) => {
    // Desabilita cache de disco para evitar erros EPERM em ambientes OneDrive/cloud-sync
    config.cache = false;
    return config;
  },
};

export default nextConfig;
