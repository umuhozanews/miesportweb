import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Allow self-signed / incomplete TLS chains for local dev on Windows.
// This has no effect in production (CF Workers run their own TLS stack).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

if (!process.env.VERCEL) {
  initOpenNextCloudflareForDev();
}

// Applied to every response — hardens against common web attacks
const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent our pages from being iframed on other domains (clickjacking)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Legacy XSS filter (belt + suspenders alongside CSP)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Don't leak full URL to third-party sites; only send origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser APIs we don't need
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Don't cache API responses on CDN/proxies
  { key: "Vary", value: "Accept-Encoding" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // HLS/stream proxy — never cache at the browser or CDN level
        source: "/api/hls/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
      {
        // Match list — cache at the Cloudflare edge for 5 minutes
        source: "/api/matches",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=60" },
        ],
      },
      {
        // Stream server list — cache at the CF edge for 1 minute
        source: "/api/stream-servers",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=30" },
        ],
      },
      {
        // Livescore proxy — cache at the CF edge for 30 seconds
        source: "/api/livescore-proxy/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=15" },
        ],
      },
    ];
  },
};

export default nextConfig;
