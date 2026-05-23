import { getOriginalStreamUrl } from "./hlsProxy";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const REFERER = "https://www.soccertvhd.com";

// ─── Individual checks ────────────────────────────────────────────────────────

async function checkHls(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: {
        accept: "application/vnd.apple.mpegurl,application/x-mpegURL,*/*",
        referer: REFERER,
        origin: REFERER,
        "user-agent": UA,
      },
    });
    if (!r.ok) return false;
    const text = await r.text();
    return text.includes("#EXTM3U");
  } catch {
    return false;
  }
}

async function checkEmbed(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      method: "HEAD",
      headers: { "user-agent": UA, referer: REFERER },
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function checkStream(server: string): Promise<boolean> {
  const isProxy = server.startsWith("/api/hls");

  if (isProxy) {
    const original = getOriginalStreamUrl(server);
    if (original) return checkHls(original);
    return false;
  }

  // Absolute HLS/DASH
  if (/\.m3u8(?:\?|$)/i.test(server) || /\.mpd(?:\?|$)/i.test(server)) {
    return checkHls(server);
  }

  // Embed iframe URL — verify the page is reachable
  return checkEmbed(server);
}

// ─── Batch verify ─────────────────────────────────────────────────────────────

/**
 * Verify all stream URLs in parallel.
 * Returns streams sorted: working first, dead removed entirely.
 * Falls back to the full unverified list if every check fails (so users
 * always see something rather than an empty server list).
 */
export async function filterWorkingStreams(servers: string[]): Promise<string[]> {
  if (servers.length === 0) return [];

  const results = await Promise.allSettled(
    servers.map((s) => checkStream(s)),
  );

  const working: string[] = [];
  const failing: string[] = [];

  results.forEach((r, i) => {
    const ok = r.status === "fulfilled" && r.value === true;
    if (ok) working.push(servers[i]);
    else failing.push(servers[i]);
  });

  // If nothing verified (e.g. all CDN blocks from CF Worker IPs), return
  // full list so the user can still try streams manually.
  return working.length > 0 ? working : servers;
}
