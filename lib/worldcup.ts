import { Agent, fetch as undiciFetch } from "undici";
import { unstable_cache as cache } from "next/cache";

const BASE = "https://api.sofascore.com/api/v1";
const UID = 16; // FIFA World Cup unique-tournament ID

const agent = new Agent({ connect: { rejectUnauthorized: false } });
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  referer: "https://www.sofascore.com/",
  origin: "https://www.sofascore.com",
};

async function wc<T>(path: string): Promise<T | null> {
  try {
    const res = await undiciFetch(`${BASE}${path}`, {
      dispatcher: agent,
      headers: HEADERS,
      cache: "no-store",
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

export function seasonId(year: string): number | null {
  return WC_SEASONS[year] ?? null;
}

/* ── Types ── */
export type WCTeam  = { id: number; name: string; slug: string };
export type WCScore = { current?: number; display?: number };
export type WCStatus = { code: number; description: string; type: string };
export type WCRound  = { round: number; name?: string };

export type WCEvent = {
  id: number;
  homeTeam: WCTeam;
  awayTeam: WCTeam;
  homeScore: WCScore;
  awayScore: WCScore;
  status: WCStatus;
  startTimestamp: number;
  tournament: { id: number; name: string };
  roundInfo?: WCRound;
  winnerCode?: number;
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
  player: { id: number; name: string };
  team: WCTeam;
  statistics: { goals?: number; assists?: number; rating?: number };
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
export function tournamentImg() { return `${BASE}/unique-tournament/${UID}/image`; }

export function fmtWCDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" });
}
export function fmtWCTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}
export function fmtWCDateLong(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/* ── Knockout stage detection ── */
const KNOCKOUT_NAMES: Record<number, string> = {
  4: "Round of 32", 5: "Round of 16",
  27: "Quarter-finals", 28: "Semi-finals", 29: "Final", 50: "3rd Place",
};

export function knockoutStageName(round: WCRound | undefined): string | null {
  if (!round) return null;
  if (round.name) return round.name;
  return KNOCKOUT_NAMES[round.round] ?? null;
}

export function isKnockout(round: WCRound | undefined): boolean {
  if (!round) return false;
  return round.round > 3 || !!round.name;
}

export function groupName(tournamentName: string): string {
  const m = tournamentName.match(/Group ([A-Z])/i);
  return m ? `Group ${m[1].toUpperCase()}` : tournamentName;
}
