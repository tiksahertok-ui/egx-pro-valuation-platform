import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false, // NEVER suppress TypeScript errors
  },
  reactStrictMode: true, // Enable React strict mode for safety checks
  allowedDevOrigins: [
    ".space-z.ai",
  ],
};

export default withNextIntl(nextConfig);
