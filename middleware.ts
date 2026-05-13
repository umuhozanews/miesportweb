import { NextResponse, type NextRequest } from "next/server";

// Known scraper/bot identifiers — block these from API routes
const BOT_UA_RE =
  /bot|crawl|spider|scraper|curl|wget|python-requests|python\/|java\/|ruby|php\/|axios|node-fetch|libwww|httpclient|go-http-client|okhttp|dart|aiohttp|scrapy|playwright|puppeteer|headless|selenium|phantomjs/i;

// Paths that should only be called from a browser loading the page
const PROTECTED_API = ["/api/stream", "/api/matches"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get("user-agent") ?? "";

  // ── Block bots from internal API routes ──────────────────────────────────
  if (PROTECTED_API.some((p) => pathname.startsWith(p))) {
    // No UA at all → definitely a script
    if (!ua) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    // UA matches known bot/scraper
    if (BOT_UA_RE.test(ua)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    // Require a browser Accept header — raw fetch calls from scripts usually send "application/json" or nothing
    const accept = request.headers.get("accept") ?? "";
    if (!accept.includes("*/*") && !accept.includes("text/html") && !accept.includes("application/json")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ── Prevent other sites from hotlinking our HLS proxy ────────────────────
  if (pathname.startsWith("/api/hls")) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host") ?? "";

    if (origin) {
      // Allow same-origin and Vercel preview URLs
      const allowedOrigin =
        origin.endsWith(host) ||
        origin.endsWith(".vercel.app") ||
        origin === "null"; // file:// during local dev

      if (!allowedOrigin) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (referer) {
      // Non-browser HLS clients won't send a referer — that's fine
      // but if they do, it must be our own domain
      const ref = new URL(referer);
      if (!ref.host.endsWith(host) && !ref.host.endsWith(".vercel.app")) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  const response = NextResponse.next();

  // ── Make our pages harder to scrape ──────────────────────────────────────
  // Ask CDNs / Vercel to not cache pages (they change in real-time)
  if (!pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  // Run on all paths except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|mie-logo.png).*)"],
};
