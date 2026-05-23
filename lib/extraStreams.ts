import { unstable_cache as cache } from "next/cache";
import type { StreamResource } from "./soccerTvHd";

// ─── Regex patterns ────────────────────────────────────────────────────────────

const MEDIA_RE =
  /https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mpd|mp4)(?:\?[^\s"'<>\\]*)?/gi;
const IFRAME_RE =
  /<(?:iframe|video|source)\b[^>]*(?:src|data-src)=["']([^"'<>]+)["']/gi;
const JS_STREAM_RE =
  /["']([^"'\s]{8,}(?:\.m3u8|\.mpd)(?:\?[^"']*)?)['"]/gi;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

type CFInit = RequestInit & { cf?: { cacheTtl?: number; cacheEverything?: boolean } };

function getStreamType(url: string): StreamResource["type"] {
  if (/\.m3u8(?:\?|$)/i.test(url)) return "hls";
  if (/\.mpd(?:\?|$)/i.test(url)) return "dash";
  if (/\.mp4(?:\?|$)/i.test(url)) return "mp4";
  if (/^https?:\/\//i.test(url)) return "embed";
  return "unknown";
}

function extractFromHtml(html: string, pageUrl: string): StreamResource[] {
  const chunk = html.length > 49152 ? html.slice(0, 49152) : html;
  const urls = new Set<string>();

  for (const m of chunk.matchAll(MEDIA_RE)) urls.add(m[0]);

  for (const m of chunk.matchAll(IFRAME_RE)) {
    try { urls.add(new URL(m[1], pageUrl).toString()); } catch { /* skip bad URLs */ }
  }

  for (const m of chunk.matchAll(JS_STREAM_RE)) {
    if (/^https?:\/\//i.test(m[1])) urls.add(m[1]);
  }

  return [...urls]
    .filter(u => /^https?:\/\//i.test(u))
    .map(url => ({ type: getStreamType(url), url, source: "html" as const, contentType: null }));
}

async function tryGet(url: string): Promise<string | null> {
  try {
    const init: CFInit = {
      signal: AbortSignal.timeout(5000),
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,*/*",
        "accept-language": "en-US,en;q=0.9",
        referer: new URL(url).origin + "/",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "upgrade-insecure-requests": "1",
      },
      cf: { cacheTtl: 120, cacheEverything: true },
    };
    const r = await fetch(url, init as RequestInit);
    if (!r.ok) return null;
    return r.text();
  } catch {
    return null;
  }
}

// ─── Slug normalisation ────────────────────────────────────────────────────────

const COMPETITION_RE =
  /-(?:serie-[ab]|premier-league|championship|league-one|league-two|la-liga|laliga|segunda|bundesliga|2-bundesliga|ligue-1|ligue-2|eredivisie|primeira-liga|liga-portugal|super-lig|mls|j1-league|k-league|a-league|chinese-super|saudi-pro|uae-pro|indian-super|scottish-premiership|allsvenskan|eliteserien|ekstraklasa|jupiler|prva-liga|champions-league|europa-league|conference-league|ucl|uel|uecl|world-cup|euro(?:-\d{4})?|copa-america|africa-cup|gold-cup|copa-del-rey|fa-cup|carabao-cup|league-cup|efl-cup|dfb-pokal|coupe-de-france|coppa-italia|supercoppa|supercopa|trophee-des-champions|community-shield|club-world-cup|friendly|international-friendly)(?:-\d{4})?$/i;

/** Strip competition suffix and trailing year */
function bare(slug: string): string {
  return slug.replace(COMPETITION_RE, "").replace(/-\d{4}$/, "");
}

/** Common team-name abbreviations to try */
function teamVariants(slug: string): string[] {
  const s = bare(slug);
  const variants = [s];
  const sub = (from: RegExp, to: string) => {
    const v = s.replace(from, to);
    if (v !== s) variants.push(v);
  };
  sub(/manchester-united/g, "man-utd");
  sub(/manchester-city/g, "man-city");
  sub(/internazionale/g, "inter");
  sub(/inter(?!nacional)/g, "internazionale");
  sub(/atletico-madrid/g, "atletico");
  sub(/atletico/g, "atletico-madrid");
  sub(/paris-saint-germain/g, "psg");
  sub(/psg/g, "paris-saint-germain");
  sub(/tottenham-hotspur/g, "tottenham");
  sub(/tottenham(?!-hotspur)/g, "tottenham-hotspur");
  sub(/wolverhampton/g, "wolves");
  sub(/wolves/g, "wolverhampton");
  sub(/afc-bournemouth/g, "bournemouth");
  sub(/west-ham-united/g, "west-ham");
  sub(/newcastle-united/g, "newcastle");
  sub(/nottingham-forest/g, "nottm-forest");
  sub(/sheffield-united/g, "sheffield-utd");
  sub(/leicester-city/g, "leicester");
  sub(/brighton-hove-albion/g, "brighton");
  sub(/luton-town/g, "luton");
  sub(/real-sociedad/g, "sociedad");
  sub(/villarreal-cf/g, "villarreal");
  sub(/deportivo-alaves/g, "alaves");
  sub(/rayo-vallecano/g, "rayo");
  sub(/borussia-dortmund/g, "dortmund");
  sub(/borussia-moenchengladbach/g, "mgladbach");
  sub(/rb-leipzig/g, "leipzig");
  sub(/bayer-leverkusen/g, "leverkusen");
  sub(/eintracht-frankfurt/g, "frankfurt");
  sub(/vfb-stuttgart/g, "stuttgart");
  sub(/sc-freiburg/g, "freiburg");
  sub(/olympique-marseille/g, "marseille");
  sub(/olympique-lyonnais/g, "lyon");
  sub(/as-monaco/g, "monaco");
  sub(/stade-rennais/g, "rennes");
  sub(/rc-lens/g, "lens");
  sub(/stade-brestois/g, "brest");
  sub(/lille-osc/g, "lille");
  sub(/ac-milan/g, "milan");
  sub(/as-roma/g, "roma");
  sub(/ssc-napoli/g, "napoli");
  sub(/juventus/g, "juventus");
  sub(/udinese-calcio/g, "udinese");
  sub(/hellas-verona/g, "verona");
  return [...new Set(variants)];
}

// ─── Source definitions ────────────────────────────────────────────────────────

type Source = { id: string; urls: (slug: string) => string[] };

const SOURCES: Source[] = [
  {
    id: "hesgoal",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return [
        ...variants.flatMap(v => [
          `https://hesgoal.tv/${v}/`,
          `https://www.hesgoal.com/${v}/`,
        ]),
        `https://hesgoal.tv/${slug}/`,
        `https://www.hesgoal.com/${slug}/`,
      ];
    },
  },
  {
    id: "totalsportek",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return [
        ...variants.flatMap(v => [
          `https://www.totalsportek.com/soccer/${v}-live-stream/`,
          `https://www.totalsportek.com/${v}-live-stream/`,
        ]),
        `https://www.totalsportek.com/soccer/${slug}-live-stream/`,
      ];
    },
  },
  {
    id: "socceronline",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return [
        ...variants.map(v => `https://socceronline.me/${v}/`),
        `https://socceronline.me/${slug}/`,
      ];
    },
  },
  {
    id: "sportsonline",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return [
        ...variants.flatMap(v => [
          `https://sportsonline.sx/${v}/`,
          `https://www.sportsonline.me/${v}/`,
        ]),
        `https://sportsonline.sx/${slug}/`,
      ];
    },
  },
  {
    id: "score808",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return [
        ...variants.flatMap(v => [
          `https://score808.me/${v}/`,
          `https://score808.eu/${v}/`,
        ]),
        `https://score808.me/${slug}/`,
      ];
    },
  },
  {
    id: "footybite",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return [
        ...variants.map(v => `https://footybite.co/${v}/`),
        `https://footybite.co/${slug}/`,
        `https://www.footybite.co/${bare(slug)}/`,
      ];
    },
  },
  {
    id: "soccerstreams",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return [
        ...variants.flatMap(v => [
          `https://soccerstreams101.co/${v}/`,
          `https://soccerstreams100.net/${v}/`,
        ]),
        `https://soccerstreams101.co/${slug}/`,
      ];
    },
  },
  {
    id: "livetv",
    urls: (slug) => {
      const s = bare(slug);
      return [
        `https://livetv.sx/en/allbroadcasts_date/`,
        `https://livetv.sx/en/allbroadcasts/`,
      ];
    },
  },
  {
    id: "streambtw",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return variants.map(v => `https://streambtw.com/soccer/${v}/`);
    },
  },
  {
    id: "buffstreams",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return variants.map(v => `https://buffstreams.app/soccer/${v}/`);
    },
  },
  {
    id: "crackstreams",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return [
        ...variants.map(v => `https://crackstreams.biz/soccer/${v}/`),
        ...variants.map(v => `https://crackstreams.com/soccer/${v}/`),
      ];
    },
  },
  {
    id: "soccertv",
    urls: (slug) => {
      const variants = teamVariants(slug);
      return variants.map(v => `https://www.soccertv.com/${v}/`);
    },
  },
];

// ─── Per-source fetch ──────────────────────────────────────────────────────────

async function fetchSource(urls: string[]): Promise<StreamResource[]> {
  // Try each URL candidate until one returns usable streams
  for (const url of urls) {
    const html = await tryGet(url);
    if (!html) continue;
    const streams = extractFromHtml(html, url);
    const useful = streams.filter(
      s => s.type === "hls" || s.type === "dash" || s.type === "embed",
    );
    if (useful.length > 0) return useful;
  }
  return [];
}

// ─── Aggregator ───────────────────────────────────────────────────────────────

async function fetchAll(slug: string): Promise<StreamResource[]> {
  const settled = await Promise.allSettled(
    SOURCES.map(s => fetchSource(s.urls(slug))),
  );

  const seen = new Set<string>();
  const result: StreamResource[] = [];

  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const s of r.value) {
      if (!seen.has(s.url)) {
        seen.add(s.url);
        result.push(s);
      }
    }
  }

  return result;
}

export const getCachedExtraStreams = cache(
  (slug: string) => fetchAll(slug),
  ["extra-streams-v2"],
  { revalidate: 300 },
);
