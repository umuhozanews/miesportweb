import { FREE_MODE } from "@/lib/config";

const APPROVED_ORIGIN = "https://www.soccertvhd.com";
const STREAM_SOURCES = {
  bustrr: "bustrr.cachefly.net",
  laliscorr: "laliscorr.cachefly.net",
  remleg: "remleg.cachefly.net",
  serspurgg: "serspurgg.cachefly.net",
} as const;
const STREAM_REFERERS = {
  bustrr: "https://www.soccertvhd.com/streameast-stream-east-live-streaming/",
  laliscorr: "https://www.soccertvhd.com/score808-score808-live/",
  remleg: "https://www.soccertvhd.com/hesgoal-hes-goal-live-streaming/",
  serspurgg: "https://www.soccertvhd.com/sportsurge-sport-surge-live-streaming/",
} satisfies Record<StreamSource, string>;

export type StreamSource = keyof typeof STREAM_SOURCES;

const STREAM_SOURCE_BY_HOST = new Map<string, StreamSource>(
  (Object.keys(STREAM_SOURCES) as StreamSource[]).map((source) => [
    STREAM_SOURCES[source],
    source,
  ]),
);
const ALLOWED_REQUEST_ORIGINS = new Set([
  "https://www.soccertvhd.com",
  "https://soccer-api.anime-proxy.workers.dev",
]);

/** Reverse a proxied relative URL back to the original stream URL for verification. */
export function getOriginalStreamUrl(proxied: string): string | null {
  // /api/hls?url=https://...
  if (proxied.startsWith("/api/hls?")) {
    try {
      return new URLSearchParams(proxied.slice("/api/hls?".length)).get("url");
    } catch { return null; }
  }
  // /api/hls/source/path/to/stream.m3u8?query
  if (proxied.startsWith("/api/hls/")) {
    try {
      const rest = proxied.slice("/api/hls/".length);
      const slash = rest.indexOf("/");
      if (slash === -1) return null;
      const source = rest.slice(0, slash);
      const pathAndQuery = rest.slice(slash); // e.g. "/live/stream.m3u8?token=x"
      const parsed = new URL("https://placeholder.invalid" + pathAndQuery);
      const segments = parsed.pathname.slice(1).split("/").filter(Boolean);
      const target = getStreamTargetUrl(source, segments, parsed.search);
      return target?.toString() ?? null;
    } catch { return null; }
  }
  // Already absolute
  if (/^https?:\/\//i.test(proxied)) return proxied;
  return null;
}

export function getProxiedHlsUrl(target: string, requestUrl = "http://localhost", referer?: string) {
  if (FREE_MODE) {
    return target;
  }
  const streamUrl = new URL(target);
  const source = getStreamSource(streamUrl);

  if (source) {
    const url = new URL(`/api/hls/${source}${streamUrl.pathname}`, requestUrl);
    url.search = streamUrl.search;
    return url.pathname + url.search;
  }

  // Proxy ALL other HLS streams — ensures correct referer/origin headers reach the CDN.
  // Pass an optional ?ref= so the proxy sends the right Referer for non-soccertvhd sources.
  const url = new URL("/api/hls", requestUrl);
  url.searchParams.set("url", target);
  if (referer) url.searchParams.set("ref", referer);
  return url.pathname + url.search;
}

export function getStreamTargetUrl(source: string, path: string[], search: string) {
  if (!isStreamSource(source) || path.length === 0) {
    return null;
  }

  const target = new URL(
    `/${path.map(encodeURIComponent).join("/")}`,
    `https://${STREAM_SOURCES[source]}`,
  );
  target.search = search;
  return target;
}

export async function proxyHlsRequest(request: Request, target: string) {
  let streamUrl: URL;
  try {
    streamUrl = new URL(target);
  } catch {
    return Response.json(
      { error: "Invalid HLS target URL." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  if (!isAllowedStreamUrl(streamUrl)) {
    return Response.json(
      { error: "This stream host is not approved for proxying." },
      { status: 403, headers: corsHeaders(request) },
    );
  }

  const upstream = await fetchUpstream(request, streamUrl);

  if (!upstream) {
    return new Response("Bad Gateway", { status: 502, headers: corsHeaders(request) });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const playlist = isPlaylist(streamUrl, contentType);
  const responseHeaders = proxyResponseHeaders(request, upstream.headers, {
    includeContentLength: !playlist,
  });

  if (!upstream.ok) {
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }

  if (playlist) {
    const playlistBody = await upstream.text();
    return new Response(rewritePlaylist(playlistBody, streamUrl, request.url), {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export function corsHeaders(request?: Request) {
  const origin = request?.headers.get("origin");
  const allowedOrigin =
    origin && ALLOWED_REQUEST_ORIGINS.has(origin) ? origin : APPROVED_ORIGIN;

  return new Headers({
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "Range,Accept,Content-Type",
    "access-control-expose-headers":
      "Content-Length,Content-Range,Accept-Ranges,Content-Type",
    vary: "Origin",
  });
}

const PRIVATE_IP_RE =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fd[0-9a-f]{2}:|fe80:|localhost)/i;

function isAllowedStreamUrl(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (PRIVATE_IP_RE.test(url.hostname)) return false;
  if (/^\[/.test(url.hostname)) return false; // IPv6 literals
  if (/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) return false; // bare IPv4
  return true;
}

function getStreamSource(url: URL) {
  return STREAM_SOURCE_BY_HOST.get(url.hostname) ?? null;
}

function isStreamSource(source: string): source is StreamSource {
  return source in STREAM_SOURCES;
}

async function fetchUpstream(request: Request, streamUrl: URL) {
  const attempts: Array<"origin-and-referer" | "referer-only" | "minimal"> = [
    "origin-and-referer",
    "referer-only",
    "minimal",
  ];
  const urls = getUpstreamUrlCandidates(streamUrl);

  let response: Response | undefined;

  for (const url of urls) {
    for (const mode of attempts) {
      response = await fetch(url, {
        cache: "no-store",
        headers: await upstreamHeaders(request, streamUrl, mode),
      });

      if (await isUsableUpstreamResponse(response)) {
        return response;
      }
    }
  }

  if (!response) {
    throw new Error("Unable to fetch upstream stream.");
  }

  return response;
}

function getUpstreamUrlCandidates(streamUrl: URL) {
  const urls = [streamUrl];

  if (streamUrl.protocol === "https:") {
    const httpUrl = new URL(streamUrl);
    httpUrl.protocol = "http:";
    urls.push(httpUrl);
  }

  return urls;
}

async function isUsableUpstreamResponse(response: Response) {
  if (response.ok) return true;
  // 403/401: auth-header issue — try next header mode
  if (response.status === 403 || response.status === 401) return false;
  // 5xx: upstream server error — not a valid stream response
  if (response.status >= 500) return false;
  // Other 4xx (404 = stream gone, etc.) — pass through to client
  return true;
}

const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

function pickUA() {
  return UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
}

async function upstreamHeaders(
  request: Request,
  streamUrl: URL,
  mode: "origin-and-referer" | "referer-only" | "minimal",
) {
  const urlParams = new URL(request.url).searchParams;
  const customReferer = urlParams.get("ref");
  const customOrigin = urlParams.get("org");
  
  const source = getStreamSource(streamUrl);
  const headers = new Headers({
    accept:
      request.headers.get("accept") ??
      "application/vnd.apple.mpegurl,application/x-mpegURL,video/mp2t,*/*",
    "accept-language": "en-US,en;q=0.9",
    priority: "u=1, i",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent": pickUA(),
    "x-no-redirect": "1",
  });

  if (mode === "origin-and-referer") {
    headers.set("origin", customOrigin || (customReferer ? new URL(customReferer).origin : APPROVED_ORIGIN));
  }

  if (mode !== "minimal") {
    headers.set("referer", customReferer || (source ? STREAM_REFERERS[source] : APPROVED_ORIGIN));
  }

  const range = request.headers.get("range");
  if (range) {
    headers.set("range", range);
  }

  return headers;
}

function proxyResponseHeaders(
  request: Request,
  upstreamHeaders: Headers,
  options: { includeContentLength: boolean },
) {
  const headers = corsHeaders(request);
  const contentType = upstreamHeaders.get("content-type");
  const contentLength = upstreamHeaders.get("content-length");
  const acceptRanges = upstreamHeaders.get("accept-ranges");
  const contentRange = upstreamHeaders.get("content-range");
  const cacheControl = upstreamHeaders.get("cache-control");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (contentLength && options.includeContentLength) {
    headers.set("content-length", contentLength);
  }

  if (acceptRanges) {
    headers.set("accept-ranges", acceptRanges);
  }

  if (contentRange) {
    headers.set("content-range", contentRange);
  }

  if (cacheControl) {
    headers.set("cache-control", cacheControl);
  } else {
    headers.set("cache-control", "no-store");
  }

  return headers;
}

function isPlaylist(url: URL, contentType: string) {
  return (
    /\.m3u8(?:\?|$)/i.test(url.toString()) ||
    contentType.includes("mpegurl") ||
    contentType.includes("vnd.apple.mpegurl")
  );
}

function rewritePlaylist(playlist: string, playlistUrl: URL, requestUrl: string) {
  return playlist
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }

      const mediaUrl = new URL(trimmed, playlistUrl);

      if (!isAllowedStreamUrl(mediaUrl)) {
        return line;
      }

      return getProxiedHlsUrl(mediaUrl.toString(), requestUrl);
    })
    .join("\n");
}

/**
 * Like rewritePlaylist but rewrites ALL http/https media lines — not just
 * known cachefly hosts. Used by the /api/hls?url= flat proxy so that
 * non-cachefly CDN segments are also routed through our proxy and receive
 * the correct Referer/Origin headers instead of being fetched raw by the browser.
 */
export function rewritePlaylistAny(
  playlist: string,
  playlistUrl: URL,
  requestUrl: string,
): string {
  return playlist
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      try {
        const mediaUrl = new URL(trimmed, playlistUrl);
        if (mediaUrl.protocol !== "https:" && mediaUrl.protocol !== "http:") return line;
        return getProxiedHlsUrl(mediaUrl.toString(), requestUrl);
      } catch {
        return line;
      }
    })
    .join("\n");
}
