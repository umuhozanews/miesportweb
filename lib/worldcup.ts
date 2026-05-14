import "server-only";
import { Agent, fetch as undiciFetch } from "undici";
import { unstable_cache as cache } from "next/cache";

// Re-export everything client-safe so existing server-component imports keep working
export * from "./worldcup-client";
import type { WCEvent, WCStandingRow, WCGroup, WCTopPlayer, WCSeasonInfo } from "./worldcup-client";

const BASE = "https://api.sofascore.com/api/v1";
const UID = 16;

const agent = new Agent({ connect: { rejectUnauthorized: false } });
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  "accept-encoding": "gzip, deflate, br",
  referer: "https://www.sofascore.com/",
  origin: "https://www.sofascore.com",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "cache-control": "no-cache",
  pragma: "no-cache",
};

async function wc<T>(path: string): Promise<T | null> {
  try {
    const res = await undiciFetch(`${BASE}${path}`, {
      dispatcher: agent,
      headers: HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) return null;
    return res.json() as T;
  } catch {
    return null;
  }
}

/* ── Cached API functions (server-only) ── */

export const getWCMatchesByRound = cache(
  async (sid: number, round: number): Promise<WCEvent[]> => {
    const d = await wc<{ events: WCEvent[] }>(`/unique-tournament/${UID}/season/${sid}/events/round/${round}`);
    return d?.events ?? [];
  },
  ["wc-matches-round"],
  { revalidate: 60 },
);

export const getWCRecentMatches = cache(
  async (sid: number): Promise<WCEvent[]> => {
    const d = await wc<{ events: WCEvent[] }>(`/unique-tournament/${UID}/season/${sid}/events/last/0`);
    return d?.events ?? [];
  },
  ["wc-recent"],
  { revalidate: 120 },
);

export const getWCNextMatches = cache(
  async (sid: number): Promise<WCEvent[]> => {
    const d = await wc<{ events: WCEvent[] }>(`/unique-tournament/${UID}/season/${sid}/events/next/0`);
    return d?.events ?? [];
  },
  ["wc-next"],
  { revalidate: 60 },
);

export const getWCStandings = cache(
  async (sid: number): Promise<WCGroup[]> => {
    const d = await wc<{ standings: Array<{ name: string; rows: WCStandingRow[] }> }>(
      `/unique-tournament/${UID}/season/${sid}/standings/total`,
    );
    return d?.standings ?? [];
  },
  ["wc-standings"],
  { revalidate: 300 },
);

export const getWCSeasonInfo = cache(
  async (sid: number): Promise<WCSeasonInfo | null> => {
    const d = await wc<{ info: WCSeasonInfo }>(`/unique-tournament/${UID}/season/${sid}/info`);
    return d?.info ?? null;
  },
  ["wc-season-info"],
  { revalidate: 3600 },
);

export const getWCKnockoutMatches = cache(
  async (sid: number): Promise<WCEvent[]> => {
    const KNOCKOUT_ROUNDS = [6, 5, 27, 28, 50, 29];
    const results = await Promise.all(
      KNOCKOUT_ROUNDS.map((r) =>
        wc<{ events: WCEvent[] }>(`/unique-tournament/${UID}/season/${sid}/events/round/${r}`)
      )
    );
    return results.flatMap((d) => d?.events ?? []);
  },
  ["wc-knockout-matches"],
  { revalidate: 60 },
);

export const getWCTopPlayers = cache(
  async (sid: number): Promise<{ goals: WCTopPlayer[]; assists: WCTopPlayer[]; rating: WCTopPlayer[] }> => {
    const d = await wc<{ topPlayers: Record<string, WCTopPlayer[]> }>(
      `/unique-tournament/${UID}/season/${sid}/top-players/overall`,
    );
    const tp = d?.topPlayers ?? {};
    return { goals: tp.goals ?? [], assists: tp.assists ?? [], rating: tp.rating ?? [] };
  },
  ["wc-top-players"],
  { revalidate: 3600 },
);
