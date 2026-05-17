const SITE = "https://istreameast.is";

// Rotate through multiple realistic Chrome UAs so requests look organic
const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

function pickUA() {
  return UAS[Math.floor(Date.now() / 30_000) % UAS.length];
}

// Full Chrome browser header set — looks like a real navigation request
function browserHeaders(referer: string) {
  const ua = pickUA();
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
    "sec-ch-ua": `"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": `"Windows"`,
    referer,
    connection: "keep-alive",
  };
}

async function fetchHtml(url: string, referer = SITE): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: browserHeaders(referer),
    });
    if (!res.ok) return "";
    return res.text();
  } catch {
    return "";
  }
}

// ─── In-memory cache (warm lambda instances reuse these) ────────────────────
const matchServerCache = new Map<string, { data: string[]; ts: number }>();
let scheduleCache: { data: IStreamMatch[]; ts: number } | null = null;
const SERVER_TTL = 50_000;    // 50 s — URLs are stable within a match
const SCHEDULE_TTL = 150_000; // 2.5 min — schedule changes slowly

// ─── Input safety ────────────────────────────────────────────────────────────
// Slug must look like "team-a-vs-team-b-1234567" — letters, hyphens, digits only
const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

export type IStreamMatch = {
  slug: string;
  home: string;
  away: string;
};

// ─── Schedule scraper ────────────────────────────────────────────────────────
export async function scrapeIStreamSchedule(): Promise<IStreamMatch[]> {
  if (scheduleCache && Date.now() - scheduleCache.ts < SCHEDULE_TTL) {
    return scheduleCache.data;
  }

  const html = await fetchHtml(`${SITE}/schedule/soccer`);
  if (!html) return scheduleCache?.data ?? [];

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

  scheduleCache = { data: matches, ts: Date.now() };
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
    if (url.includes("istreameast.is")) return; // skip self-referential URLs
    if (seen.has(url)) return;
    seen.add(url);
    servers.push(url);
  };

  // Strategy 1 — all <iframe> src attributes, regardless of attribute order
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

// ─── Team-name fuzzy match (mirrors streamedSu logic) ────────────────────────
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
