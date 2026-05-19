import { getCachedMatchServers, getCachedIStreamSchedule, findIStreamMatch } from "@/lib/iStreamEast";
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
      // Wave 1: fetch all three sources in parallel — all served from cache on repeat calls
      const [scheduleResult, streamedResult, stvScrapeResult] = await Promise.allSettled([
        getCachedIStreamSchedule(),
        getStreamedFootballMatches(),
        parsed.stvPageSlug ? scrapeSoccerTvHdStream(parsed.stvPageSlug) : Promise.resolve(null),
      ]);

      // Resolve match objects synchronously from wave-1 results
      const iMatch = scheduleResult.status === "fulfilled"
        ? findIStreamMatch(parsed.home, parsed.away, scheduleResult.value)
        : null;
      const suMatch = streamedResult.status === "fulfilled"
        ? findStreamedMatch(parsed.home, parsed.away, streamedResult.value)
        : null;

      // Wave 2: fetch embeds in parallel — match server results are cached per slug
      const [iEmbeds, suEmbeds] = await Promise.allSettled([
        iMatch ? getCachedMatchServers(iMatch.slug) : Promise.resolve([]),
        suMatch ? getStreamedEmbeds(suMatch) : Promise.resolve([]),
      ]);

      // Collect HLS proxy URLs separately — CacheFly blocks CF Workers IPs so they
      // often return 403. Add direct embeds first so the default server always works.
      const hlsProxyUrls: string[] = [];
      if (parsed.stvPageSlug && stvScrapeResult.status === "fulfilled" && stvScrapeResult.value) {
        for (const s of stvScrapeResult.value.streams) {
          if (s.type === "embed") add(s.url);
          else if (s.type === "hls" || s.type === "dash") hlsProxyUrls.push(getProxiedHlsUrl(s.url));
        }
      }
      // Direct embeds from iStreamEast + streamed.su come before HLS proxies
      if (iEmbeds.status === "fulfilled") iEmbeds.value.forEach(add);
      if (suEmbeds.status === "fulfilled") suEmbeds.value.forEach(add);
      // HLS proxy streams as fallback (may fail if CDN blocks CF Workers IPs)
      hlsProxyUrls.forEach(add);
      // Raw page URL as final fallback — browser IP is not blocked
      if (parsed.stvPageSlug) add(`https://www.soccertvhd.com/${parsed.stvPageSlug}/`);
    }
  } else {
    const parsed = parseIStreamSlug(slug);
    const [iStreamResult, streamedResult] = await Promise.allSettled([
      getCachedMatchServers(slug),
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

  return Response.json({ servers }, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
