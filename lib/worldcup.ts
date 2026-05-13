import { Agent, fetch as undiciFetch } from "undici";
import { unstable_cache as cache } from "next/cache";

const BASE = "https://api.sofascore.com/api/v1";
const UID = 16; // FIFA World Cup unique-tournament ID

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
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return res.json() as T;
  } catch {
    return null;
  }
}

/* ── Season mapping ── */
export const WC_SEASONS: Record<string, number> = {
  "2026": 58210, "2022": 41087, "2018": 15586, "2014": 7528,
  "2010": 2531,  "2006": 16,    "2002": 2636,  "1998": 1151,
  "1994": 17571, "1990": 17570, "1986": 17569, "1982": 17568,
  "1978": 17567, "1974": 17566, "1970": 17565, "1966": 17564,
  "1962": 17563, "1958": 17562, "1954": 17561, "1950": 40714,
  "1938": 17560, "1934": 17559, "1930": 40712,
};

export const WC_YEARS = Object.keys(WC_SEASONS).sort((a, b) => Number(b) - Number(a));

// Round sequences per era (actual round numbers from Sofascore API)
export const WC_ROUNDS: Record<string, number[]> = {
  "2026": [1, 2, 3, 6, 5, 27, 28, 50, 29],   // R32 is round 6 for 48-team format
  default: [1, 2, 3, 5, 27, 28, 50, 29],
};

export function getWCRounds(year: string): number[] {
  return WC_ROUNDS[year] ?? WC_ROUNDS.default;
}

export function seasonId(year: string): number | null {
  return WC_SEASONS[year] ?? null;
}

/* ── Types ── */
export type WCTeam  = { id: number; name: string; slug: string; nameCode?: string };
export type WCScore = { current?: number; display?: number; normaltime?: number };
export type WCStatus = { code: number; description: string; type: string };
export type WCRound  = { round: number; name?: string };

export type WCEvent = {
  id: number;
  slug?: string;
  customId?: string;
  homeTeam: WCTeam;
  awayTeam: WCTeam;
  homeScore: WCScore;
  awayScore: WCScore;
  status: WCStatus;
  startTimestamp: number;
  tournament: { id: number; name: string };
  roundInfo?: WCRound;
  winnerCode?: number;
  groupName?: string;
  isGroup?: boolean;
  hasGlobalHighlights?: boolean;
};

export type WCStandingRow = {
  team: WCTeam;
  position: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  scoresFor: number;
  scoresAgainst: number;
  points: number;
  scoreDiffFormatted?: string;
  descriptions?: Array<{ text: string; type: string }>;
};

export type WCGroup = {
  name: string;
  rows: WCStandingRow[];
};

export type WCTopPlayer = {
  player: { id: number; name: string; slug: string; position?: string };
  team: WCTeam;
  statistics: { goals?: number; assists?: number; rating?: number; appearances?: number };
};

export type WCSeasonInfo = {
  goals?: number;
  yellowCards?: number;
  redCards?: number;
  numberOfCompetitors?: number;
  hostCountries?: Array<{ name: string; alpha2?: string }>;
  notes?: string;
};

/* ── API functions ── */
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

// Fetch all knockout-round matches in one call (more reliable than events/last/0)
export const getWCKnockoutMatches = cache(
  async (sid: number): Promise<WCEvent[]> => {
    // Round numbers for all knockout stages (same for both 48-team and 32-team formats)
    const KNOCKOUT_ROUNDS = [6, 5, 27, 28, 50, 29]; // R32, R16, QF, SF, 3rd, Final
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

/* ── Helpers ── */
export function teamImg(id: number) { return `${BASE}/team/${id}/image`; }
export function playerImg(id: number) { return `${BASE}/player/${id}/image`; }
export function tournamentImg() { return `${BASE}/unique-tournament/${UID}/image`; }

export function sofascoreEventUrl(e: WCEvent): string {
  if (e.slug && e.customId) {
    return `https://www.sofascore.com/football/${e.slug}/${e.customId}#id:${e.id}`;
  }
  return `https://www.sofascore.com/football/tournament/world/world-championship/16`;
}

export function fmtWCDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" });
}
export function fmtWCTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}
export function fmtWCDateLong(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/* ── Round / stage helpers ── */

// Actual knockout round numbers used by Sofascore (all > 3)
const KNOCKOUT_ROUND_NAMES: Record<number, string> = {
  6: "Round of 32",
  5: "Round of 16",
  27: "Quarter-finals",
  28: "Semi-finals",
  29: "Final",
  50: "3rd Place",
};

export function roundLabel(round: WCRound | undefined): string {
  if (!round) return "Match";
  if (round.name) return round.name;
  if (KNOCKOUT_ROUND_NAMES[round.round]) return KNOCKOUT_ROUND_NAMES[round.round];
  return `Round ${round.round}`;
}

export function knockoutStageName(round: WCRound | undefined): string | null {
  if (!round) return null;
  return round.name ?? KNOCKOUT_ROUND_NAMES[round.round] ?? null;
}

// Rounds 1-3 are always group stage; anything higher is knockout
export function isKnockout(round: WCRound | undefined): boolean {
  if (!round) return false;
  return round.round > 3;
}

export function groupName(tournamentName: string): string {
  const m = tournamentName.match(/Group ([A-Z])/i);
  return m ? `Group ${m[1].toUpperCase()}` : tournamentName;
}

// Client-safe round label for the match navigator
export function wcRoundNavLabel(round: number): string {
  if (round <= 3) return `Group Stage · Round ${round}`;
  return KNOCKOUT_ROUND_NAMES[round] ?? `Round ${round}`;
}
