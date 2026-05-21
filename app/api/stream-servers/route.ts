import { getCachedStvStream } from "@/lib/soccerTvHd";
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
          const result = await getCachedStvStream(pageSlug);
          const seen = new Set<string>();
          const servers: string[] = [];
          const add = (url: string) => {
            if (url && !seen.has(url)) { seen.add(url); servers.push(url); }
          };

          // Embed URLs first — these are clean video players (no wrapper site)
          for (const s of result.streams) {
            if (s.type === "embed") add(s.url);
          }
          // HLS/DASH via proxy fallback
          for (const s of result.streams) {
            if (s.type === "hls" || s.type === "dash") {
              add(getProxiedHlsUrl(s.url, request.url));
            }
          }

          return Response.json(
            { servers },
            { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
          );
        } catch {
          return Response.json({ servers: [] });
        }
      }
    }
  }

  return Response.json({ servers: [] });
}
