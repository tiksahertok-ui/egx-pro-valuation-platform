import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false, // STRICT: fix all TS errors before build
  },
  reactStrictMode: true, // STRICT: catch side effects
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'egx.com.eg' },
      // Add ONLY explicitly required domains
    ],
  },
  // Do NOT expose secrets here; use runtime env vars only
};

export default nextConfig;
