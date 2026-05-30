import { getCachedGacondoStream } from "@/GACONDO";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;
const STV_ORIGIN = "https://www.soccertvhd.com";

// ── Team-name abbreviation variants for GACONDO ────────────────────────────────
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

  // ── Step 1: IMMEDIATE — the relay page URL is derived directly from the slug.
  //
  // This is exactly how soccertvhd.com works: the Elfsight calendar links each
  // match to a relay page (e.g. /sportsurge-sport-surge-live/).  That relay page
  // IS the stream — a static WordPress page that embeds a JW Player loading
  // the CacheFly CDN stream.  We serve it as an iframe; the user's browser
  // fetches the CDN directly with soccertvhd.com as Referer.  No scraping,
  // no proxying, no blocking — the same zero-proxy model soccertvhd uses.
  if (pageSlug) {
    add(`${STV_ORIGIN}/${pageSlug}/`);
  }

  // ── Step 2: GACONDO — scrapes 10 streaming aggregator sites by team name.
  //
  // Runs in parallel so it doesn't delay step 1.  Returns embed iframe URLs
  // (player pages from hesgoal, footybite, score808, etc.) that the browser
  // loads directly — same no-proxy model as step 1.
  const gacondoResult = await (async () => {
    if (gacondoSlugs.length === 0) return null;
    try {
      return await Promise.race([
        getCachedGacondoStream(gacondoSlugs),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8_000)),
      ]);
    } catch {
      return null;
    }
  })();

  if (gacondoResult) {
    // Embed iframes first — browser fetches CDN directly
    for (const s of gacondoResult.streams) {
      if (s.type === "embed") add(s.url);
    }
    // HLS URLs as last resort — proxied with the source site as Referer
    const ref = gacondoResult.requestHeaders.referer;
    for (const s of gacondoResult.streams) {
      if (s.type === "hls") add(getProxiedHlsUrl(s.url, request.url, ref));
    }
  }

  // Short cache when empty so the client retries sooner
  const cacheHeader = servers.length > 0
    ? "public, s-maxage=50, stale-while-revalidate=15"
    : "public, s-maxage=15, stale-while-revalidate=10";

  return Response.json({ servers }, { headers: { "Cache-Control": cacheHeader } });
}
