import { unstable_cache as cache } from "next/cache";

const SITE = "https://istreameast.is";

// Rotate through multiple realistic Chrome UAs so requests look organic
const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
];

function pickUA(): string {
  return UAS[Math.floor(Date.now() / 30_000) % UAS.length];
}

type CFRequestInit = RequestInit & { cf?: { cacheTtl?: number; cacheEverything?: boolean } };

function cfInit(base: RequestInit, ttl: number): CFRequestInit {
  return { ...base, cf: { cacheTtl: ttl, cacheEverything: true } };
}

// Full Chrome browser header set — looks like a real navigation request
function browserHeaders(referer: string, ua = pickUA()) {
  return {
    "user-agent": ua,
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "accept-encoding": "gzip, deflate, br",
    "cache-control": "max-age=0",
    "upgrade-insecure-requests": "1",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "sec-ch-ua": `"Chromium";v="125", "Google Chrome";v="125", "Not-A.Brand";v="99"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": `"Windows"`,
    referer,
    connection: "keep-alive",
  };
}

async function fetchHtml(url: string, referer = SITE): Promise<string> {
  const ua = pickUA();

  // First attempt
  try {
    const res = await fetch(url, cfInit({
      signal: AbortSignal.timeout(12_000),
      headers: browserHeaders(referer, ua),
    }, 150) as RequestInit); // 2.5 min shared CF edge cache
    if (res.ok) return res.text();
  } catch {
    // fall through to retry
  }

  // Retry with a different UA — helps bypass simple bot detection
  try {
    const ua2 = UAS[(UAS.indexOf(ua) + 1) % UAS.length];
    const res = await fetch(url, cfInit({
      signal: AbortSignal.timeout(12_000),
      headers: browserHeaders(referer, ua2),
    }, 150) as RequestInit);
    if (res.ok) return res.text();
  } catch {
    // fall through
  }

  return "";
}

// ─── In-memory cache (warm lambda instances reuse these) ────────────────────
const matchServerCache = new Map<string, { data: string[]; ts: number }>();
const SERVER_TTL = 50_000;    // 50 s — URLs are stable within a match

// ─── Input safety ────────────────────────────────────────────────────────────
const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

export type IStreamMatch = {
  slug: string;
  home: string;
  away: string;
};

// ─── Public cached entry-points ──────────────────────────────────────────────

/**
 * Cached schedule — OpenNext backs this with CF Cache API so all Workers share it.
 */
export const getCachedIStreamSchedule = cache(
  async (): Promise<IStreamMatch[]> => scrapeIStreamSchedule(),
  ["istream-schedule-v2"],
  { revalidate: 150 }, // 2.5 min
);

/**
 * Cached match servers — keyed by slug so each match has its own entry.
 */
export const getCachedMatchServers = cache(
  async (slug: string): Promise<string[]> => scrapeMatchServers(slug),
  ["istream-servers-v2"],
  { revalidate: 50 },
);

// ─── Schedule scraper ────────────────────────────────────────────────────────
export async function scrapeIStreamSchedule(): Promise<IStreamMatch[]> {
  const html = await fetchHtml(`${SITE}/schedule/soccer`);
  if (!html) return [];

  const seen = new Set<string>();
  const matches: IStreamMatch[] = [];

  for (const [, slug] of html.matchAll(/\/links\/([a-z0-9][a-z0-9-]+-\d+)/g)) {
    if (seen.has(slug)) continue;
    seen.add(slug);

    const vsIdx = slug.indexOf("-vs-");
    if (vsIdx === -1) continue;

    const afterVs = slug.slice(vsIdx + 4);
    const idMatch = afterVs.match(/-(\d+)$/);
    if (!idMatch) continue;

    const id = idMatch[1];
    const away = afterVs.slice(0, afterVs.length - id.length - 1);
    const home = slug.slice(0, vsIdx);

    matches.push({ slug, home, away });
  }

  return matches;
}

// ─── Match page scraper ──────────────────────────────────────────────────────
export async function scrapeMatchServers(slug: string): Promise<string[]> {
  if (!SAFE_SLUG_RE.test(slug)) return [];

  const cached = matchServerCache.get(slug);
  if (cached && Date.now() - cached.ts < SERVER_TTL) return cached.data;

  const pageUrl = `${SITE}/links/${slug}`;
  const html = await fetchHtml(pageUrl, `${SITE}/schedule/soccer`);
  if (!html) return cached?.data ?? [];

  const seen = new Set<string>();
  const servers: string[] = [];

  const addUrl = (raw: string) => {
    const url = raw.trim().replace(/['"\\]/g, "");
    if (!url.startsWith("http")) return;
    if (url.includes("istreameast.is")) return;
    if (seen.has(url)) return;
    seen.add(url);
    servers.push(url);
  };

  // Strategy 1 — all <iframe> src attributes
  for (const [tag] of html.matchAll(/<iframe\b[^>]*>/gi)) {
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (src) addUrl(src);
  }

  // Strategy 2 — data-src / data-url / data-stream on any element
  for (const [, url] of html.matchAll(/data-(?:src|url|stream)=["']([^"']+)["']/gi)) {
    addUrl(url);
  }

  // Strategy 3 — embedsports.top URLs embedded anywhere in JS/JSON/HTML
  for (const [url] of html.matchAll(/https?:\/\/embedsports\.top\/[^\s"'<>\\]+/gi)) {
    addUrl(url);
  }

  // Strategy 4 — any https embed-looking URL in the page source
  for (const [, url] of html.matchAll(/["'](https?:\/\/(?:embed|stream|live|player)\.[^"']{10,})["']/gi)) {
    addUrl(url);
  }

  if (servers.length > 0) {
    matchServerCache.set(slug, { data: servers, ts: Date.now() });
  }

  return servers;
}

// ─── Team-name fuzzy match ────────────────────────────────────────────────────
function normWords(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

export function findIStreamMatch(
  homeNm: string,
  awayNm: string,
  matches: IStreamMatch[],
): IStreamMatch | null {
  const hw = normWords(homeNm);
  const aw = normWords(awayNm);
  for (const m of matches) {
    const mhw = normWords(m.home.replace(/-/g, " "));
    const maw = normWords(m.away.replace(/-/g, " "));
    const homeHit = [...hw].some((w) => mhw.has(w));
    const awayHit = [...aw].some((w) => maw.has(w));
    if (homeHit && awayHit) return m;
  }
  return null;
}
