import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/d/:inviteId", destination: "/date/:inviteId" },
    ];
  },
};

export default nextConfig;
