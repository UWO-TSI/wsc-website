import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/*
  next/image loads storage images from this project's Supabase host only,
  the host of NEXT_PUBLIC_SUPABASE_URL at build time, never any other
  project on supabase.co. With the variable unset there is no Supabase
  host to allow, so no remote image is allowed.

  Local development against `supabase start` serves storage from
  http://127.0.0.1:54321, which next/image refuses by default (private IP).
  Allowed only when the configured Supabase URL is itself local, which is
  never the case on Vercel, so production keeps the strict default.
*/
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const localSupabase = /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(supabaseUrl);
const STORAGE_PATH = "/storage/v1/object/public/**";

function storagePattern(): RemotePattern | null {
  let url: URL;
  try {
    url = new URL(supabaseUrl);
  } catch {
    return null;
  }
  if (localSupabase) {
    return { protocol: "http", hostname: url.hostname, port: "54321", pathname: STORAGE_PATH };
  }
  if (url.protocol !== "https:") return null;
  return { protocol: "https", hostname: url.hostname, port: url.port, pathname: STORAGE_PATH };
}

const storage = storagePattern();

/*
  Response headers on every route.

  - frame-ancestors 'none' and X-Frame-Options DENY: no other site can put
    a page of this one in a frame, so /admin cannot be overlaid for
    clickjacking. X-Frame-Options covers browsers without CSP level 2.
  - nosniff: a response is read only as its declared type.
  - strict-origin-when-cross-origin: another site sees this origin, never
    the path or query.
  - Permissions-Policy: the site uses no camera, microphone or location,
    so no page or embedded frame can ask for them.

  The Content-Security-Policy carries frame-ancestors only. A script-src
  policy would need a per-request nonce for Next's inline scripts (set in
  middleware, which makes every page dynamic) plus connect-src entries for
  the Supabase host and EmailJS, so it is not set here.
*/
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: storage ? [storage] : [],
    ...(localSupabase ? { dangerouslyAllowLocalIP: true } : {}),
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
