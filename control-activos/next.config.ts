import type { NextConfig } from "next";

const allowedDevOriginsFromEnv =
  process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const allowedDevOrigins = Array.from(
  new Set(["192.168.1.45", ...allowedDevOriginsFromEnv])
);

const nextConfig: NextConfig = {
  allowedDevOrigins,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
