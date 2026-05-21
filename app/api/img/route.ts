export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = [
  "storage.livescore.com",
  "lsm-static-prod.livescore.com",
  "a.espncdn.com",
  "api.sofascore.com",
  "cdn.sofascore.com",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target) return new Response("Missing url", { status: 400 });

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!ALLOWED_HOSTS.some((h) => targetUrl.hostname === h || targetUrl.hostname.endsWith("." + h))) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.livescore.com/",
        Origin: "https://www.livescore.com",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return new Response(null, { status: res.status });

    const body = await res.arrayBuffer();
    const ct = res.headers.get("Content-Type") || "image/png";

    return new Response(body, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
