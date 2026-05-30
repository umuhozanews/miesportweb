import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Only bypass TLS verification for local dev (Windows self-signed/incomplete cert chains).
// On Vercel the NODE_TLS_REJECT_UNAUTHORIZED env var DOES affect Node.js — keep it strict.
// CF Workers use their own TLS stack so the flag has no effect there regardless.
if (!process.env.VERCEL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

if (!process.env.VERCEL) {
  initOpenNextCloudflareForDev();
}

// Applied to every response — hardens against common web attacks
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Vary", value: "Accept-Encoding" },
  // Content-Security-Policy — allows Next.js inline scripts, external fonts,
  // and iframes from any HTTPS origin (needed for third-party stream embeds).
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js injects inline scripts; VideoJS loaded from CDN
      "script-src 'self' 'unsafe-inline' https://1aaaa.b-cdn.net https://2aaaaa.b-cdn.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://1aaaa.b-cdn.net",
      "img-src * data: blob:",
      "media-src * blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https:",
      // Stream embeds come from many third-party sources
      "frame-src 'self' https:",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // HLS/stream proxy — never cache at the browser level
        source: "/api/hls/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
      {
        source: "/api/matches",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=60" },
        ],
      },
      {
        source: "/api/stream-servers",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=50, stale-while-revalidate=15" },
        ],
      },
      {
        source: "/api/livescore-proxy/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=15" },
        ],
      },
      {
        source: "/api/img",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
