import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev indicator sits bottom-left and overlaps our own bottom-left chat
  // actions (Report/Next) at mobile widths — off since it's dev-only chrome anyway.
  devIndicators: false,
};

export default nextConfig;
