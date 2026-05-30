import { getCachedGacondoStream } from "@/GACONDO";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";

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

  if (gacondoSlugs.length === 0) return Response.json({ servers: [] });

  const seen = new Set<string>();
  const servers: string[] = [];
  const add = (url: string) => addUniq(seen, servers, url);

  try {
    const result = await Promise.race([
      getCachedGacondoStream(gacondoSlugs),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 12_000)),
    ]);

    // Embed URLs first — pure player pages (no website wrapper).
    // Browser fetches the CDN directly with the source site as Referer.
    for (const s of result.streams) {
      if (s.type === "embed") add(s.url);
    }

    // HLS URLs as fallback — proxied with the correct source Referer
    const ref = result.requestHeaders.referer;
    for (const s of result.streams) {
      if (s.type === "hls") add(getProxiedHlsUrl(s.url, request.url, ref));
    }
  } catch { /* timeout or no streams found */ }

  const cacheHeader = servers.length > 0
    ? "public, s-maxage=50, stale-while-revalidate=15"
    : "public, s-maxage=15, stale-while-revalidate=10";

  return Response.json({ servers }, { headers: { "Cache-Control": cacheHeader } });
}
