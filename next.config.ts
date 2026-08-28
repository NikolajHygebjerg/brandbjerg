import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  redirects: async () => [
    {
      source: "/rengoring/admin",
      destination: "/rengoring?tab=uddelegering",
      permanent: false,
    },
  ],
};

export default nextConfig;
