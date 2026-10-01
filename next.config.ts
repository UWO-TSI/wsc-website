import type { NextConfig } from "next";

/*
  Local development against `supabase start` serves storage from
  http://127.0.0.1:54321, which next/image refuses by default (private IP).
  Allowed only when the configured Supabase URL is itself local, which is
  never the case on Vercel, so production keeps the strict default.
*/
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const localSupabase = /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(supabaseUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      ...(localSupabase
        ? [
            {
              protocol: 'http' as const,
              hostname: '127.0.0.1',
              port: '54321',
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
    ...(localSupabase ? { dangerouslyAllowLocalIP: true } : {}),
  },
};

export default nextConfig;
