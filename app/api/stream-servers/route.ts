import { getCachedStvStream, scrapeSoccerTvHdStream } from "@/lib/soccerTvHd";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";
  if (!SLUG_RE.test(slug)) return Response.json({ servers: [] }, { status: 400 });

  if (slug.startsWith("stv-")) {
    const inner = slug.slice(4);
    const sepIdx = inner.indexOf("--");
    if (sepIdx !== -1) {
      const pageSlug = inner.slice(sepIdx + 2);
      if (pageSlug) {
        try {
          // Fast path: use the shared edge cache (populated by previous requests)
          let result = await Promise.race([
            getCachedStvStream(pageSlug),
            new Promise<never>((_, rej) =>
              setTimeout(() => rej(new Error("timeout")), 12_000),
            ),
          ]);

          // If cache is empty the match may have just gone live — bypass cache and scrape fresh
          if (result.streams.length === 0) {
            try {
              result = await Promise.race([
                scrapeSoccerTvHdStream(pageSlug),
                new Promise<never>((_, rej) =>
                  setTimeout(() => rej(new Error("timeout")), 10_000),
                ),
              ]);
            } catch { /* keep empty result if fresh scrape also fails */ }
          }

          const seen = new Set<string>();
          const servers: string[] = [];
          const add = (url: string) => {
            if (url && !seen.has(url)) { seen.add(url); servers.push(url); }
          };

          // HLS/DASH through proxy first — controlled headers, best quality
          for (const s of result.streams) {
            if (s.type === "hls" || s.type === "dash") {
              add(getProxiedHlsUrl(s.url, request.url));
            }
          }
          // Embed iframes as fallback options
          for (const s of result.streams) {
            if (s.type === "embed") add(s.url);
          }

          // Use a short cache when no streams are found so the client re-checks sooner
          const cacheHeader = servers.length > 0
            ? "public, s-maxage=120, stale-while-revalidate=60"
            : "public, s-maxage=20, stale-while-revalidate=10";

          return Response.json({ servers }, { headers: { "Cache-Control": cacheHeader } });
        } catch {
          return Response.json({ servers: [] });
        }
      }
    }
  }

  return Response.json({ servers: [] });
}
