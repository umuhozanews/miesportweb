import { unstable_cache as cache } from "next/cache";

const ESPN_V2 = "https://site.api.espn.com/apis/v2/sports/soccer";
const ESPN_V1 = "https://site.api.espn.com/apis/site/v2/sports/soccer";

async function espnFetch<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return r.json() as T;
  } catch { return null; }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type EspnTeam = {
  id: string;
  name: string;
  abbreviation: string;
  logo: string; // https://a.espncdn.com/i/teamlogos/soccer/500/{id}.png
};

export type EspnStandingRow = {
  team: EspnTeam;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  noteText?: string;
  noteColor?: string;
};

export type EspnGroup = {
  name: string;
  rows: EspnStandingRow[];
};

export type EspnEvent = {
  id: string;
  homeTeam: EspnTeam;
  awayTeam: EspnTeam;
  homeScore: number | null;
  awayScore: number | null;
  startTimestamp: number; // unix seconds
  status: "scheduled" | "live" | "finished";
  statusDetail: string;
  groupName?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function espnTeamLogo(id: string): string {
  return `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTeam(t: any): EspnTeam {
  return {
    id: t.id,
    name: t.displayName ?? t.name ?? "",
    abbreviation: t.abbreviation ?? "",
    logo: t.logos?.[0]?.href ?? espnTeamLogo(t.id),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function statVal(stats: any[], name: string): number {
  return stats.find((s: { name: string; value: number }) => s.name === name)?.value ?? 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEntry(entry: any): EspnStandingRow {
  const stats = entry.stats ?? [];
  const gp = statVal(stats, "gamesPlayed");
  const pts = statVal(stats, "points");
  const w = statVal(stats, "wins");
  const d = statVal(stats, "ties");
  const l = statVal(stats, "losses");
  const gf = statVal(stats, "pointsFor");
  const ga = statVal(stats, "pointsAgainst");
  const rank = statVal(stats, "rank") || 0;
  return {
    team: parseTeam(entry.team),
    position: rank,
    played: gp,
    wins: w,
    draws: d,
    losses: l,
    goalsFor: gf,
    goalsAgainst: ga,
    points: pts,
    noteText: entry.note?.description,
    noteColor: entry.note?.color,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEvent(ev: any): EspnEvent | null {
  const comp = ev.competitions?.[0];
  if (!comp) return null;
  const home = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "home");
  const away = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "away");
  if (!home || !away) return null;
  const statusName: string = comp.status?.type?.name ?? "STATUS_SCHEDULED";
  const status = statusName === "STATUS_FULL_TIME" || statusName === "STATUS_FINAL" || comp.status?.type?.completed
    ? "finished"
    : statusName === "STATUS_IN_PROGRESS" || statusName === "STATUS_HALFTIME"
    ? "live"
    : "scheduled";
  const date = new Date(ev.date ?? 0);
  return {
    id: ev.id,
    homeTeam: parseTeam(home.team),
    awayTeam: parseTeam(away.team),
    homeScore: status !== "scheduled" ? Number(home.score) : null,
    awayScore: status !== "scheduled" ? Number(away.score) : null,
    startTimestamp: Math.floor(date.getTime() / 1000),
    status,
    statusDetail: statusName,
    groupName: comp.groups?.[0]?.shortName,
  };
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// Range scoreboard: ESPN accepts dates=YYYYMMDD-YYYYMMDD → single request instead of N daily requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchESPNRange(league: string, start: Date, end: Date): Promise<EspnEvent[]> {
  const url = `${ESPN_V1}/${league}/scoreboard?dates=${dateStr(start)}-${dateStr(end)}&limit=100`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = await espnFetch<any>(url);
  if (!d?.events) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (d.events as any[]).flatMap((ev) => {
    const parsed = parseEvent(ev);
    return parsed ? [parsed] : [];
  });
}

// ── Standings ─────────────────────────────────────────────────────────────────

export const getESPNWCStandings = cache(
  async (): Promise<EspnGroup[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = await espnFetch<any>(`${ESPN_V2}/fifa.world/standings?season=2026`);
    if (!d?.children?.length) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return d.children.map((child: any) => ({
      name: child.name ?? child.abbreviation ?? "Group",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows: (child.standings?.entries ?? []).map((e: any) => parseEntry(e)),
    }));
  },
  ["espn-wc-standings"],
  { revalidate: 180 },
);

export const getESPNPLStandings = cache(
  async (): Promise<EspnStandingRow[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = await espnFetch<any>(`${ESPN_V2}/eng.1/standings`);
    if (!d?.children?.[0]) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (d.children[0].standings?.entries ?? []).map((e: any) => parseEntry(e));
  },
  ["espn-pl-standings"],
  { revalidate: 300 },
);

// ── Events (scoreboard) ───────────────────────────────────────────────────────

export const getESPNPLFixtures = cache(
  async (): Promise<EspnEvent[]> => {
    const start = new Date();
    const end = new Date();
    end.setUTCDate(end.getUTCDate() + 13); // 14-day window ahead
    const events = await fetchESPNRange("eng.1", start, end);
    const seen = new Set<string>();
    return events.filter((e) => {
      if (seen.has(e.id) || e.status === "finished") return false;
      seen.add(e.id);
      return true;
    }).sort((a, b) => a.startTimestamp - b.startTimestamp);
  },
  ["espn-pl-fixtures"],
  { revalidate: 300 },
);

export const getESPNPLResults = cache(
  async (): Promise<EspnEvent[]> => {
    const end = new Date();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 20); // last 3 weeks
    const events = await fetchESPNRange("eng.1", start, end);
    const seen = new Set<string>();
    return events.filter((e) => {
      if (seen.has(e.id) || e.status !== "finished") return false;
      seen.add(e.id);
      return true;
    }).sort((a, b) => b.startTimestamp - a.startTimestamp);
  },
  ["espn-pl-results"],
  { revalidate: 300 },
);

export const getESPNWCFixtures = cache(
  async (): Promise<EspnEvent[]> => {
    // Group stage: Jun 11 – Jul 2; Knockout: Jul 3 – Jul 19
    const start = new Date("2026-06-11");
    const end = new Date("2026-07-19");
    const events = await fetchESPNRange("fifa.world", start, end);
    const seen = new Set<string>();
    return events.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    }).sort((a, b) => a.startTimestamp - b.startTimestamp);
  },
  ["espn-wc-fixtures"],
  { revalidate: 600 },
);

export const getESPNWCResults = cache(
  async (): Promise<EspnEvent[]> => {
    const end = new Date();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 14); // last 2 weeks
    const events = await fetchESPNRange("fifa.world", start, end);
    const seen = new Set<string>();
    return events.filter((e) => {
      if (seen.has(e.id) || e.status !== "finished") return false;
      seen.add(e.id);
      return true;
    }).sort((a, b) => b.startTimestamp - a.startTimestamp);
  },
  ["espn-wc-results"],
  { revalidate: 300 },
);

// ── Leaders (top scorers / assists) ──────────────────────────────────────────

export type EspnLeaderEntry = {
  rank: number;
  value: number;
  athlete: { id: string; name: string; headshot?: string };
  team: EspnTeam;
};

export type EspnLeaders = {
  goals: EspnLeaderEntry[];
  assists: EspnLeaderEntry[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLeaderCategory(cat: any): EspnLeaderEntry[] {
  if (!cat?.leaders) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (cat.leaders as any[]).map((l, i) => ({
    rank: i + 1,
    value: l.value ?? 0,
    athlete: {
      id: l.athlete?.id ?? "",
      name: l.athlete?.displayName ?? l.athlete?.shortName ?? "",
      headshot: l.athlete?.headshot?.href,
    },
    team: parseTeam(l.team ?? {}),
  }));
}

export const getESPNLeaders = cache(
  async (league: string): Promise<EspnLeaders> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = await espnFetch<any>(`${ESPN_V1}/${league}/leaders`);
    const cats: EspnLeaderEntry[][] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list: any[] = d?.leaders ?? [];
    const goalsRaw = list.find((c: { name: string }) => c.name === "goals" || c.name === "goalsScoredAll");
    const assistsRaw = list.find((c: { name: string }) => c.name === "assists" || c.name === "assistsAll");
    return {
      goals: parseLeaderCategory(goalsRaw),
      assists: parseLeaderCategory(assistsRaw ?? list[1]),
    };
  },
  ["espn-leaders"],
  { revalidate: 3600 },
);

// ── Time helpers ──────────────────────────────────────────────────────────────

export function espnFmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

export function espnFmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}
