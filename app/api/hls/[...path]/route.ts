// ── Stream source registry ────────────────────────────────────────────────
const STREAM_SOURCES = {
  bustrr: "bustrr.cachefly.net",
  laliscorr: "laliscorr.cachefly.net",
  remleg: "remleg.cachefly.net",
  serspurgg: "serspurgg.cachefly.net",
} as const;

const STREAM_REFERERS: Record<keyof typeof STREAM_SOURCES, string> = {
  bustrr: "https://www.soccertvhd.com/streameast-stream-east-live-streaming/",
  laliscorr: "https://www.soccertvhd.com/score808-score808-live/",
  remleg: "https://www.soccertvhd.com/hesgoal-hes-goal-live-streaming/",
  serspurgg: "https://www.soccertvhd.com/sportsurge-sport-surge-live-streaming/",
};

type StreamSource = keyof typeof STREAM_SOURCES;

const APPROVED_ORIGIN = "https://www.soccertvhd.com";
const SOURCE_BY_HOST = new Map<string, StreamSource>(
  Object.entries(STREAM_SOURCES).map(([k, v]) => [v, k as StreamSource]),
);

function isStreamSource(s: string): s is StreamSource {
  return s in STREAM_SOURCES;
}

function makeCorsHeaders(requestOrigin: string | null) {
  return new Headers({
    "access-control-allow-origin": APPROVED_ORIGIN,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "Range,Accept,Content-Type",
    "access-control-expose-headers":
      "Content-Length,Content-Range,Accept-Ranges,Content-Type",
    vary: "Origin",
    ...(requestOrigin?.endsWith(".vercel.app") || requestOrigin === "null"
      ? { "access-control-allow-origin": requestOrigin }
      : {}),
  });
}

function rewritePlaylist(text: string, baseUrl: URL, proxyOrigin: string): string {
  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return line;
      let resolved: URL;
      try {
        resolved = new URL(t, baseUrl);
      } catch {
        return line;
      }
      const src = SOURCE_BY_HOST.get(resolved.hostname);
      if (src) {
        return `${proxyOrigin}/api/hls/${src}${resolved.pathname}${resolved.search}`;
      }
      if (resolved.hostname.endsWith(".cachefly.net")) {
        return `${proxyOrigin}/api/hls?url=${encodeURIComponent(resolved.toString())}`;
      }
      return line;
    })
    .join("\n");
}

type HlsPathContext = { params: Promise<{ path: string[] }> };

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: makeCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request, { params }: HlsPathContext) {
  const { path } = await params;
  const [source, ...rest] = path;

  if (!isStreamSource(source) || rest.length === 0) {
    return Response.json({ error: "Unknown HLS stream source." }, { status: 404 });
  }

  const { search, origin: reqOrigin } = new URL(request.url);
  const targetUrl = `https://${STREAM_SOURCES[source]}/${rest.join("/")}${search}`;
  const reqOriginHeader = request.headers.get("origin");
  const range = request.headers.get("range");

  const upstreamHeaders: Record<string, string> = {
    accept: "application/vnd.apple.mpegurl,application/x-mpegURL,video/mp2t,*/*",
    "accept-language": "en-US,en;q=0.9",
    referer: STREAM_REFERERS[source],
    origin: APPROVED_ORIGIN,
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
  };
  if (range) upstreamHeaders["range"] = range;

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, { headers: upstreamHeaders });
  } catch (e) {
    return new Response("Bad Gateway", {
      status: 502,
      headers: makeCorsHeaders(reqOriginHeader),
    });
  }

  const cors = makeCorsHeaders(reqOriginHeader);
  const contentType = upstream.headers.get("content-type") ?? "";
  const isPlaylist =
    /\.m3u8(\?|$)/i.test(targetUrl) ||
    contentType.includes("mpegurl") ||
    contentType.includes("vnd.apple");

  const responseHeaders = new Headers(cors);
  if (contentType) responseHeaders.set("content-type", contentType);
  responseHeaders.set("cache-control", upstream.headers.get("cache-control") ?? "no-store");

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  if (isPlaylist) {
    const body = await upstream.text();
    const rewritten = rewritePlaylist(body, new URL(targetUrl), reqOrigin);
    responseHeaders.set("content-type", "application/vnd.apple.mpegurl");
    return new Response(rewritten, { status: 200, headers: responseHeaders });
  }

  // Stream binary (TS segments, etc.)
  for (const h of ["content-length", "accept-ranges", "content-range"] as const) {
    const v = upstream.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
