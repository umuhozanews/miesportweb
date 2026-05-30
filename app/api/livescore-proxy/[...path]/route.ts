const BASE = "https://mev-api.live-lsm.ls-g.net";

// Only these origins may call the proxy cross-origin
const ALLOWED_ORIGINS = new Set([
  "https://soccer-api.umuhozanews.workers.dev",
  "https://mie-sport.vercel.app",
]);

export const dynamic = "force-dynamic";

function corsHeaders(requestOrigin: string | null) {
  const allowed = requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)
    ? requestOrigin
    : "https://mie-sport.vercel.app";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "Accept,Content-Type",
    vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = "/" + path.join("/");
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const upstreamUrl = `${BASE}${apiPath}${qs ? "?" + qs : ""}`;

  const reqOrigin = request.headers.get("origin");

  try {
    const res = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.livescore.com/",
        Origin: "https://www.livescore.com",
      },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        ...corsHeaders(reqOrigin),
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Upstream error" }), {
      status: 502,
      headers: { "content-type": "application/json", ...corsHeaders(reqOrigin) },
    });
  }
}
