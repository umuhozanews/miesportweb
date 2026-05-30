import { getCachedStvStream, scrapeSoccerTvHdStream } from "@/lib/soccerTvHd";
import { getCachedGacondoStream } from "@/GACONDO";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

// ── Team name abbreviation variants ────────────────────────────────────────────
// When a stv slug encodes the team names (e.g. "manchester-city-vs-arsenal"),
// generate common alternate forms so GACONDO can try them on all 10 source sites.
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
  const base = teamsPart;
  const variants = new Set([base]);
  for (const [from, to] of ABBREVS) {
    const v = base.replace(from, to);
    if (v !== base) variants.add(v);
  }
  return [...variants];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const JUNK_URL_RE = /(?:_Incapsula_Resource|__cf_chl|captcha|googlesyndication|doubleclick|adsbygoogle)/i;

function addUniq(seen: Set<string>, list: string[], url: string) {
  if (url && !seen.has(url) && !JUNK_URL_RE.test(url)) { seen.add(url); list.push(url); }
}

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

  // ── Launch both scrapers in parallel ─────────────────────────────────────────
  // GACONDO scrapes 10 alternative sites by team-name slug.
  // soccertvhd scrapes relay iframe URLs from the match page.
  // Both run concurrently so whichever source responds first doesn't wait for the other.
  const [stvSettled, gacondoSettled] = await Promise.allSettled([
    (async () => {
      if (!pageSlug) throw new Error("no page slug");
      // Fast path: shared edge cache; if empty scrape fresh (match may have just gone live)
      let result = await Promise.race([
        getCachedStvStream(pageSlug),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 12_000)),
      ]);
      if (result.streams.length === 0) {
        result = await Promise.race([
          scrapeSoccerTvHdStream(pageSlug),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 10_000)),
        ]);
      }
      return result;
    })(),
    (async () => {
      if (gacondoSlugs.length === 0) throw new Error("no team slug");
      return getCachedGacondoStream(gacondoSlugs);
    })(),
  ]);

  const seen = new Set<string>();
  const servers: string[] = [];
  const add = (url: string) => addUniq(seen, servers, url);

  // ── Merge results — embed (iframe) URLs first, HLS proxy last ─────────────
  // This mirrors exactly how soccertvhd.com works: relay iframes load in the browser,
  // the browser fetches CDN segments directly with the correct Referer/IP.
  // Server-side HLS proxying is the last resort because shared server IPs get rate-limited.

  // 1. soccertvhd.com relay pages — most trusted, CDN is configured for their Referer
  if (stvSettled.status === "fulfilled") {
    for (const s of stvSettled.value.streams) {
      if (s.type === "embed" && s.url.includes("soccertvhd.com")) add(s.url);
    }
  }

  // 2. GACONDO embed URLs — player iframes from hesgoal, footybite, score808, etc.
  //    Browser loads them directly; their CDN sees user's IP + correct Referer.
  if (gacondoSettled.status === "fulfilled") {
    for (const s of gacondoSettled.value.streams) {
      if (s.type === "embed") add(s.url);
    }
  }

  // 3. External third-party embeds found inside soccertvhd relay pages
  if (stvSettled.status === "fulfilled") {
    for (const s of stvSettled.value.streams) {
      if (s.type === "embed" && !s.url.includes("soccertvhd.com")) add(s.url);
    }
  }

  // 4. soccertvhd HLS — proxied; proxy sends correct CacheFly Referer
  if (stvSettled.status === "fulfilled") {
    for (const s of stvSettled.value.streams) {
      if (s.type === "hls") add(getProxiedHlsUrl(s.url, request.url));
    }
  }

  // 5. GACONDO HLS — proxied with the source site as Referer so the CDN accepts it
  if (gacondoSettled.status === "fulfilled") {
    const gacondoReferer = gacondoSettled.value.requestHeaders.referer;
    for (const s of gacondoSettled.value.streams) {
      if (s.type === "hls") add(getProxiedHlsUrl(s.url, request.url, gacondoReferer));
    }
  }

  // Use a short cache when no streams are found so the client re-checks sooner
  const cacheHeader = servers.length > 0
    ? "public, s-maxage=50, stale-while-revalidate=15"
    : "public, s-maxage=15, stale-while-revalidate=10";

  return Response.json({ servers }, { headers: { "Cache-Control": cacheHeader } });
}
