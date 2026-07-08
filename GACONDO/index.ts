import { unstable_cache as cache } from "next/cache";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type GacondoMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  name: string;
  competition: string;
  dateTime: string | null;
  time: string | null;
  isLive: boolean;
  status: string;
  slugs: string[];
  primarySlug: string;
  thumb: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
};

export type GacondoStream = {
  type: "hls" | "dash" | "mp4" | "embed" | "unknown";
  url: string;
  sourceId: string;
  pageUrl: string | null; // the page this stream was found on — used as CDN Referer
  contentType: string | null;
};

export type GacondoMatchesResult = {
  scrapedAt: string;
  total: number;
  matches: GacondoMatch[];
};

export type GacondoStreamResult = {
  primarySlug: string;
  scrapedAt: string;
  streams: GacondoStream[];
  primary: GacondoStream | null;
  requestHeaders: { referer: string; userAgent: string };
};

// ─── UA pool ───────────────────────────────────────────────────────────────────

const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
];

function pickUA(): string {
  return UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
}

function getClientHints(ua: string): Record<string, string> {
  const m = ua.match(/Chrome\/(\d+)/);
  if (!m) return {};
  const v = m[1];
  const platform = ua.includes("Macintosh") ? '"macOS"'
    : ua.includes("Linux") ? '"Linux"'
    : '"Windows"';
  const mobile = ua.includes("Mobile") ? "?1" : "?0";
  return {
    "sec-ch-ua": `"Google Chrome";v="${v}", "Chromium";v="${v}", "Not.A/Brand";v="24"`,
    "sec-ch-ua-mobile": mobile,
    "sec-ch-ua-platform": platform,
  };
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────────

type CFInit = RequestInit & { cf?: { cacheTtl?: number; cacheEverything?: boolean } };

async function fetchHtml(url: string, timeoutMs = 8_000, referer?: string): Promise<string | null> {
  let fetchSite = "none";
  if (referer) {
    try {
      fetchSite = new URL(referer).origin === new URL(url).origin ? "same-origin" : "cross-site";
    } catch { /* leave as none */ }
  }

  const buildHeaders = (u: string): Record<string, string> => ({
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "accept-encoding": "gzip, deflate, br",
    "user-agent": u,
    ...getClientHints(u),
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": fetchSite,
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "cache-control": "max-age=0",
    ...(referer ? { referer, origin: new URL(referer).origin } : {}),
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    const ua = UA_POOL[(Math.floor(Math.random() * UA_POOL.length) + attempt) % UA_POOL.length];
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
        headers: buildHeaders(ua),
        cf: { cacheTtl: 120, cacheEverything: true },
      } as CFInit as RequestInit);
      if (r.ok) return r.text();
      if (r.status === 403 || r.status === 429 || r.status === 503) continue;
      return null;
    } catch {
      if (attempt === 1) return null;
    }
  }
  return null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const init: CFInit = {
    signal: AbortSignal.timeout(10_000),
    headers: { "user-agent": pickUA(), accept: "application/json" },
    cf: { cacheTtl: 300, cacheEverything: true },
  };
  const r = await fetch(url, init as RequestInit);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json() as Promise<T>;
}

// ─── Slug generation ───────────────────────────────────────────────────────────

function toSlugPart(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s*&\s*/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function teamSlugVariants(name: string): string[] {
  const base = toSlugPart(name);
  const variants = [base];
  const sub = (from: RegExp, to: string) => {
    const v = base.replace(from, to);
    if (v !== base) variants.push(v);
  };
  sub(/manchester-united/, "man-utd");
  sub(/manchester-city/, "man-city");
  sub(/paris-saint-germain/, "psg");
  sub(/psg/, "paris-saint-germain");
  sub(/atletico-madrid/, "atletico");
  sub(/internazionale/, "inter");
  sub(/tottenham-hotspur/, "tottenham");
  sub(/newcastle-united/, "newcastle");
  sub(/west-ham-united/, "west-ham");
  sub(/wolverhampton/, "wolves");
  sub(/borussia-dortmund/, "dortmund");
  sub(/rb-leipzig/, "leipzig");
  sub(/bayer-leverkusen/, "leverkusen");
  sub(/olympique-marseille/, "marseille");
  sub(/olympique-lyonnais/, "lyon");
  return [...new Set(variants)];
}

function matchSlugVariants(homeTeam: string, awayTeam: string): string[] {
  const homes = teamSlugVariants(homeTeam);
  const aways = teamSlugVariants(awayTeam);
  const slugs: string[] = [];
  for (const h of homes) for (const a of aways) slugs.push(`${h}-vs-${a}`);
  return slugs;
}

// ─── TheSportsDB types ─────────────────────────────────────────────────────────

type TSDBEvent = {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strLeague: string;
  strTimestamp: string;
  strTime: string;
  strStatus: string;
  strThumb: string | null;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
};

// ─── Match listing ─────────────────────────────────────────────────────────────

const TSDB = "https://www.thesportsdb.com/api/v1/json/3";
const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "LIVE", "PEN"]);

async function scrapeMatches(): Promise<GacondoMatchesResult> {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const results = await Promise.allSettled([
    fetchJson<{ events: TSDBEvent[] | null }>(`${TSDB}/eventsday.php?d=${today}&s=Soccer`),
    fetchJson<{ events: TSDBEvent[] | null }>(`${TSDB}/eventsday.php?d=${tomorrow}&s=Soccer`),
  ]);

  const events: TSDBEvent[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value.events ?? [] : [],
  );

  const matches: GacondoMatch[] = events
    .filter((e) => e.strStatus !== "FT" && e.strStatus !== "Fin")
    .map((e) => {
      const slugs = matchSlugVariants(e.strHomeTeam, e.strAwayTeam);
      return {
        id: e.idEvent,
        homeTeam: e.strHomeTeam,
        awayTeam: e.strAwayTeam,
        name: `${e.strHomeTeam} vs ${e.strAwayTeam}`,
        competition: e.strLeague,
        dateTime: e.strTimestamp ?? null,
        time: e.strTime?.slice(0, 5) ?? null,
        isLive: LIVE_STATUSES.has(e.strStatus ?? ""),
        status: e.strStatus ?? "NS",
        slugs,
        primarySlug: slugs[0],
        thumb: e.strThumb ?? null,
        homeBadge: e.strHomeTeamBadge ?? null,
        awayBadge: e.strAwayTeamBadge ?? null,
      };
    })
    .sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return (a.dateTime ?? "").localeCompare(b.dateTime ?? "");
    });

  return { scrapedAt: new Date().toISOString(), total: matches.length, matches };
}

// ─── Stream extraction ─────────────────────────────────────────────────────────

const MEDIA_RE =
  /https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mpd|mp4)(?:\?[^\s"'<>\\]*)?/gi;
const EMBED_RE =
  /<(?:iframe|video|source|embed)\b[^>]*(?:src|data-src)=["']([^"'<>]{10,})["']/gi;
const DATA_ATTR_RE =
  /\bdata-(?:src|url|file|stream|hls|video|media|playlist|source)=["']([^"']{10,})["']/gi;
const JS_STREAM_RE =
  /(?:file|source|src|url|stream|hls|hlsSrc|m3u8|streamUrl|playlist|liveUrl|hlsUrl|videoUrl)\s*[=:]\s*["'`]([^"'`]{10,}(?:\.m3u8|\.mpd)(?:\?[^"'`]*)?)['"` ]/gi;
const BASE64_RE =
  /(?:atob|window\.atob)\s*\(\s*["']([A-Za-z0-9+/=]{20,})["']\s*\)/gi;
const SCRIPT_SRC_RE =
  /<script[^>]+\bsrc=["']([^"']+)["'][^>]*>/gi;

function streamType(url: string): GacondoStream["type"] {
  if (/\.m3u8(?:\?|$)/i.test(url)) return "hls";
  if (/\.mpd(?:\?|$)/i.test(url)) return "dash";
  if (/\.mp4(?:\?|$)/i.test(url)) return "mp4";
  if (/^https?:\/\//i.test(url)) return "embed";
  return "unknown";
}

// Patterns that identify bot-challenge / anti-scraping pages — not real player content
const BOT_CHALLENGE_RE = /(?:_Incapsula_Resource|__cf_chl|captcha|cf-chl-bypass|DDoS-GUARD|ray\s*id|access denied|security check|checking your browser)/i;

function isBotChallengePage(html: string): boolean {
  if (html.length < 800) return true; // real player pages are always larger
  return BOT_CHALLENGE_RE.test(html);
}

function isJunkEmbedUrl(url: string): boolean {
  return /(?:_Incapsula_Resource|__cf_chl|captcha|\.js\?|googlesyndication|doubleclick|adsbygoogle|\.(?:webp|png|jpe?g|gif|svg|css)(?:\?|$))/i.test(url);
}

function extractStreams(html: string, pageUrl: string, sourceId: string): GacondoStream[] {
  const urls = new Set<string>();

  for (const m of html.matchAll(MEDIA_RE)) urls.add(m[0]);
  for (const m of html.matchAll(EMBED_RE)) {
    try { urls.add(new URL(m[1], pageUrl).toString()); } catch { /* skip */ }
  }
  for (const m of html.matchAll(DATA_ATTR_RE)) {
    try { urls.add(new URL(m[1], pageUrl).toString()); } catch { /* skip */ }
  }
  for (const m of html.matchAll(JS_STREAM_RE)) {
    const u = m[1].trim().replace(/[`'"]$/, "");
    if (/^https?:\/\//i.test(u)) urls.add(u);
  }
  for (const m of html.matchAll(BASE64_RE)) {
    try {
      const dec = atob(m[1]);
      for (const dm of dec.matchAll(new RegExp(MEDIA_RE.source, "gi"))) urls.add(dm[0]);
    } catch { /* skip */ }
  }

  return [...urls].map((url) => ({ type: streamType(url), url, sourceId, pageUrl, contentType: null }));
}

// ─── Stream sources ────────────────────────────────────────────────────────────

type StreamSource = { id: string; urls: (slug: string) => string[] };

const STREAM_SOURCES: StreamSource[] = [
  { id: "hesgoal",      urls: (s) => [`https://hesgoal.tv/${s}/`, `https://www.hesgoal.com/${s}/`] },
  { id: "totalsportek", urls: (s) => [`https://www.totalsportek.com/soccer/${s}-live-stream/`] },
  { id: "socceronline", urls: (s) => [`https://socceronline.me/${s}/`] },
  { id: "sportsonline", urls: (s) => [`https://sportsonline.vc/${s}/`, `https://sportsonline.sx/${s}/`] },
  { id: "score808",     urls: (s) => [`https://score808.me/${s}/`, `https://score808.eu/${s}/`] },
  { id: "footybite",    urls: (s) => [`https://footybite.co/${s}/`] },
  { id: "soccerstreams",urls: (s) => [`https://soccerstreams101.co/${s}/`, `https://soccerstreams100.net/${s}/`] },
  { id: "streambtw",    urls: (s) => [`https://streambtw.com/soccer/${s}/`] },
  { id: "buffstreams",  urls: (s) => [`https://buffstreams.app/soccer/${s}/`] },
  { id: "crackstreams", urls: (s) => [`https://crackstreams.biz/soccer/${s}/`, `https://crackstreams.com/soccer/${s}/`] },
];

const IFRAME_SRC_RE = /<iframe[^>]+\bsrc=["']([^"'<>]{10,})["'][^>]*>/gi;

async function fetchSourceStreams(source: StreamSource, slugs: string[]): Promise<GacondoStream[]> {
  for (const slug of slugs) {
    for (const url of source.urls(slug)) {
      const html = await fetchHtml(url, 6_000);
      if (!html || isBotChallengePage(html)) continue;

      const direct = extractStreams(html, url, source.id)
        .filter((s) => (s.type === "hls" || s.type === "dash" || s.type === "embed") && !isJunkEmbedUrl(s.url));

      const deepStreams: GacondoStream[] = [];

      // Drill into player <script> files — many WP players put the m3u8 URL there
      for (const m of html.matchAll(SCRIPT_SRC_RE)) {
        if (!/(?:player|stream|config|jwplayer|video|hls|live)/i.test(m[1])) continue;
        try {
          const scriptUrl = new URL(m[1], url).toString();
          const scriptHtml = await fetchHtml(scriptUrl, 3_000, url);
          if (scriptHtml) {
            deepStreams.push(
              ...extractStreams(scriptHtml, scriptUrl, source.id).filter(
                (s) => s.type === "hls" || s.type === "dash",
              ),
            );
          }
        } catch { /* skip */ }
      }

      // Drill into embedded player iframes — most streaming sites wrap streams in iframes
      // that contain the actual HLS player JS. Fetch up to 3 to avoid hammering.
      const iframeSrcs: string[] = [];
      const pageOrigin = new URL(url).origin;
      for (const m of html.matchAll(IFRAME_SRC_RE)) {
        try {
          const iframeUrl = new URL(m[1], url).toString();
          // Skip same-origin (page navigation) and obvious ad/tracking iframes
          if (new URL(iframeUrl).origin === pageOrigin) continue;
          if (/(?:google|facebook|twitter|doubleclick|googlesyndication|adsbygoogle)/i.test(iframeUrl)) continue;
          iframeSrcs.push(iframeUrl);
          if (iframeSrcs.length >= 3) break;
        } catch { /* skip */ }
      }

      const iframeResults = await Promise.allSettled(
        iframeSrcs.map(async (iframeUrl) => {
          const iframeHtml = await fetchHtml(iframeUrl, 5_000, url);
          if (!iframeHtml || isBotChallengePage(iframeHtml)) return [];
          const found = extractStreams(iframeHtml, iframeUrl, source.id)
            .filter((s) => (s.type === "hls" || s.type === "dash") && !isJunkEmbedUrl(s.url));
          // Also check player scripts inside the iframe
          const innerScripts: GacondoStream[] = [];
          for (const sm of iframeHtml.matchAll(SCRIPT_SRC_RE)) {
            if (!/(?:player|stream|config|jwplayer|video|hls|live)/i.test(sm[1])) continue;
            try {
              const sUrl = new URL(sm[1], iframeUrl).toString();
              const sHtml = await fetchHtml(sUrl, 3_000, iframeUrl);
              if (sHtml) {
                innerScripts.push(
                  ...extractStreams(sHtml, sUrl, source.id).filter(
                    (s) => s.type === "hls" || s.type === "dash",
                  ),
                );
              }
            } catch { /* skip */ }
          }
          return [...found, ...innerScripts];
        }),
      );
      for (const r of iframeResults) {
        if (r.status === "fulfilled") deepStreams.push(...r.value);
      }

      const all = [...deepStreams, ...direct];
      if (all.length > 0) return all;
    }
  }
  return [];
}

async function scrapeStreams(slugs: string[]): Promise<GacondoStreamResult> {
  const primarySlug = slugs[0];

  const settled = await Promise.allSettled(
    STREAM_SOURCES.map((source) => fetchSourceStreams(source, slugs)),
  );

  const seen = new Set<string>();
  const streams: GacondoStream[] = [];

  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const s of r.value) {
      if (!seen.has(s.url)) { seen.add(s.url); streams.push(s); }
    }
  }

  const primary =
    streams.find((s) => s.type === "hls") ??
    streams.find((s) => s.type === "dash") ??
    streams.find((s) => s.type === "embed") ??
    streams[0] ?? null;

  // Use the actual page URL where the first HLS/embed stream was found as the CDN referer.
  // This ensures the proxy sends e.g. "Referer: https://footybite.co/match/" not a guessed URL.
  const refererStream = streams.find((s) => s.type === "hls" || s.type === "embed");
  const referer = refererStream?.pageUrl ?? `https://hesgoal.tv/${primarySlug}/`;

  return {
    primarySlug,
    scrapedAt: new Date().toISOString(),
    streams,
    primary,
    requestHeaders: {
      referer,
      userAgent: pickUA(),
    },
  };
}

// ─── Public cached exports ─────────────────────────────────────────────────────

export const getCachedGacondoMatches = cache(
  () => scrapeMatches(),
  ["gacondo-matches-v2"],
  { revalidate: 300 },
);

export const getCachedGacondoStream = cache(
  (slugs: string[]) => scrapeStreams(slugs),
  ["gacondo-stream-v2"],
  { revalidate: 60 },
);
