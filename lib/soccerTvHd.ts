import { unstable_cache as cache } from "next/cache";

const HOME_URL = "https://www.soccertvhd.com/";
const SITE_ORIGIN = "https://www.soccertvhd.com";
const WIDGET_ID_PATTERN =
  /elfsight-app-([a-f0-9-]{36}|[a-z0-9-]+)/i;
const MEDIA_URL_PATTERN =
  /https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mpd|mp4)(?:\?[^\s"'<>\\]*)?/gi;
const EMBED_PATTERN =
  /<(?:iframe|source|video-js|video|embed)\b[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/gi;

// Realistic browser UAs — rotate every 3 minutes so each cache window looks different
const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
];

function pickUA(): string {
  return UA_POOL[Math.floor(Date.now() / 180_000) % UA_POOL.length];
}

// CF Workers fetch extension (silently ignored in Node.js)
type CFRequestInit = RequestInit & { cf?: { cacheTtl?: number; cacheEverything?: boolean } };

function cfInit(base: RequestInit, ttl: number): CFRequestInit {
  return { ...base, cf: { cacheTtl: ttl, cacheEverything: true } };
}

type EventDateTime = {
  type: "datetime";
  date: string;
  time: string;
};

type EventImage = {
  url: string;
  name?: string;
  size?: number;
  type?: string;
  extension?: string;
  width?: number;
  height?: number;
};

type EventLink = {
  type: string;
  target: string;
  rawValue: string;
  value: string;
};

type ElfsightEvent = {
  id: string;
  name: string;
  start: EventDateTime;
  end: EventDateTime;
  timeZone: string;
  repeatPeriod?: string;
  description?: string;
  image?: EventImage;
  eventType?: unknown[];
  location?: unknown[];
  host?: unknown[];
  tags?: unknown[];
  color?: string;
  buttonVisible?: boolean;
  buttonLink?: EventLink;
  buttonText?: string;
  buttonCaption?: string;
  video?: unknown;
  chosen?: boolean;
  selected?: boolean;
  repeatFrequency?: string;
  "$$key"?: [string, number];
  file?: unknown;
  exceptions?: unknown[];
  visible?: boolean;
};

type ElfsightWidgetSettings = {
  events: ElfsightEvent[];
  widgetTitle?: string;
  layout?: string;
  groupBy?: string;
  showPastEvents?: boolean;
  numberOfEventsInList?: number;
  numberOfEventsOnMobileInList?: number;
  eventClickAction?: string;
  enableEventLinking?: boolean;
  displayDateFormat?: string;
  displayTimeFormat?: string;
  inLocalTimeZone?: boolean;
  widgetId?: string;
};

type ElfsightBootResponse = {
  status: number;
  data?: {
    widgets?: Record<
      string,
      {
        status: number;
        data?: {
          app?: string;
          settings?: ElfsightWidgetSettings;
          meta?: {
            widget_name?: string;
            app_name?: string;
            app_version?: string;
          };
        };
      }
    >;
  };
};

export type ScrapedMatch = {
  id: string;
  slug: string | null;
  name: string;
  sourceTimeZone: string;
  start: EventDateTime;
  end: EventDateTime;
  startIso: string;
  endIso: string;
  localStart: string;
  localEnd: string;
  isLiveOrUpcoming: boolean;
  button: {
    visible: boolean;
    text: string | null;
    link: string | null;
    target: string | null;
  };
  image: EventImage | null;
  raw: ElfsightEvent;
};

export type SoccerTvHdScrapeResult = {
  sourceUrl: string;
  widgetId: string;
  bootUrl: string;
  scrapedAt: string;
  widgetTitle: string;
  settings: {
    layout: string | null;
    groupBy: string | null;
    showPastEvents: boolean;
    numberOfEventsInList: number | null;
    eventClickAction: string | null;
    enableEventLinking: boolean | null;
    displayDateFormat: string | null;
    displayTimeFormat: string | null;
    inLocalTimeZone: boolean | null;
  };
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
  requestHeaders: {
    referer: string;
    userAgent: string;
  };
};

// Stable fallback — the homepage is IP-blocked on CF Workers but the Elfsight API works fine
const FALLBACK_WIDGET_ID = "feba0ba4-3d63-4db8-8a0a-5e37b58b3fcc";

// ─── Public cached entry-points ───────────────────────────────────────────────

/**
 * Cached version of scrapeSoccerTvHdHomeMatches.
 * OpenNext backs this with Cloudflare Cache API so all Worker instances share it.
 */
export const getCachedStvHomeMatches = cache(
  async (): Promise<SoccerTvHdScrapeResult> => scrapeSoccerTvHdHomeMatches(),
  ["stv-home-v2"],
  { revalidate: 300 }, // 5 min
);

export async function scrapeSoccerTvHdHomeMatches(): Promise<SoccerTvHdScrapeResult> {
  let widgetId: string;
  try {
    // Short timeout — on CF Workers the homepage is IP-blocked so we fail fast
    widgetId = await getHomepageWidgetId(2_000);
  } catch {
    widgetId = FALLBACK_WIDGET_ID;
  }
  const bootUrl = getBootUrl(widgetId);
  const boot = await fetchJson<ElfsightBootResponse>(bootUrl);
  const widget = boot.data?.widgets?.[widgetId];
  const settings = widget?.data?.settings;

  if (!settings?.events) {
    throw new Error("Could not find Elfsight event calendar settings.");
  }

  const now = new Date();
  // Ignore the widget's own display limit — show all events up to 60 days out
  const matches = settings.events
    .map(normalizeEvent)
    .filter((event) => event.raw.visible !== false)
    .filter((event) => event.endIso > now.toISOString())
    .sort((a, b) => a.startIso.localeCompare(b.startIso))
    .slice(0, 60); // reasonable cap to keep responses light

  return {
    sourceUrl: HOME_URL,
    widgetId,
    bootUrl,
    scrapedAt: now.toISOString(),
    widgetTitle: settings.widgetTitle ?? "Upcoming Top Matches",
    settings: {
      layout: settings.layout ?? null,
      groupBy: settings.groupBy ?? null,
      showPastEvents: Boolean(settings.showPastEvents),
      numberOfEventsInList: settings.numberOfEventsInList ?? null,
      eventClickAction: settings.eventClickAction ?? null,
      enableEventLinking: settings.enableEventLinking ?? null,
      displayDateFormat: settings.displayDateFormat ?? null,
      displayTimeFormat: settings.displayTimeFormat ?? null,
      inLocalTimeZone: settings.inLocalTimeZone ?? null,
    },
    matches,
  };
}

const streamCache = new Map<string, { data: SoccerTvHdStreamResult; ts: number }>();
const STREAM_TTL = 5 * 60_000; // 5 minutes

export async function scrapeSoccerTvHdStream(
  input: string,
): Promise<SoccerTvHdStreamResult> {
  const sourceUrl = toSoccerTvHdPostUrl(input);

  const cached = streamCache.get(sourceUrl);
  if (cached && Date.now() - cached.ts < STREAM_TTL) return cached.data;

  const html = await fetchText(sourceUrl, 10_000);
  const htmlStreams = extractMediaResources(html, sourceUrl);
  const playlistStreams = await Promise.all(
    htmlStreams
      .filter((stream) => stream.type === "hls" || stream.type === "dash")
      .map((stream) => discoverPlaylistChildren(stream, sourceUrl)),
  );
  const streams = dedupeStreams([...htmlStreams, ...playlistStreams.flat()]);

  const result: SoccerTvHdStreamResult = {
    sourceUrl,
    slug: getSlug(sourceUrl) ?? "",
    scrapedAt: new Date().toISOString(),
    streams,
    primary:
      streams.find((stream) => stream.type === "hls") ??
      streams.find((stream) => stream.type === "dash") ??
      streams.find((stream) => stream.type === "embed") ??
      streams[0] ??
      null,
    requestHeaders: {
      referer: sourceUrl,
      userAgent: pickUA(),
    },
  };

  streamCache.set(sourceUrl, { data: result, ts: Date.now() });
  return result;
}

async function getHomepageWidgetId(timeoutMs = 4_000): Promise<string> {
  const html = await fetchText(HOME_URL, timeoutMs);
  const widgetId = html.match(WIDGET_ID_PATTERN)?.[1];

  if (!widgetId) {
    throw new Error("Could not find the Elfsight widget id on the homepage.");
  }

  return widgetId;
}

function getBootUrl(widgetId: string) {
  const url = new URL("https://core.service.elfsight.com/p/boot/");
  url.searchParams.set("page", HOME_URL);
  url.searchParams.set("w", widgetId);
  return url.toString();
}

async function fetchText(url: string, timeoutMs = 8_000): Promise<string> {
  const ua = pickUA();
  const init = cfInit({
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "accept-encoding": "gzip, deflate, br",
      "user-agent": ua,
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cache-control": "max-age=0",
    },
  }, 60); // cache page fetches for 1 min at CF edge

  let response: Response;
  try {
    response = await fetch(url, init as RequestInit);
  } catch (err) {
    // Retry once with a different UA
    const init2 = cfInit({
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        accept: "text/html,*/*",
        "user-agent": UA_POOL[(UA_POOL.indexOf(ua) + 1) % UA_POOL.length],
      },
    }, 60);
    response = await fetch(url, init2 as RequestInit);
    if (!response) throw err;
  }

  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchStreamText(url: string, referer: string) {
  const response = await fetch(url, cfInit({
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
    headers: {
      accept: "application/vnd.apple.mpegurl,application/x-mpegURL,application/dash+xml,text/plain,*/*",
      referer,
      origin: SITE_ORIGIN,
      "user-agent": pickUA(),
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    },
  }, 120) as RequestInit); // cache playlist fetches for 2 min

  if (!response.ok) {
    return null;
  }

  return {
    body: await response.text(),
    contentType: response.headers.get("content-type"),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  // Cache the Elfsight boot API at the CF edge so all Workers share it
  const init = cfInit({
    signal: AbortSignal.timeout(12_000),
    headers: {
      accept: "application/json, text/plain, */*",
      referer: HOME_URL,
      origin: SITE_ORIGIN,
      "user-agent": pickUA(),
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
    },
  }, 300); // 5-minute shared CF edge cache

  const response = await fetch(url, init as RequestInit);

  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }

  return (await response.json()) as T;
}

function normalizeEvent(event: ElfsightEvent): ScrapedMatch {
  const start = zonedDateTimeToDate(event.start, event.timeZone);
  const end = zonedDateTimeToDate(event.end, event.timeZone);
  const link = event.buttonLink?.value ?? event.buttonLink?.rawValue ?? null;

  return {
    id: event.id,
    slug: link ? getSlug(link) : null,
    name: event.name,
    sourceTimeZone: event.timeZone,
    start: event.start,
    end: event.end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    localStart: formatLocalDateTime(start),
    localEnd: formatLocalDateTime(end),
    isLiveOrUpcoming: end > new Date(),
    button: {
      visible: event.buttonVisible ?? false,
      text: event.buttonText ?? null,
      link,
      target: event.buttonLink?.target ?? null,
    },
    image: event.image ?? null,
    raw: event,
  };
}

function zonedDateTimeToDate({ date, time }: EventDateTime, timeZone: string): Date {
  // Convert a local date/time in an arbitrary IANA timezone to a UTC Date.
  // Works by computing what UTC timestamp maps to the given local time.
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const approxUtc = Date.UTC(y, mo - 1, d, h, mi);

  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", hour12: false,
    });
    const parts = fmt.formatToParts(new Date(approxUtc)).reduce(
      (acc, p) => { if (p.type !== "literal") acc[p.type] = Number(p.value); return acc; },
      {} as Record<string, number>,
    );
    const tzH = parts.hour === 24 ? 0 : parts.hour;
    const tzUtc = Date.UTC(parts.year, parts.month - 1, parts.day, tzH, parts.minute);
    return new Date(approxUtc - (tzUtc - approxUtc));
  } catch {
    // Fallback: assume UTC
    return new Date(`${date}T${time}:00Z`);
  }
}

function formatLocalDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSlug(link: string) {
  try {
    const url = new URL(link);
    const slug = url.pathname.split("/").filter(Boolean).at(-1);
    return slug ?? null;
  } catch {
    return null;
  }
}

function toSoccerTvHdPostUrl(input: string) {
  const value = input.trim();
  const url = value.startsWith("http")
    ? new URL(value)
    : new URL(`/${value.replace(/^\/+|\/+$/g, "")}/`, SITE_ORIGIN);

  if (url.origin !== SITE_ORIGIN) {
    throw new Error("Only soccertvhd.com match page URLs are supported.");
  }

  url.search = "";
  url.hash = "";
  return url.toString();
}

function extractMediaResources(html: string, pageUrl: string): StreamResource[] {
  const urls = new Set<string>();

  for (const match of html.matchAll(MEDIA_URL_PATTERN)) {
    urls.add(decodeHtml(match[0]));
  }

  for (const match of html.matchAll(EMBED_PATTERN)) {
    urls.add(new URL(decodeHtml(match[1]), pageUrl).toString());
  }

  return [...urls].map((url) => ({
    type: getStreamType(url),
    url,
    source: "html",
    contentType: null,
  }));
}

async function discoverPlaylistChildren(
  stream: StreamResource,
  referer: string,
): Promise<StreamResource[]> {
  const playlist = await fetchStreamText(stream.url, referer);

  if (!playlist?.body.startsWith("#EXTM3U") && !playlist?.body.includes("<MPD")) {
    stream.contentType = playlist?.contentType ?? stream.contentType;
    return [];
  }

  stream.contentType = playlist.contentType;

  return playlist.body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .filter((line) => /\.(?:m3u8|mpd|mp4)(?:\?|$)/i.test(line))
    .map((line) => {
      const url = new URL(line, stream.url).toString();
      return {
        type: getStreamType(url),
        url,
        source: "playlist" as const,
        contentType: null,
      };
    });
}

function dedupeStreams(streams: StreamResource[]) {
  const seen = new Set<string>();
  return streams.filter((stream) => {
    if (seen.has(stream.url)) return false;
    seen.add(stream.url);
    return true;
  });
}

function getStreamType(url: string): StreamResource["type"] {
  if (/\.m3u8(?:\?|$)/i.test(url)) return "hls";
  if (/\.mpd(?:\?|$)/i.test(url)) return "dash";
  if (/\.mp4(?:\?|$)/i.test(url)) return "mp4";
  if (/^https?:\/\//i.test(url)) return "embed";
  return "unknown";
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#038;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}
