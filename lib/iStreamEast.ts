import { Agent, fetch as undiciFetch } from "undici";

const SITE = "https://istreameast.is";
const agent = new Agent({ connect: { rejectUnauthorized: false } });
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await undiciFetch(url, {
      dispatcher: agent,
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        referer: SITE,
      },
    });
    if (!res.ok) return "";
    return res.text();
  } catch {
    return "";
  }
}

export type IStreamMatch = {
  slug: string;
  home: string; // slug form e.g. "espanyol"
  away: string; // slug form e.g. "athletic-bilbao"
};

// Scrape today's soccer schedule — returns list of match slugs
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

// Scrape a match page and return the embeddable server URLs (embedsports.top)
export async function scrapeMatchServers(slug: string): Promise<string[]> {
  const html = await fetchHtml(`${SITE}/links/${slug}`);
  if (!html) return [];

  const servers: string[] = [];

  // Main iframe player
  const main = html.match(/id=["']main-player["'][^>]*\bsrc=["'](https?:\/\/[^"']+)["']/i)?.[1];
  if (main) servers.push(main);

  // Backup data-src / data-url attributes (server 2, 3…)
  for (const [, url] of html.matchAll(/data-(?:src|url|stream)=["'](https?:\/\/[^"']+)["']/gi)) {
    if (!servers.includes(url)) servers.push(url);
  }

  return servers;
}
