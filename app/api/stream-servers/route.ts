import { getCachedGacondoStream } from "@/GACONDO";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";
import { getCachedStvStream } from "@/lib/soccerTvHd";
import { filterWorkingStreams } from "@/lib/streamVerify";
import { FREE_MODE } from "@/lib/config";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

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
  const teamsPart = sepIdx !== -1 ? inner.slice(0, sepIdx) : inner;
  const gacondoSlugs = teamsPart.includes("-vs-") ? buildGacondoSlugs(teamsPart) : [];

  const seen = new Set<string>();
  const servers: string[] = [];
  const add = (url: string) => addUniq(seen, servers, url);

  // ── Run both sources in parallel ──────────────────────────────────────────
  const [stvResult, gacondoResult] = await Promise.allSettled([
    // Source 1: SoccerTVHD improved extraction (API + HTML fallback)
    getCachedStvStream(slug),

    // Source 2: GACONDO → embed player URLs from 10 alternative sites.
    gacondoSlugs.length > 0
      ? Promise.race([
          getCachedGacondoStream(gacondoSlugs),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 10_000)),
        ])
      : Promise.resolve(null),
  ]);

  // ── Merge — SoccerTVHD results first (most reliable) ──
  if (stvResult.status === "fulfilled" && stvResult.value) {
    const { streams, sourceUrl, requestHeaders } = stvResult.value;
    for (const s of streams) {
      if (s.type === "hls") add(getProxiedHlsUrl(s.url, request.url, sourceUrl));
      else if (s.type === "embed") add(s.url);
    }
  }

  // ── Then GACONDO embeds ──
  if (gacondoResult.status === "fulfilled" && gacondoResult.value) {
    for (const s of gacondoResult.value.streams) {
      if (s.type === "embed") add(s.url);
    }
    const ref = gacondoResult.value.requestHeaders.referer;
    for (const s of gacondoResult.value.streams) {
      if (s.type === "hls") add(getProxiedHlsUrl(s.url, request.url, ref));
    }
  }

  const verifiedServers = await filterWorkingStreams(servers);

  let finalServers = verifiedServers;
  if (FREE_MODE) {
    const embeds = verifiedServers.filter(s => !s.includes(".m3u8") && !s.includes(".mpd"));
    const hls = verifiedServers.filter(s => s.includes(".m3u8") || s.includes(".mpd"));
    finalServers = [...embeds, ...hls];
  }

  const cacheHeader = finalServers.length > 0
    ? "public, s-maxage=50, stale-while-revalidate=15"
    : "public, s-maxage=15, stale-while-revalidate=10";

  return Response.json({ servers: finalServers }, { headers: { "Cache-Control": cacheHeader } });
}
