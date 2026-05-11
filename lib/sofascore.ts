import { Agent } from "undici";
import { unstable_cache as cache } from "next/cache";

const BASE = "https://api.sofascore.com/api/v1";
const agent = new Agent({ connect: { rejectUnauthorized: false } });

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  referer: "https://www.sofascore.com/",
  origin: "https://www.sofascore.com",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
};

export type Sport = "football" | "basketball" | "volleyball";

export type SfTeam = {
  id: number;
  name: string;
  slug: string;
  shortName?: string;
  nameCode?: string;
};

export type SfScore = {
  current?: number;
  display?: number;
  period1?: number;
  period2?: number;
  overtime?: number;
};

export type SfStatus = {
  code: number;
  description: string;
  type: "inprogress" | "finished" | "notstarted" | "postponed" | "canceled";
};

export type SfTournament = {
  id: number;
  name: string;
  slug: string;
  uniqueTournament?: { id: number; name: string; slug: string };
  category: { id: number; name: string; slug: string; alpha2?: string };
};

export type SfEvent = {
  id: number;
  homeTeam: SfTeam;
  awayTeam: SfTeam;
  homeScore: SfScore;
  awayScore: SfScore;
  status: SfStatus;
  startTimestamp: number;
  tournament: SfTournament;
  season?: { id: number; name: string; year?: string };
  roundInfo?: { round: number; name?: string };
};

export type SfTeamDetails = {
  id: number;
  name: string;
  slug: string;
  shortName?: string;
  nameCode?: string;
  country?: { name: string; alpha2: string };
  venue?: { name?: string; city?: { name: string } };
  manager?: { name: string };
  tournament?: SfTournament;
};

export type SfPlayer = {
  id: number;
  name: string;
  slug: string;
  position?: string;
  jerseyNumber?: string;
  dateOfBirthTimestamp?: number;
  country?: { name: string; alpha2: string };
  height?: number;
};

export type SfStandingRow = {
  team: SfTeam;
  position: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  scoresFor: number;
  scoresAgainst: number;
  points: number;
  promotion?: { text: string; id: string };
};

export type SfTopPlayer = {
  player: SfPlayer;
  team: SfTeam;
  statistics: {
    goals?: number;
    assists?: number;
    rating?: number;
    appearances?: number;
    yellowCards?: number;
    redCards?: number;
  };
};

async function sf<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatcher: agent as any,
      headers: HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as T;
  } catch {
    return null;
  }
}

export const getLiveEvents = cache(
  async (sport: Sport): Promise<SfEvent[]> => {
    const d = await sf<{ events: SfEvent[] }>(`/sport/${sport}/events/live`);
    return d?.events ?? [];
  },
  ["sf-live"],
  { revalidate: 30 },
);

export const getScheduledEvents = cache(
  async (sport: Sport, date: string): Promise<SfEvent[]> => {
    const d = await sf<{ events: SfEvent[] }>(`/sport/${sport}/scheduled-events/${date}`);
    return d?.events ?? [];
  },
  ["sf-scheduled"],
  { revalidate: 120 },
);

export const getTeam = cache(
  async (teamId: number): Promise<SfTeamDetails | null> => {
    const d = await sf<{ team: SfTeamDetails }>(`/team/${teamId}`);
    return d?.team ?? null;
  },
  ["sf-team"],
  { revalidate: 3600 },
);

export const getTeamFixtures = cache(
  async (teamId: number): Promise<SfEvent[]> => {
    const d = await sf<{ events: SfEvent[] }>(`/team/${teamId}/events/next/0`);
    return d?.events ?? [];
  },
  ["sf-team-fixtures"],
  { revalidate: 300 },
);

export const getTeamResults = cache(
  async (teamId: number): Promise<SfEvent[]> => {
    const d = await sf<{ events: SfEvent[] }>(`/team/${teamId}/events/last/0`);
    return (d?.events ?? []).reverse();
  },
  ["sf-team-results"],
  { revalidate: 300 },
);

export const getTeamPlayers = cache(
  async (teamId: number): Promise<Array<{ player: SfPlayer }>> => {
    const d = await sf<{ players: Array<{ player: SfPlayer }> }>(`/team/${teamId}/players`);
    return d?.players ?? [];
  },
  ["sf-team-players"],
  { revalidate: 86400 },
);

export const getTournamentSeasons = cache(
  async (uniqueTournamentId: number): Promise<Array<{ id: number; name: string; year: string }>> => {
    const d = await sf<{ seasons: Array<{ id: number; name: string; year: string }> }>(
      `/unique-tournament/${uniqueTournamentId}/seasons`,
    );
    return d?.seasons ?? [];
  },
  ["sf-seasons"],
  { revalidate: 86400 },
);

export async function getLatestSeasonId(uniqueTournamentId: number): Promise<number | null> {
  const seasons = await getTournamentSeasons(uniqueTournamentId);
  return seasons[0]?.id ?? null;
}

export const getStandings = cache(
  async (uniqueTournamentId: number, seasonId: number): Promise<SfStandingRow[]> => {
    const d = await sf<{ standings: Array<{ rows: SfStandingRow[] }> }>(
      `/unique-tournament/${uniqueTournamentId}/season/${seasonId}/standings/total`,
    );
    return d?.standings?.[0]?.rows ?? [];
  },
  ["sf-standings"],
  { revalidate: 900 },
);

export const getTournamentFixtures = cache(
  async (uniqueTournamentId: number, seasonId: number): Promise<SfEvent[]> => {
    const d = await sf<{ events: SfEvent[] }>(
      `/unique-tournament/${uniqueTournamentId}/season/${seasonId}/events/next/0`,
    );
    return d?.events ?? [];
  },
  ["sf-t-fixtures"],
  { revalidate: 300 },
);

export const getTournamentResults = cache(
  async (uniqueTournamentId: number, seasonId: number): Promise<SfEvent[]> => {
    const d = await sf<{ events: SfEvent[] }>(
      `/unique-tournament/${uniqueTournamentId}/season/${seasonId}/events/last/0`,
    );
    return (d?.events ?? []).reverse();
  },
  ["sf-t-results"],
  { revalidate: 300 },
);

export const getTopPlayers = cache(
  async (uniqueTournamentId: number, seasonId: number): Promise<{ goals: SfTopPlayer[]; assists: SfTopPlayer[]; rating: SfTopPlayer[] }> => {
    const d = await sf<{ topPlayers: Record<string, SfTopPlayer[]> }>(
      `/unique-tournament/${uniqueTournamentId}/season/${seasonId}/top-players/overall`,
    );
    const tp = d?.topPlayers ?? {};
    return { goals: tp.goals ?? [], assists: tp.assists ?? [], rating: tp.rating ?? [] };
  },
  ["sf-top-players"],
  { revalidate: 3600 },
);

export const searchAll = cache(
  async (query: string) => {
    const d = await sf<{
      results: Array<{
        type: string;
        entity: {
          id: number;
          name: string;
          slug: string;
          sport?: { slug: string };
          category?: { name: string };
        };
      }>;
    }>(`/search/all?q=${encodeURIComponent(query)}&page=0`);
    return d?.results ?? [];
  },
  ["sf-search"],
  { revalidate: 300 },
);

export function teamImg(id: number) {
  return `https://api.sofascore.com/api/v1/team/${id}/image`;
}

export function tournamentImg(id: number) {
  return `https://api.sofascore.com/api/v1/unique-tournament/${id}/image`;
}

export function playerImg(id: number) {
  return `https://api.sofascore.com/api/v1/player/${id}/image`;
}

export function fmtTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function fmtDateShort(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function statusLabel(s: SfStatus): string {
  if (s.type === "finished") return "FT";
  if (s.type === "notstarted") return "";
  if (s.type === "postponed") return "PPD";
  if (s.type === "canceled") return "CAN";
  return s.description ?? "Live";
}

export function groupByTournament(events: SfEvent[]) {
  const map = new Map<number, { label: string; categoryName: string; tournamentId: number; events: SfEvent[] }>();
  for (const e of events) {
    const uid = e.tournament.uniqueTournament?.id ?? e.tournament.id;
    if (!map.has(uid)) {
      map.set(uid, {
        label: e.tournament.name,
        categoryName: e.tournament.category.name,
        tournamentId: uid,
        events: [],
      });
    }
    map.get(uid)!.events.push(e);
  }
  return [...map.values()];
}
