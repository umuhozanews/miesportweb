import { unstable_cache as cache } from "next/cache";
import { BRIDGE_PROVIDERS, type BridgeProvider } from "./bridgeProviders";

const HOME_URL = "https://www.soccertvhd.com/";
const SITE_ORIGIN = "https://www.soccertvhd.com";
const WIDGET_ID_PATTERN = /elfsight-app-([a-f0-9-]{36}|[a-z0-9-]+)/i;
const MEDIA_URL_PATTERN = /https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mpd|mp4)(?:\?[^\s"'<>\\]*)?/gi;
const EMBED_PATTERN = /<(?:iframe|source|video-js|video|embed)\b[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/gi;
const SCRIPT_SRC_PATTERN = /<script[^>]+\bsrc=["']([^"']+)["'][^>]*>/gi;

const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
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

export type ScrapedMatch = {
  id: string;
  slug: string | null;
  name: string;
  sourceTimeZone: string;
  start: { type: "datetime"; date: string; time: string };
  end: { type: "datetime"; date: string; time: string };
  startIso: string;
  endIso: string;
  localStart: string;
  localEnd: string;
  isLiveOrUpcoming: boolean;
  button: { visible: boolean; text: string | null; link: string | null; target: string | null };
  image: { url: string } | null;
  raw: any;
};

export type SoccerTvHdScrapeResult = {
  sourceUrl: string;
  widgetId: string;
  bootUrl: string;
  scrapedAt: string;
  widgetTitle: string;
  settings: any;
  matches: ScrapedMatch[];
};

export type StreamResource = {
  type: "hls" | "dash" | "mp4" | "embed" | "unknown";
  url: string;
  source: "html" | "playlist";
  contentType: string | null;
};

export type SoccerTvHdStreamResult = {
  sourceUrl: string;
  slug: string;
  scrapedAt: string;
  streams: StreamResource[];
  primary: StreamResource | null;
  requestHeaders: { referer: string; userAgent: string };
};

// ─── Public cached entry-points ───────────────────────────────────────────────

export const getCachedStvHomeMatches = cache(
  async (): Promise<SoccerTvHdScrapeResult> => scrapeSoccerTvHdHomeMatches(),
  ["stv-home-relay-v2"],
  { revalidate: 300 },
);

export const getCachedStvStream = cache(
  async (slug: string): Promise<SoccerTvHdStreamResult> => scrapeSoccerTvHdStream(slug),
  ["stv-stream-relay-v2"],
  { revalidate: 50 },
);

// ─── Implementation ─────────────────────────────────────────────────────────

export async function scrapeSoccerTvHdHomeMatches(): Promise<SoccerTvHdScrapeResult> {
  const matches: ScrapedMatch[] = [];
  
  console.log("Mimicking SoccerTVHD WP-API approach...");
  try {
    const wpApiUrl = `${SITE_ORIGIN}/wp-json/wp/v2/posts?per_page=100&_fields=id,title,link,date&status=publish`;
    const posts = await fetchJson<any[]>(wpApiUrl);
    
    if (posts?.length) {
      posts.forEach(p => {
        const title = decodeHtml(p.title.rendered);
        if (title.toLowerCase().includes("vs")) {
          const start = new Date(p.date);
          const end = new Date(start.getTime() + 2.5 * 60 * 60 * 1000);
          matches.push({
            id: `relay-${p.id}`,
            slug: getSlug(p.link),
            name: title,
            sourceTimeZone: "UTC",
            start: { type: "datetime", date: p.date.split("T")[0], time: p.date.split("T")[1]?.slice(0, 5) || "00:00" },
            end: { type: "datetime", date: p.date.split("T")[0], time: "23:59" },
            startIso: start.toISOString(),
            endIso: end.toISOString(),
            localStart: formatLocalDateTime(start),
            localEnd: "N/A",
            isLiveOrUpcoming: true,
            button: { visible: true, text: "Watch Live", link: p.link, target: "_blank" },
            image: null,
            raw: p,
          });
        }
      });
    }
  } catch (e) {
    console.error("Relay sync failed:", e);
  }

  return {
    sourceUrl: "internal://relay-master",
    widgetId: "relay-master",
    bootUrl: "internal://relay-master",
    scrapedAt: new Date().toISOString(),
    widgetTitle: "Global Match Relay",
    settings: {},
    matches: matches.slice(0, 100),
  };
}

export async function scrapeSoccerTvHdStream(input: string): Promise<SoccerTvHdStreamResult> {
  let slug = input;
  if (input.startsWith("stv-")) {
    const inner = input.slice(4);
    const sepIdx = inner.indexOf("--");
    slug = sepIdx !== -1 ? inner.slice(sepIdx + 2) : inner;
  }
  const sourceUrl = slug.startsWith("http") ? slug : `${SITE_ORIGIN}/${slug.replace(/^\/+|\/+$/g, "")}/`;
  const pageSlug = getSlug(sourceUrl) ?? slug;
  
  let content = "";
  let method: "api" | "html" = "api";

  try {
    // Try WP-API first (cleaner, bypasses some Cloudflare blocks)
    const apiUrl = `${SITE_ORIGIN}/wp-json/wp/v2/posts?slug=${encodeURIComponent(pageSlug)}&_fields=content`;
    const posts = await fetchJson<any[]>(apiUrl);
    content = posts[0]?.content?.rendered ?? "";
  } catch (e) {
    console.warn(`WP-API fetch failed for ${pageSlug}, falling back to HTML scraping.`);
  }

  if (!content) {
    try {
      content = (await fetchText(sourceUrl, 6000, SITE_ORIGIN)) ?? "";
      method = "html";
    } catch (e) {
      console.error(`Stream fetch failed for ${sourceUrl}:`, e);
      return {
        sourceUrl,
        slug: pageSlug,
        scrapedAt: new Date().toISOString(),
        streams: [],
        primary: null,
        requestHeaders: { referer: sourceUrl, userAgent: pickUA() },
      };
    }
  }
  
  const streams: StreamResource[] = extractMediaResources(content, sourceUrl);

  // Drill into relay pages (e.g. /yalla-shoot-...) found in the content
  const relayEmbeds = streams.filter(s => s.type === "embed" && s.url.startsWith(SITE_ORIGIN));
  const deepStreams: StreamResource[] = [];

  if (relayEmbeds.length > 0) {
    const settled = await Promise.allSettled(relayEmbeds.map(async (embed) => {
      const embedSlug = getSlug(embed.url);
      if (!embedSlug) return [];
      try {
        const eApiUrl = `${SITE_ORIGIN}/wp-json/wp/v2/posts?slug=${encodeURIComponent(embedSlug)}&_fields=content`;
        const ePosts = await fetchJson<any[]>(eApiUrl);
        const eContent = ePosts[0]?.content?.rendered ?? "";
        if (eContent) return extractMediaResources(eContent, embed.url);
      } catch {}
      
      const embedHtml = await fetchText(embed.url, 5000, sourceUrl);
      return extractMediaResources(embedHtml, embed.url);
    }));
    settled.forEach(r => {
      if (r.status === "fulfilled") deepStreams.push(...r.value);
    });
  }

  const finalStreams = dedupeStreams([...deepStreams, ...streams]);

  return {
    sourceUrl,
    slug: getSlug(sourceUrl) ?? "",
    scrapedAt: new Date().toISOString(),
    streams: finalStreams,
    primary: finalStreams.find(s => s.type === "hls") || finalStreams[0] || null,
    requestHeaders: { referer: sourceUrl, userAgent: pickUA() },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchText(url: string, timeoutMs = 8000, referer?: string): Promise<string | null> {
  const ua = pickUA();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "user-agent": ua,
        ...getClientHints(ua),
        ...(referer ? { referer, origin: new URL(referer).origin } : {}),
      },
    });
    if (response.status === 404 || response.status === 403) return null;
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    return response.text();
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") return null;
    throw e;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const ua = pickUA();
  const response = await fetch(url, {
    headers: {
      "user-agent": ua,
      ...getClientHints(ua),
      accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return response.json() as T;
}

const JUNK_URL_RE = /(?:_Incapsula_Resource|__cf_chl|captcha|\.js\?|googlesyndication|doubleclick|adsbygoogle|\.(?:webp|png|jpe?g|gif|svg|css)(?:\?|$))/i;

function extractMediaResources(html: string | null, pageUrl: string): StreamResource[] {
  const urls = new Set<string>();
  if (!html) return [];
  for (const match of html.matchAll(MEDIA_URL_PATTERN)) {
    const u = decodeHtml(match[0]);
    if (!JUNK_URL_RE.test(u)) urls.add(u);
  }
  for (const match of html.matchAll(EMBED_PATTERN)) {
    try {
      const u = new URL(decodeHtml(match[1]), pageUrl).toString();
      if (!JUNK_URL_RE.test(u)) urls.add(u);
    } catch {}
  }
  return [...urls].map(url => ({
    type: getStreamType(url),
    url,
    source: "html",
    contentType: null,
  }));
}

function getStreamType(url: string): StreamResource["type"] {
  if (/\.m3u8(?:\?|$)/i.test(url)) return "hls";
  if (/\.mpd(?:\?|$)/i.test(url)) return "dash";
  if (/^https?:\/\//i.test(url)) return "embed";
  return "unknown";
}

function decodeHtml(v: string) {
  return v.replaceAll("&amp;", "&").replaceAll("&#038;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
}

function getSlug(link: string) {
  try { return new URL(link).pathname.split("/").filter(Boolean).at(-1) || null; } catch { return null; }
}

function formatLocalDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function toSoccerTvHdPostUrl(slug: string) {
  let pageSlug = slug;
  if (slug.startsWith("stv-")) {
    const inner = slug.slice(4);
    const sepIdx = inner.indexOf("--");
    pageSlug = sepIdx !== -1 ? inner.slice(sepIdx + 2) : inner;
  }
  return `${SITE_ORIGIN}/${pageSlug.replace(/^\/+|\/+$/g, "")}/`;
}

function dedupeStreams(streams: StreamResource[]) {
  const seen = new Set<string>();
  return streams.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}
