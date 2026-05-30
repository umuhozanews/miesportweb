import { unstable_cache as cache } from "next/cache";
import { getCachedGacondoStream } from "@/GACONDO";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;
const STV_ORIGIN = "https://www.soccertvhd.com";
const STV_WP_API = `${STV_ORIGIN}/wp-json/wp/v2/posts`;

const ABBREVS: [RegExp, string][] = [
  [/\bmanchester-united\b/g, "man-utd"],
  [/\bmanchester-city\b/g, "man-city"],
  [/\bparis-saint-germain\b/g, "psg"],
  [/\bpsg\b/g, "paris-saint-germain"],
  [/\batletico-madrid\b/g, "atletico"],
  [/\binternazionale\b/g, "inter"],
  [/\btottenham-hotspur\b/g, "tottenham"],
  [/\bnewcastle-united\b/g, "newcastle"],
  [/\bwest-ham-united\b/g, "west-ham"],
  [/\bwolverhampton\b/g, "wolves"],
  [/\bborussia-dortmund\b/g, "dortmund"],
  [/\brb-leipzig\b/g, "leipzig"],
  [/\bbayer-leverkusen\b/g, "leverkusen"],
  [/\bolympique-marseille\b/g, "marseille"],
  [/\bolympique-lyonnais\b/g, "lyon"],
  [/\breal-sociedad-b\b/g, "real-sociedad"],
];

function buildGacondoSlugs(teamsPart: string): string[] {
  const variants = new Set([teamsPart]);
  for (const [from, to] of ABBREVS) {
    const v = teamsPart.replace(from, to);
    if (v !== teamsPart) variants.add(v);
  }
  return [...variants];
}

const JUNK_URL_RE = /(?:_Incapsula_Resource|__cf_chl|captcha|googlesyndication|doubleclick|adsbygoogle)/i;

function addUniq(seen: Set<string>, list: string[], url: string) {
  if (url && !seen.has(url) && !JUNK_URL_RE.test(url)) {
    seen.add(url);
    list.push(url);
  }
}

// ── WordPress REST API stream fetcher ─────────────────────────────────────────
// soccertvhd.com stores the actual CacheFly CDN stream URL directly inside
// each relay post's content (as a Video.js <source src="...m3u8"> tag).
// The WP REST API returns this as JSON — no HTML scraping, no bot protection,
// works cleanly from CF Workers datacenter IPs.
//
// Cached for 1 hour: the stream URL for a given relay page (e.g.
// /sportsurge-sport-surge-live/) is fixed; they update it before the season,
// not match-by-match.
const getCachedStvRelayStream = cache(
  async (pageSlug: string): Promise<{ m3u8: string; referer: string } | null> => {
    try {
      const url = `${STV_WP_API}?slug=${encodeURIComponent(pageSlug)}&_fields=content`;
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(6_000),
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "accept": "application/json",
          "accept-language": "en-US,en;q=0.9",
        },
      });
      if (!resp.ok) return null;

      const posts = await resp.json() as Array<{ content?: { rendered?: string } }>;
      const content = posts[0]?.content?.rendered ?? "";
      if (!content) return null;

      // Extract the m3u8 URL from <source src="https://...cachefly.net/...index.m3u8">
      const m3u8Match = content.match(/<source[^>]+src=["']([^"']+\.m3u8[^"']*)["']/i)
        ?? content.match(/src=["']([^"']+\.m3u8[^"']*)["']/i);
      if (!m3u8Match) return null;

      return {
        m3u8: m3u8Match[1],
        referer: `${STV_ORIGIN}/${pageSlug}/`,
      };
    } catch {
      return null;
    }
  },
  ["stv-relay-v1"],
  { revalidate: 3600 }, // 1 hour — stream URLs change infrequently
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";
  if (!SLUG_RE.test(slug)) return Response.json({ servers: [] }, { status: 400 });
  if (!slug.startsWith("stv-")) return Response.json({ servers: [] });

  const inner = slug.slice(4);
  const sepIdx = inner.indexOf("--");
  const pageSlug = sepIdx !== -1 ? inner.slice(sepIdx + 2) : "";
  const teamsPart = sepIdx !== -1 ? inner.slice(0, sepIdx) : inner;
  const gacondoSlugs = teamsPart.includes("-vs-") ? buildGacondoSlugs(teamsPart) : [];

  const seen = new Set<string>();
  const servers: string[] = [];
  const add = (url: string) => addUniq(seen, servers, url);

  // ── Run both sources in parallel ──────────────────────────────────────────
  const [stvResult, gacondoResult] = await Promise.allSettled([
    // Source 1: soccertvhd.com WordPress REST API → CacheFly CDN stream URL.
    // Clean JSON call, no bot protection, works from CF Workers.
    pageSlug ? getCachedStvRelayStream(pageSlug) : Promise.resolve(null),

    // Source 2: GACONDO → embed player URLs from 10 alternative sites.
    // Works when the sites aren't blocking CF Workers IPs.
    gacondoSlugs.length > 0
      ? Promise.race([
          getCachedGacondoStream(gacondoSlugs),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 10_000)),
        ])
      : Promise.resolve(null),
  ]);

  // ── Merge — HLS via REST API first (most reliable), then GACONDO embeds ──
  if (stvResult.status === "fulfilled" && stvResult.value) {
    const { m3u8, referer } = stvResult.value;
    add(getProxiedHlsUrl(m3u8, request.url, referer));
  }

  if (gacondoResult.status === "fulfilled" && gacondoResult.value) {
    for (const s of gacondoResult.value.streams) {
      if (s.type === "embed") add(s.url);
    }
    const ref = gacondoResult.value.requestHeaders.referer;
    for (const s of gacondoResult.value.streams) {
      if (s.type === "hls") add(getProxiedHlsUrl(s.url, request.url, ref));
    }
  }

  const cacheHeader = servers.length > 0
    ? "public, s-maxage=50, stale-while-revalidate=15"
    : "public, s-maxage=15, stale-while-revalidate=10";

  return Response.json({ servers }, { headers: { "Cache-Control": cacheHeader } });
}
