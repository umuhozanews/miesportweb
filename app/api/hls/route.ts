const APPROVED_ORIGIN = "https://www.soccertvhd.com";

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

  if (!targetUrl.hostname.endsWith(".cachefly.net")) {
    return new Response("Disallowed stream host.", { status: 403 });
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
    upstream = await fetch(target, { headers: upstreamHeaders });
  } catch {
    return new Response("Bad Gateway", {
      status: 502,
      headers: makeCorsHeaders(reqOriginHeader),
    });
  }

  const cors = makeCorsHeaders(reqOriginHeader);
  const ct = upstream.headers.get("content-type") ?? "";
  const responseHeaders = new Headers(cors);
  if (ct) responseHeaders.set("content-type", ct);
  responseHeaders.set("cache-control", "no-store");
  const cl = upstream.headers.get("content-length");
  if (cl) responseHeaders.set("content-length", cl);

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
