const SITE_ORIGIN = "https://www.soccertvhd.com";
const HOME_URL = "https://www.soccertvhd.com/";
const WIDGET_ID_PATTERN = /elfsight-app-([a-f0-9-]{36}|[a-z0-9-]+)/i;

const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

function pickUA() {
  return UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
}

async function fetchText(url, timeoutMs = 8000) {
  const response = await fetch(url, {
    headers: { "user-agent": pickUA() },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "user-agent": pickUA(), accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json();
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#038;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

async function main() {
  const matches = [];

  // 1. Goal.com Schedule
  console.error("Scraping Goal.com...");
  try {
    const goalHtml = await fetchText("https://www.goal.com/en/live-scores");
    const jsonLdMatches = goalHtml.match(/<script type="application\/ld\+json"[^>]*>([\s\S]+?)<\/script>/gi);
    if (jsonLdMatches) {
      jsonLdMatches.forEach(scriptTag => {
        try {
          const jsonStr = scriptTag.replace(/<script[^>]*>|<\/script>/gi, "").trim();
          const data = JSON.parse(jsonStr);
          if (data["@type"] === "SportsEvent") {
            matches.push({
              name: data.name,
              start: data.startDate,
              link: data.url,
              logo: data.homeTeam?.logo || null,
              source: "goal_com"
            });
          }
        } catch { }
      });
    }
  } catch (e) {
    console.error("Goal.com failed:", e.message);
  }

  // 2. SoccerTVHD Streams
  console.error("Scraping SoccerTVHD...");
  let stvPosts = [];
  try {
    stvPosts = await fetchJson(`${SITE_ORIGIN}/wp-json/wp/v2/posts?search=vs&per_page=50`);
  } catch (e) {
    console.error("SoccerTVHD API failed:", e.message);
  }

  // 3. Linking
  if (matches.length > 0 && stvPosts.length > 0) {
    matches.forEach(m => {
      const matchName = m.name.toLowerCase();
      const stvMatch = stvPosts.find(sm => {
        const smName = sm.title.rendered.toLowerCase();
        const teams = matchName.split(/\s+vs\s+/);
        return teams.every(t => smName.includes(t.trim()));
      });
      if (stvMatch) {
        m.streamLink = stvMatch.link;
        m.source = "hybrid_goal_stv";
      }
    });
  }

  // 4. Add direct STV matches that weren't in Goal.com
  stvPosts.forEach(sm => {
    const smName = decodeHtml(sm.title.rendered);
    if (!matches.some(m => m.name === smName)) {
      matches.push({
        name: smName,
        start: sm.date,
        link: sm.link,
        streamLink: sm.link,
        source: "soccertvhd_direct"
      });
    }
  });

  console.log(JSON.stringify({
    scrapedAt: new Date().toISOString(),
    count: matches.length,
    matches
  }, null, 2));
}

main();
