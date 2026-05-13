import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

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
        // Tell browsers not to cache API responses
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
