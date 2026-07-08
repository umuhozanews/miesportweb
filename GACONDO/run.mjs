// Standalone runner — no Next.js needed
// Usage: node GACONDO/run.mjs
// Usage: node GACONDO/run.mjs <slug>   (e.g. node GACONDO/run.mjs manchester-city-vs-arsenal)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ─── Config ────────────────────────────────────────────────────────────────────

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
const pickUA = () => UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

function getClientHints(ua) {
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

// TheSportsDB free public API — no key needed, returns today's soccer matches
const TSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

// ─── Regex (stream extraction) ─────────────────────────────────────────────────

const MEDIA_RE      = () => /https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mpd|mp4)(?:\?[^\s"'<>\\]*)?/gi;
const EMBED_RE      = () => /<(?:iframe|video|source|embed)\b[^>]*(?:src|data-src)=["']([^"'<>]{10,})["']/gi;
const DATA_ATTR_RE  = () => /\bdata-(?:src|url|file|stream|hls|video|media|playlist|source)=["']([^"']{10,})["']/gi;
const JS_STREAM_RE  = () => /(?:file|source|src|url|stream|hls|hlsSrc|m3u8|streamUrl|playlist|liveUrl|hlsUrl|videoUrl)\s*[=:]\s*["'`]([^"'`]{10,}(?:\.m3u8|\.mpd)(?:\?[^"'`]*)?)['"` ]/gi;
const BASE64_RE     = () => /(?:atob|window\.atob)\s*\(\s*["']([A-Za-z0-9+/=]{20,})["']\s*\)/gi;
const SCRIPT_SRC_RE = () => /<script[^>]+\bsrc=["']([^"']+)["'][^>]*>/gi;

// ─── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchHtml(url, timeoutMs = 8_000, referer) {
  let fetchSite = "none";
  if (referer) {
    try {
      fetchSite = new URL(referer).origin === new URL(url).origin ? "same-origin" : "cross-site";
    } catch { /* leave as none */ }
  }

  const buildHeaders = (ua) => ({
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "accept-encoding": "gzip, deflate, br",
    "user-agent": ua,
    ...getClientHints(ua),
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
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const r = await fetch(url, { signal: ctrl.signal, headers: buildHeaders(ua) });
      clearTimeout(timer);
      if (r.ok) return r.text();
      if (r.status === 403 || r.status === 429 || r.status === 503) continue;
      return null;
    } catch {
      if (attempt === 1) return null;
    }
  }
  return null;
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 10_000);
  const r = await fetch(url, {
    signal: ctrl.signal,
    headers: { "user-agent": pickUA(), accept: "application/json" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ─── Slug generation ───────────────────────────────────────────────────────────

function toSlugPart(name) {
  return name
    .normalize("NFD")                    // decompose accented chars: é → e + ́
    .replace(/[̀-ͯ]/g, "")    // strip combining diacritics
    .toLowerCase()
    .replace(/\s*&\s*/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function teamSlugVariants(name) {
  const base = toSlugPart(name);
  const variants = [base];
  const sub = (from, to) => {
    const v = base.replace(from, to);
    if (v !== base) variants.push(v);
  };
  sub(/manchester-united/, "man-utd");
  sub(/manchester-city/, "man-city");
  sub(/paris-saint-germain/, "psg");
  sub(/psg/, "paris-saint-germain");
  sub(/atletico-madrid/, "atletico");
  sub(/internazionale/, "inter");
  sub(/inter$/, "internazionale");
  sub(/tottenham-hotspur/, "tottenham");
  sub(/newcastle-united/, "newcastle");
  sub(/west-ham-united/, "west-ham");
  sub(/wolverhampton/, "wolves");
  sub(/borussia-dortmund/, "dortmund");
  sub(/rb-leipzig/, "leipzig");
  sub(/bayer-leverkusen/, "leverkusen");
  sub(/olympique-marseille/, "marseille");
  sub(/olympique-lyonnais/, "lyon");

  // Add stripped variants without common prefixes/suffixes
  const stripped = base
    .replace(/-(?:fc|sc|cf|fk|republic|united|city|town|rovers|wanderers|athletic)$/i, "")
    .replace(/^(?:fc|sc|cf|fk|real|deportivo)-/i, "");
  if (stripped !== base) {
    variants.push(stripped);
  }

  return [...new Set(variants)];
}

function matchSlugVariants(homeTeam, awayTeam) {
  const homes = teamSlugVariants(homeTeam);
  const aways = teamSlugVariants(awayTeam);
  const slugs = [];
  for (const h of homes) for (const a of aways) {
    slugs.push(`${h}-vs-${a}`);
  }
  return slugs;
}

// ─── TheSportsDB match fetch ───────────────────────────────────────────────────

async function fetchTodayMatches() {
  const d = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const dates = [d(0), d(1)]; // today and tomorrow

  const results = await Promise.allSettled(
    dates.map(date => fetchJson(`${TSDB_BASE}/eventsday.php?d=${date}&s=Soccer`)),
  );

  const events = results.flatMap(r =>
    r.status === "fulfilled" ? r.value.events ?? [] : [],
  );

  return events
    .filter(e => e.strStatus !== "FT" && e.strStatus !== "Fin")
    .map(e => ({
      id: e.idEvent,
      homeTeam: e.strHomeTeam,
      awayTeam: e.strAwayTeam,
      name: `${e.strHomeTeam} vs ${e.strAwayTeam}`,
      competition: e.strLeague,
      dateTime: e.strTimestamp,
      time: e.strTime?.slice(0, 5) ?? null,
      isLive: ["1H","2H","HT","ET","LIVE","PEN"].includes(e.strStatus ?? ""),
      status: e.strStatus ?? "NS",
      slugs: matchSlugVariants(e.strHomeTeam, e.strAwayTeam),
      thumb: e.strThumb ?? null,
      homeBadge: e.strHomeTeamBadge ?? null,
      awayBadge: e.strAwayTeamBadge ?? null,
    }))
    .sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return (a.dateTime ?? "").localeCompare(b.dateTime ?? "");
    });
}

// ─── Stream extraction ─────────────────────────────────────────────────────────

const BOT_CHALLENGE_RE = /(?:_Incapsula_Resource|__cf_chl|captcha|cf-chl-bypass|DDoS-GUARD|ray\s*id|access denied|security check|checking your browser)/i;
const isBotChallengePage = (html) => html.length < 800 || BOT_CHALLENGE_RE.test(html);
const isJunkEmbedUrl = (url) => /(?:_Incapsula_Resource|__cf_chl|captcha|\.js\?|googlesyndication|doubleclick|adsbygoogle|\.(?:webp|png|jpe?g|gif|svg|css)(?:\?|$))/i.test(url);

function streamType(url) {
  if (/\.m3u8(?:\?|$)/i.test(url)) return "hls";
  if (/\.mpd(?:\?|$)/i.test(url)) return "dash";
  if (/\.mp4(?:\?|$)/i.test(url)) return "mp4";
  if (/^https?:\/\//i.test(url)) return "embed";
  return "unknown";
}

function extractStreams(html, pageUrl, sourceId) {
  const urls = new Set();

  for (const m of html.matchAll(MEDIA_RE())) urls.add(m[0]);
  for (const m of html.matchAll(EMBED_RE())) {
    try { urls.add(new URL(m[1], pageUrl).toString()); } catch { /**/ }
  }
  for (const m of html.matchAll(DATA_ATTR_RE())) {
    try { urls.add(new URL(m[1], pageUrl).toString()); } catch { /**/ }
  }
  for (const m of html.matchAll(JS_STREAM_RE())) {
    const u = m[1].trim().replace(/[`'"]$/, "");
    if (/^https?:\/\//i.test(u)) urls.add(u);
  }
  for (const m of html.matchAll(BASE64_RE())) {
    try {
      const dec = Buffer.from(m[1], "base64").toString("utf8");
      for (const dm of dec.matchAll(MEDIA_RE())) urls.add(dm[0]);
    } catch { /**/ }
  }

  return [...urls].map(url => ({ type: streamType(url), url, sourceId, contentType: null }));
}

// ─── Stream sources ────────────────────────────────────────────────────────────

const STREAM_SOURCES = [
  { id: "hesgoal",      urls: s => [`https://hesgoal.tv/${s}/`, `https://www.hesgoal.com/${s}/`] },
  { id: "totalsportek", urls: s => [`https://www.totalsportek.com/soccer/${s}-live-stream/`] },
  { id: "socceronline", urls: s => [`https://socceronline.me/${s}/`] },
  { id: "sportsonline", urls: s => [`https://sportsonline.vc/${s}/`, `https://sportsonline.sx/${s}/`] },
  { id: "score808",     urls: s => [`https://score808.me/${s}/`, `https://score808.eu/${s}/`] },
  { id: "footybite",    urls: s => [`https://footybite.co/${s}/`] },
  { id: "soccerstreams",urls: s => [`https://soccerstreams101.co/${s}/`, `https://soccerstreams100.net/${s}/`] },
  { id: "streambtw",    urls: s => [`https://streambtw.com/soccer/${s}/`] },
  { id: "buffstreams",  urls: s => [`https://buffstreams.app/soccer/${s}/`] },
  { id: "crackstreams", urls: s => [`https://crackstreams.biz/soccer/${s}/`, `https://crackstreams.com/soccer/${s}/`] },
];

const IFRAME_SRC_RE = () => /<iframe[^>]+\bsrc=["']([^"'<>]{10,})["'][^>]*>/gi;

async function scrapeStreamForSource(source, slugs) {
  for (const slug of slugs) {
    for (const url of source.urls(slug)) {
      const html = await fetchHtml(url, 6_000);
      if (!html || isBotChallengePage(html)) continue;

      const direct = extractStreams(html, url, source.id)
        .filter(s => (s.type === "hls" || s.type === "dash" || s.type === "embed") && !isJunkEmbedUrl(s.url));

      const deepStreams = [];

      // Drill into player <script> files
      for (const m of html.matchAll(SCRIPT_SRC_RE())) {
        if (!/(?:player|stream|config|jwplayer|video|hls|live)/i.test(m[1])) continue;
        try {
          const scriptUrl = new URL(m[1], url).toString();
          const scriptHtml = await fetchHtml(scriptUrl, 3_000, url);
          if (scriptHtml) {
            deepStreams.push(...extractStreams(scriptHtml, scriptUrl, source.id)
              .filter(s => s.type === "hls" || s.type === "dash"));
          }
        } catch { /**/ }
      }

      // Drill into embedded player iframes — most streaming sites wrap streams in iframes
      const iframeSrcs = [];
      const pageOrigin = new URL(url).origin;
      for (const m of html.matchAll(IFRAME_SRC_RE())) {
        try {
          const iframeUrl = new URL(m[1], url).toString();
          if (new URL(iframeUrl).origin === pageOrigin) continue;
          if (/(?:google|facebook|twitter|doubleclick|googlesyndication)/i.test(iframeUrl)) continue;
          iframeSrcs.push(iframeUrl);
          if (iframeSrcs.length >= 3) break;
        } catch { /**/ }
      }

      for (const iframeUrl of iframeSrcs) {
        const iframeHtml = await fetchHtml(iframeUrl, 5_000, url);
        if (!iframeHtml || isBotChallengePage(iframeHtml)) continue;
        const found = extractStreams(iframeHtml, iframeUrl, source.id)
          .filter(s => (s.type === "hls" || s.type === "dash") && !isJunkEmbedUrl(s.url));
        deepStreams.push(...found);
        // Check player scripts inside the iframe too
        for (const sm of iframeHtml.matchAll(SCRIPT_SRC_RE())) {
          if (!/(?:player|stream|config|jwplayer|video|hls|live)/i.test(sm[1])) continue;
          try {
            const sUrl = new URL(sm[1], iframeUrl).toString();
            const sHtml = await fetchHtml(sUrl, 3_000, iframeUrl);
            if (sHtml) {
              deepStreams.push(...extractStreams(sHtml, sUrl, source.id)
                .filter(s => s.type === "hls" || s.type === "dash"));
            }
          } catch { /**/ }
        }
      }

      const all = [...deepStreams, ...direct];
      if (all.length > 0) return { sourceId: source.id, url, streams: all };
    }
  }
  return { sourceId: source.id, url: null, streams: [] };
}

async function scrapeStreams(slugs, primarySlug) {
  process.stdout.write(`  Searching ${STREAM_SOURCES.length} sites for "${primarySlug}"...\n`);

  const settled = await Promise.allSettled(
    STREAM_SOURCES.map(source => scrapeStreamForSource(source, slugs)),
  );

  const seen = new Set();
  const streams = [];

  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    const { sourceId, url, streams: found } = r.value;
    if (found.length > 0) process.stdout.write(`    [${sourceId}] found ${found.length} streams at ${url}\n`);
    for (const s of found) {
      if (!seen.has(s.url)) { seen.add(s.url); streams.push(s); }
    }
  }

  return {
    primarySlug,
    streams,
    primary: streams.find(s => s.type === "hls") ?? streams.find(s => s.type === "embed") ?? streams[0] ?? null,
  };
}

// ─── Print helpers ─────────────────────────────────────────────────────────────

function printMatches(matches) {
  console.log("\n" + "─".repeat(72));
  console.log("GACONDO — Today's & Tomorrow's Soccer Matches");
  console.log("Source: TheSportsDB (free public API)");
  console.log(`Fetched at: ${new Date().toISOString()}`);
  console.log(`Total: ${matches.length} matches`);
  console.log("─".repeat(72));

  if (matches.length === 0) { console.log("No matches found."); return; }

  for (const m of matches) {
    const live = m.isLive ? " [LIVE]" : "";
    const time = m.time ? ` @ ${m.time} UTC` : "";
    const status = m.status ? ` (${m.status})` : "";
    console.log(`\n  ${m.name}${live}${time}${status}`);
    console.log(`    Competition: ${m.competition}`);
    console.log(`    Slugs to try: ${m.slugs.slice(0, 3).join(", ")}`);
  }
}

function printStreams(result) {
  console.log("\n" + "─".repeat(72));
  console.log(`GACONDO — Streams for "${result.primarySlug}"`);
  console.log(`Total streams found: ${result.streams.length}`);
  console.log(`Primary: ${result.primary?.url ?? "none"} (${result.primary?.type ?? "-"})`);
  console.log("─".repeat(72));

  if (result.streams.length === 0) { console.log("No streams found."); return; }

  for (const s of result.streams) {
    console.log(`  [${s.type.toUpperCase().padEnd(5)}] [${s.sourceId}]  ${s.url}`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const inputSlug = process.argv[2];

if (inputSlug) {
  // Stream mode — find streams for a given slug (generating team name variants)
  let slugVariants = [inputSlug];
  if (inputSlug.includes("-vs-")) {
    const parts = inputSlug.split("-vs-");
    const homes = teamSlugVariants(parts[0].replace(/-/g, " "));
    const aways = teamSlugVariants(parts[1].replace(/-/g, " "));
    const combined = [];
    for (const h of homes) {
      for (const a of aways) {
        combined.push(`${h}-vs-${a}`);
      }
    }
    slugVariants = [...new Set([inputSlug, ...combined])];
  }
  scrapeStreams(slugVariants, inputSlug).then(printStreams).catch(console.error);
} else {
  // Match listing mode — fetch today's matches from TheSportsDB
  console.log("Fetching today's & tomorrow's soccer matches from TheSportsDB...\n");
  fetchTodayMatches()
    .then(matches => {
      printMatches(matches);
      // Show how to fetch streams for first live/upcoming match
      if (matches.length > 0) {
        const first = matches[0];
        console.log(`\nTip: Run 'node GACONDO/run.mjs ${first.slugs[0]}' to find streams for the first match.`);
      }
    })
    .catch(console.error);
}
