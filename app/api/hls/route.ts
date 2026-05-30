import { rewritePlaylistAny } from "@/lib/hlsProxy";

const APPROVED_ORIGIN = "https://www.soccertvhd.com";

// Exact origins allowed to call this proxy cross-origin
const ALLOWED_ORIGINS = new Set([
  "https://soccer-api.umuhozanews.workers.dev",
  "https://mie-sport.vercel.app",
  "https://www.soccertvhd.com",
]);

// Block private/loopback IP ranges and bare IPs to prevent SSRF.
// We allow any public HTTPS hostname — streams come from many CDNs.
const PRIVATE_IP_RE =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fd[0-9a-f]{2}:|fe80:|localhost)/i;

function isCdnHost(hostname: string): boolean {
  if (PRIVATE_IP_RE.test(hostname)) return false;
  if (/^\[/.test(hostname)) return false; // block IPv6 literals
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return false; // block bare IPv4
  return true;
}

function makeCorsHeaders(requestOrigin: string | null) {
  const allowed =
    requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)
      ? requestOrigin
      : APPROVED_ORIGIN;
  return new Headers({
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "Range,Accept,Content-Type",
    "access-control-expose-headers":
      "Content-Length,Content-Range,Accept-Ranges,Content-Type",
    vary: "Origin",
  });
}

function isPlaylistUrl(url: URL, contentType: string): boolean {
  return (
    /\.m3u8(?:\?|$)/i.test(url.toString()) ||
    /\.mpd(?:\?|$)/i.test(url.toString()) ||
    contentType.includes("mpegurl") ||
    contentType.includes("vnd.apple.mpegurl") ||
    contentType.includes("dash+xml")
  );
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: makeCorsHeaders(request.headers.get("origin")),
  });
}

function isValidReferer(ref: string): boolean {
  try {
    const u = new URL(ref);
    return (u.protocol === "https:" || u.protocol === "http:") && !PRIVATE_IP_RE.test(u.hostname);
  } catch { return false; }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  const refParam = searchParams.get("ref");

  if (!target) {
    return Response.json(
      { error: "Missing HLS target. Use /api/hls/{source}/{path} instead." },
      { status: 400 },
    );
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return Response.json({ error: "Invalid url parameter." }, { status: 400 });
  }

  // Only allow HTTPS to approved CDN hosts — prevents open-proxy / SSRF abuse
  if (targetUrl.protocol !== "https:") {
    return new Response("Only HTTPS streams are supported.", { status: 403 });
  }
  if (!isCdnHost(targetUrl.hostname)) {
    return new Response("Stream host not approved for proxying.", { status: 403 });
  }

  const reqOriginHeader = request.headers.get("origin");
  const range = request.headers.get("range");
  const isPlaylistTarget = /\.m3u8(?:\?|$)/i.test(target) || /\.mpd(?:\?|$)/i.test(target);

  // Build ordered list of referers to try: caller-supplied → soccertvhd fallback → bare (no referer).
  // Mirrors the named proxy's "origin-and-referer / referer-only / minimal" retry logic.
  const primaryRef = refParam && isValidReferer(refParam) ? refParam : APPROVED_ORIGIN;
  const referers: Array<string | null> = primaryRef === APPROVED_ORIGIN
    ? [APPROVED_ORIGIN, null]
    : [primaryRef, APPROVED_ORIGIN, null];

  const baseInit: RequestInit & { cf?: { cacheTtl?: number; cacheEverything?: boolean } } = {
    signal: AbortSignal.timeout(12_000),
    ...(!isPlaylistTarget ? { cf: { cacheTtl: 30, cacheEverything: true } } : {}),
  };

  let upstream: Response | null = null;
  for (const ref of referers) {
    const headers: Record<string, string> = {
      accept: "application/vnd.apple.mpegurl,application/x-mpegURL,video/mp2t,*/*",
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    };
    if (ref) { headers.referer = ref; headers.origin = new URL(ref).origin; }
    if (range) headers.range = range;

    try {
      const r = await fetch(target, { ...baseInit, headers } as RequestInit);
      // Accept on success or any non-auth error (404 = stream gone, let it pass through)
      if (r.ok || (r.status !== 403 && r.status !== 401 && r.status < 500)) {
        upstream = r;
        break;
      }
    } catch {
      if (ref === referers.at(-1)) {
        return new Response("Bad Gateway", { status: 502, headers: makeCorsHeaders(reqOriginHeader) });
      }
    }
  }

  if (!upstream) {
    return new Response("Bad Gateway", { status: 502, headers: makeCorsHeaders(reqOriginHeader) });
  }

  const cors = makeCorsHeaders(reqOriginHeader);
  const ct = upstream.headers.get("content-type") ?? "";

  if (upstream.ok && isPlaylistUrl(targetUrl, ct)) {
    const text = await upstream.text();
    const rewritten = rewritePlaylistAny(text, targetUrl, request.url);
    const headers = new Headers(cors);
    headers.set("content-type", ct || "application/vnd.apple.mpegurl");
    headers.set("cache-control", "no-store, no-cache");
    return new Response(rewritten, { status: upstream.status, headers });
  }

  const responseHeaders = new Headers(cors);
  if (ct) responseHeaders.set("content-type", ct);
  responseHeaders.set("cache-control", "public, s-maxage=30, stale-while-revalidate=10");
  const cl = upstream.headers.get("content-length");
  if (cl) responseHeaders.set("content-length", cl);
  const cr = upstream.headers.get("content-range");
  if (cr) responseHeaders.set("content-range", cr);
  const ar = upstream.headers.get("accept-ranges");
  if (ar) responseHeaders.set("accept-ranges", ar);

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
