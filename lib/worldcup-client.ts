// Client-safe exports — no undici, no next/cache, no Node.js built-ins.
// Server components can import from here too; lib/worldcup.ts re-exports everything.

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

export const WC_ROUNDS: Record<string, number[]> = {
  "2026": [1, 2, 3, 6, 5, 27, 28, 50, 29],
  default: [1, 2, 3, 5, 27, 28, 50, 29],
};

export function getWCRounds(year: string): number[] {
  return WC_ROUNDS[year] ?? WC_ROUNDS.default;
}

export function seasonId(year: string): number | null {
  return WC_SEASONS[year] ?? null;
}

/* ── Image helpers ── */
const BASE = "https://api.sofascore.com/api/v1";
const UID  = 16;

export function teamImg(id: number)   { return `${BASE}/team/${id}/image`; }
export function playerImg(id: number) { return `${BASE}/player/${id}/image`; }
export function tournamentImg()        { return `${BASE}/unique-tournament/${UID}/image`; }

export function sofascoreEventUrl(e: WCEvent): string {
  if (e.slug && e.customId) {
    return `https://www.sofascore.com/football/${e.slug}/${e.customId}#id:${e.id}`;
  }
  return `https://www.sofascore.com/football/tournament/world/world-championship/16`;
}

/* ── Date / time formatters ── */
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

export function isKnockout(round: WCRound | undefined): boolean {
  if (!round) return false;
  return round.round > 3;
}

export function groupName(tournamentName: string): string {
  const m = tournamentName.match(/Group ([A-Z])/i);
  return m ? `Group ${m[1].toUpperCase()}` : tournamentName;
}

export function wcRoundNavLabel(round: number): string {
  if (round <= 3) return `Group Stage · Round ${round}`;
  return KNOCKOUT_ROUND_NAMES[round] ?? `Round ${round}`;
}
