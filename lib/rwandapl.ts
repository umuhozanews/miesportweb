import { Agent, fetch as undiciFetch } from "undici";
import { unstable_cache as cache } from "next/cache";

const BASE = "https://api.sofascore.com/api/v1";
export const UID = 10608; // Rwanda National League

const agent = new Agent({ connect: { rejectUnauthorized: false } });
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  referer: "https://www.sofascore.com/",
  origin: "https://www.sofascore.com",
};

async function rp<T>(path: string): Promise<T | null> {
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

/* ── Types ── */
export type RPSeason = { id: number; name: string; year: string };
export type RPTeam  = { id: number; name: string; shortName?: string };
export type RPScore = { current?: number; display?: number };
export type RPStatus = { code: number; description: string; type: string };
export type RPRound  = { round: number; name?: string };

export type RPEvent = {
  id: number;
  homeTeam: RPTeam;
  awayTeam: RPTeam;
  homeScore: RPScore;
  awayScore: RPScore;
  status: RPStatus;
  startTimestamp: number;
  tournament?: { id: number; name: string };
  roundInfo?: RPRound;
  winnerCode?: number;
};

export type RPStandingRow = {
  team: RPTeam;
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
  promotion?: { text: string; id: number };
};

export type RPTopPlayer = {
  player: { id: number; name: string };
  team: RPTeam;
  statistics: { goals?: number; assists?: number; rating?: number };
};

/* ── Seasons ── */
export const getRPSeasons = cache(
  async (): Promise<RPSeason[]> => {
    const d = await rp<{ seasons: RPSeason[] }>(`/unique-tournament/${UID}/seasons`);
    return d?.seasons ?? [];
  },
  ["rp-seasons"],
  { revalidate: 86400 },
);

/* ── Matches ── */
export const getRPMatchesByRound = cache(
  async (sid: number, round: number): Promise<RPEvent[]> => {
    const d = await rp<{ events: RPEvent[] }>(`/unique-tournament/${UID}/season/${sid}/events/round/${round}`);
    return d?.events ?? [];
  },
  ["rp-matches-round"],
  { revalidate: 60 },
);

export const getRPRecentMatches = cache(
  async (sid: number): Promise<RPEvent[]> => {
    const d = await rp<{ events: RPEvent[] }>(`/unique-tournament/${UID}/season/${sid}/events/last/0`);
    return d?.events ?? [];
  },
  ["rp-recent"],
  { revalidate: 120 },
);

export const getRPNextMatches = cache(
  async (sid: number): Promise<RPEvent[]> => {
    const d = await rp<{ events: RPEvent[] }>(`/unique-tournament/${UID}/season/${sid}/events/next/0`);
    return d?.events ?? [];
  },
  ["rp-next"],
  { revalidate: 60 },
);

/* ── Standings ── */
const _getRPStandings = cache(
  async (sid: number, type: string): Promise<RPStandingRow[]> => {
    const d = await rp<{ standings: Array<{ rows: RPStandingRow[] }> }>(
      `/unique-tournament/${UID}/season/${sid}/standings/${type}`,
    );
    return d?.standings?.[0]?.rows ?? [];
  },
  ["rp-standings"],
  { revalidate: 300 },
);

export const getRPStandings = (sid: number, type: "total" | "home" | "away" = "total") =>
  _getRPStandings(sid, type);

/* ── Team form (calculated from last 2 pages of events) ── */
export const getRPTeamForms = cache(
  async (sid: number): Promise<Record<number, string[]>> => {
    const [p0, p1] = await Promise.all([
      rp<{ events: RPEvent[] }>(`/unique-tournament/${UID}/season/${sid}/events/last/0`),
      rp<{ events: RPEvent[] }>(`/unique-tournament/${UID}/season/${sid}/events/last/1`),
    ]);
    const all = [...(p0?.events ?? []), ...(p1?.events ?? [])]
      .filter((e) => e.status.type === "finished")
      .sort((a, b) => b.startTimestamp - a.startTimestamp);

    const forms: Record<number, string[]> = {};
    for (const e of all) {
      const hs = e.homeScore.current ?? 0;
      const as_ = e.awayScore.current ?? 0;
      const hRes = hs > as_ ? "W" : hs < as_ ? "L" : "D";
      const aRes = hs > as_ ? "L" : hs < as_ ? "W" : "D";
      if (!forms[e.homeTeam.id]) forms[e.homeTeam.id] = [];
      if (!forms[e.awayTeam.id]) forms[e.awayTeam.id] = [];
      if (forms[e.homeTeam.id].length < 5) forms[e.homeTeam.id].push(hRes);
      if (forms[e.awayTeam.id].length < 5) forms[e.awayTeam.id].push(aRes);
    }
    return forms;
  },
  ["rp-team-forms"],
  { revalidate: 300 },
);

/* ── Top players ── */
export const getRPTopPlayers = cache(
  async (sid: number): Promise<{ goals: RPTopPlayer[]; assists: RPTopPlayer[]; rating: RPTopPlayer[] }> => {
    const d = await rp<{ topPlayers: Record<string, RPTopPlayer[]> }>(
      `/unique-tournament/${UID}/season/${sid}/top-players/overall`,
    );
    const tp = d?.topPlayers ?? {};
    return { goals: tp.goals ?? [], assists: tp.assists ?? [], rating: tp.rating ?? [] };
  },
  ["rp-top-players"],
  { revalidate: 3600 },
);

/* ── Helpers ── */
export function teamImg(id: number) { return `${BASE}/team/${id}/image`; }
export function tournamentImg() { return `${BASE}/unique-tournament/${UID}/image`; }

export function fmtRPDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" });
}
export function fmtRPTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}
