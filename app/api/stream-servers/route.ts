import { scrapeMatchServers } from "@/lib/iStreamEast";
import { getStreamedFootballMatches, findStreamedMatch, getStreamedEmbeds } from "@/lib/streamedSu";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

function parseIStreamSlug(slug: string): { home: string; away: string } | null {
  const vsIdx = slug.indexOf("-vs-");
  if (vsIdx === -1) return null;
  const afterVs = slug.slice(vsIdx + 4);
  const idMatch = afterVs.match(/-(\d+)$/);
  if (!idMatch) return null;
  return {
    home: slug.slice(0, vsIdx).replace(/-/g, " "),
    away: afterVs.slice(0, afterVs.length - idMatch[1].length - 1).replace(/-/g, " "),
  };
}

function parseStvSlug(slug: string): { home: string; away: string } | null {
  if (!slug.startsWith("stv-")) return null;
  const inner = slug.slice(4);
  const vsIdx = inner.indexOf("-vs-");
  if (vsIdx === -1) return null;
  return {
    home: inner.slice(0, vsIdx).replace(/-/g, " "),
    away: inner.slice(vsIdx + 4).replace(/-/g, " "),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";

  if (!SLUG_RE.test(slug)) {
    return Response.json({ servers: [] }, { status: 400 });
  }

  const seen = new Set<string>();
  const servers: string[] = [];
  const add = (url: string) => {
    if (url && !seen.has(url)) { seen.add(url); servers.push(url); }
  };

  if (slug.startsWith("stv-")) {
    // stv- slugs: soccertvhd is IP-blocked on Vercel, fall back to streamed.su only
    const parsed = parseStvSlug(slug);
    if (parsed) {
      const matches = await getStreamedFootballMatches().catch(() => null);
      if (matches) {
        const match = findStreamedMatch(parsed.home, parsed.away, matches);
        if (match) {
          const embeds = await getStreamedEmbeds(match);
          embeds.forEach(add);
        }
      }
    }
  } else {
    const parsed = parseIStreamSlug(slug);
    const [iStreamResult, streamedResult] = await Promise.allSettled([
      scrapeMatchServers(slug),
      getStreamedFootballMatches(),
    ]);

    if (iStreamResult.status === "fulfilled") {
      iStreamResult.value.forEach(add);
    }

    if (streamedResult.status === "fulfilled" && parsed) {
      const match = findStreamedMatch(parsed.home, parsed.away, streamedResult.value);
      if (match) {
        const embeds = await getStreamedEmbeds(match);
        embeds.forEach(add);
      }
    }
  }

  return Response.json({ servers });
}
