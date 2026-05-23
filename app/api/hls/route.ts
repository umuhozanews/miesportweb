import { rewritePlaylistAny } from "@/lib/hlsProxy";

const APPROVED_ORIGIN = "https://www.soccertvhd.com";

const ALLOWED_ORIGINS = new Set([
  "https://soccer-api.umuhozanews.workers.dev",
  "https://mie-sport.vercel.app",
  "https://www.soccertvhd.com",
]);

function makeCorsHeaders(requestOrigin: string | null) {
  const allowed =
    requestOrigin && (ALLOWED_ORIGINS.has(requestOrigin) || requestOrigin.endsWith(".vercel.app"))
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

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

  if (targetUrl.protocol !== "https:" && targetUrl.protocol !== "http:") {
    return new Response("Only HTTP/HTTPS streams are supported.", { status: 403 });
  }

  const reqOriginHeader = request.headers.get("origin");
  const range = request.headers.get("range");
  const upstreamHeaders: Record<string, string> = {
    accept: "application/vnd.apple.mpegurl,application/x-mpegURL,video/mp2t,*/*",
    referer: APPROVED_ORIGIN,
    origin: APPROVED_ORIGIN,
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  };
  if (range) upstreamHeaders["range"] = range;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return new Response("Bad Gateway", {
      status: 502,
      headers: makeCorsHeaders(reqOriginHeader),
    });
  }

  const cors = makeCorsHeaders(reqOriginHeader);
  const ct = upstream.headers.get("content-type") ?? "";

  // ── Playlist (manifest) ──────────────────────────────────────────────────────
  // Read the manifest, rewrite every media URL to go through our proxy so that
  // HLS.js fetches segments with the correct Referer/Origin headers instead of
  // hitting the CDN directly from the browser (which would be blocked by CORS/auth).
  if (upstream.ok && isPlaylistUrl(targetUrl, ct)) {
    const text = await upstream.text();
    const rewritten = rewritePlaylistAny(text, targetUrl, request.url);
    const headers = new Headers(cors);
    headers.set("content-type", ct || "application/vnd.apple.mpegurl");
    headers.set("cache-control", "no-store, no-cache");
    return new Response(rewritten, { status: upstream.status, headers });
  }

  // ── Media segment (TS / fMP4 / etc.) ────────────────────────────────────────
  const responseHeaders = new Headers(cors);
  if (ct) responseHeaders.set("content-type", ct);
  // Cache TS segments at the CF edge so concurrent viewers share bandwidth
  responseHeaders.set("cache-control", "public, s-maxage=30, stale-while-revalidate=10");
  const cl = upstream.headers.get("content-length");
  if (cl) responseHeaders.set("content-length", cl);
  const cr = upstream.headers.get("content-range");
  if (cr) responseHeaders.set("content-range", cr);
  const ar = upstream.headers.get("accept-ranges");
  if (ar) responseHeaders.set("accept-ranges", ar);

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
