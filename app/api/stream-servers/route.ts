import { scrapeMatchServers, scrapeIStreamSchedule, findIStreamMatch } from "@/lib/iStreamEast";
import { getStreamedFootballMatches, findStreamedMatch, getStreamedEmbeds } from "@/lib/streamedSu";
import { scrapeSoccerTvHdStream } from "@/lib/soccerTvHd";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";

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

function parseStvSlug(slug: string): { home: string; away: string; stvPageSlug: string | null } | null {
  if (!slug.startsWith("stv-")) return null;
  const inner = slug.slice(4);
  const sepIdx = inner.indexOf("--");
  const teamsPart = sepIdx !== -1 ? inner.slice(0, sepIdx) : inner;
  const stvPageSlug = sepIdx !== -1 ? inner.slice(sepIdx + 2) || null : null;
  const vsIdx = teamsPart.indexOf("-vs-");
  if (vsIdx === -1) return null;
  return {
    home: teamsPart.slice(0, vsIdx).replace(/-/g, " "),
    away: teamsPart.slice(vsIdx + 4).replace(/-/g, " "),
    stvPageSlug,
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
    const parsed = parseStvSlug(slug);
    if (parsed) {
      const [scheduleResult, streamedResult] = await Promise.allSettled([
        scrapeIStreamSchedule(),
        getStreamedFootballMatches(),
      ]);

      if (scheduleResult.status === "fulfilled") {
        const iMatch = findIStreamMatch(parsed.home, parsed.away, scheduleResult.value);
        if (iMatch) {
          const embeds = await scrapeMatchServers(iMatch.slug);
          embeds.forEach(add);
        }
      }

      if (streamedResult.status === "fulfilled") {
        const match = findStreamedMatch(parsed.home, parsed.away, streamedResult.value);
        if (match) {
          const embeds = await getStreamedEmbeds(match);
          embeds.forEach(add);
        }
      }

      // Fallback: scrape soccertvhd.com directly (works on CF Workers + local dev)
      if (parsed.stvPageSlug) {
        try {
          const stvStream = await scrapeSoccerTvHdStream(parsed.stvPageSlug);
          for (const s of stvStream.streams) {
            if (s.type === "embed") add(s.url);
            else if (s.type === "hls" || s.type === "dash") add(getProxiedHlsUrl(s.url));
          }
        } catch { /* IP-blocked on Vercel — fall through to raw page URL */ }
        add(`https://www.soccertvhd.com/${parsed.stvPageSlug}/`);
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
