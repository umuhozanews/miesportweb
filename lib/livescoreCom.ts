import { Agent } from "undici";
import { unstable_cache as cache } from "next/cache";

const BASE = "https://mev-api.live-lsm.ls-g.net";
const EAT_OFFSET = 2; // Rwanda / East Africa Time = UTC+2
const agent = new Agent({ connect: { rejectUnauthorized: false } });

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://www.livescore.com/",
  Origin: "https://www.livescore.com",
};

export type LsSport = "soccer" | "basketball" | "volleyball" | "cricket" | "hockey";

export function toApiSport(sport: "football" | "basketball" | "volleyball"): LsSport {
  if (sport === "football") return "soccer";
  return sport;
}

/* ─── Core types ─── */

export type LsTeam = {
  ID: string;
  Nm: string;
  Img: string;
  Abr?: string;
  Fc?: string;
};

export type LsEvent = {
  Eid: string;
  T1: LsTeam[];
  T2: LsTeam[];
  Tr1?: string;
  Tr2?: string;
  Trh1?: string;
  Trh2?: string;
  Eps: string;    // "NS" | "FT" | "HT" | "AET" | "Pen" | "45+2'" | "67'" etc.
  Esid: number;   // 1=NS, 2-4=live, 6=FT, 10+=abandoned
  Esd: number;    // YYYYMMDDHHMMSS in EAT timezone
  ErnInf?: string;
  /** Embedded competition info — present in team and competition event APIs */
  Stg?: {
    Sid: string;
    Snm: string;
    Cnm: string;
    Ccd?: string;
    CompId: string;
    badgeUrl?: string;
  };
};

export type LsStage = {
  Sid: string;
  Snm: string;
  Cnm: string;
  Ccd: string;
  CompId: string;
  CompUrlName?: string;
  badgeUrl: string;
  Events: LsEvent[];
};

export type LsTeamDetail = {
  ID: string;
  Nm: string;
  Img: string;
  Abr?: string;
  Ccd?: string;
  Cnm?: string;
  CoachNm?: string;
};

export type LsTableRow = {
  Eid: string;    // Team ID
  Rnk: number;   // Position
  Pld: number;   // Played
  W: number;     // Won
  D: number;     // Drawn
  L: number;     // Lost
  GF: number;    // Goals For
  GA: number;    // Goals Against
  GD?: number;   // Goal Difference
  Pts: number;   // Points
  Tnm: string;   // Team name
  TImg: string;  // Team image filename
  Abr?: string;
};

export type LsTable = {
  LId?: string;
  Snm?: string;
  badgeUrl?: string;
  L: LsTableRow[];
};

/* ─── Internal fetch helpers ─── */

async function lsFetch(date: string, sport: LsSport = "soccer"): Promise<{ Stages: LsStage[] } | null> {
  const d = date.replace(/-/g, "");
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await fetch(`${BASE}/v1/api/app/date/${sport}/${d}/${EAT_OFFSET}`, {
      ...({ dispatcher: agent } as any),
      headers: HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ Stages: LsStage[] }>;
  } catch {
    return null;
  }
}

async function lsFetchRaw<T>(path: string): Promise<T | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await fetch(`${BASE}${path}`, {
      ...({ dispatcher: agent } as any),
      headers: HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as T;
  } catch {
    return null;
  }
}

/* ─── Date-based scores ─── */

export const getLsStages = cache(
  async (date: string, sport: LsSport = "soccer"): Promise<LsStage[]> => {
    const d = await lsFetch(date, sport);
    return d?.Stages ?? [];
  },
  ["ls-stages"],
  { revalidate: 30 },
);

/* ─── Team API ─── */

export const getLsTeam = cache(
  async (teamId: string): Promise<LsTeamDetail | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = await lsFetchRaw<any>(`/v1/api/app/team/${teamId}`);
    return d?.Team ?? d ?? null;
  },
  ["ls-team"],
  { revalidate: 3600 },
);

export const getLsTeamEvents = cache(
  async (teamId: string, type: "fix" | "res"): Promise<LsEvent[]> => {
    const d = await lsFetchRaw<{ Events?: LsEvent[] }>(`/v1/api/app/team/${type}/${teamId}/0/${EAT_OFFSET}`);
    return d?.Events ?? [];
  },
  ["ls-team-events"],
  { revalidate: 120 },
);

/* ─── Competition API ─── */

const _getRawCompEvents = cache(
  async (stageId: string, type: "fix" | "res"): Promise<(LsStage & { Events: LsEvent[] }) | null> => {
    return lsFetchRaw<LsStage & { Events: LsEvent[] }>(`/v1/api/app/comp/${type}/${stageId}/0/${EAT_OFFSET}`);
  },
  ["ls-comp-raw"],
  { revalidate: 120 },
);

export async function getLsCompEvents(stageId: string, type: "fix" | "res"): Promise<LsEvent[]> {
  const d = await _getRawCompEvents(stageId, type);
  return d?.Events ?? [];
}

/** Returns competition name, country and badge from the first available event batch */
export async function getLsCompMeta(stageId: string): Promise<{ name: string; country: string; badge: string }> {
  const [fix, res] = await Promise.all([
    _getRawCompEvents(stageId, "fix"),
    _getRawCompEvents(stageId, "res"),
  ]);
  const d = (fix?.Snm ? fix : null) ?? (res?.Snm ? res : null);
  return {
    name: d?.Snm ?? `Competition`,
    country: d?.Cnm ?? "",
    badge: d?.badgeUrl ?? "",
  };
}

export const getLsCompStandings = cache(
  async (stageId: string): Promise<{ tables: LsTable[]; stageName: string }> => {
    const d = await lsFetchRaw<{ Tables?: LsTable[]; Snm?: string }>(`/v1/api/app/comp/table/${stageId}/${EAT_OFFSET}`);
    return { tables: d?.Tables ?? [], stageName: d?.Snm ?? "" };
  },
  ["ls-comp-standings"],
  { revalidate: 300 },
);

/* ─── Search ─── */

export type LsSearchTeam = {
  Sid: string;
  Nm: string;
  Img?: string;
  Ccd?: string;
  Cnm?: string;
};

export type LsSearchComp = {
  Sid: string;    // Stage ID
  Nm: string;
  CompId?: string;
  Ccd?: string;
  Cnm?: string;
  badgeUrl?: string;
};

export const getLsSearch = cache(
  async (query: string): Promise<{ teams: LsSearchTeam[]; comps: LsSearchComp[] }> => {
    const q = encodeURIComponent(query);
    const d = await lsFetchRaw<{ Teams?: LsSearchTeam[]; Comps?: LsSearchComp[] }>(
      `/v1/api/app/search/soccer/${q}/0/${EAT_OFFSET}`,
    );
    return { teams: d?.Teams ?? [], comps: d?.Comps ?? [] };
  },
  ["ls-search"],
  { revalidate: 60 },
);

/* ─── Image helpers ─── */

export function lsTeamImg(img: string): string {
  return `https://storage.livescore.com/images/team/medium/${img}`;
}

export function lsCompImg(badgeUrl: string): string {
  return `https://storage.livescore.com/images/competition/medium/${badgeUrl}`;
}

/* ─── Time/date helpers ─── */

/** HH:MM from Esd (YYYYMMDDHHMMSS) */
export function lsTime(esd: number): string {
  const s = String(esd);
  return `${s.slice(8, 10)}:${s.slice(10, 12)}`;
}

/** Readable date from Esd (YYYYMMDDHHMMSS) */
export function lsDate(esd: number): string {
  const s = String(esd);
  const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8);
  return new Date(`${y}-${m}-${d}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
}

/* ─── Status helpers ─── */

export function lsIsNS(e: LsEvent): boolean {
  return e.Eps === "NS" || e.Esid === 1;
}

export function lsIsLive(e: LsEvent): boolean {
  return !lsIsNS(e) && !lsIsFinished(e) && !lsIsAbandoned(e);
}

export function lsIsFinished(e: LsEvent): boolean {
  return ["FT", "AET", "Pen", "Pens", "FT Pen"].includes(e.Eps) || e.Esid === 6;
}

export function lsIsAbandoned(e: LsEvent): boolean {
  return ["Postp.", "Canc.", "Awarded", "TBD", "Walkover", "Abd."].includes(e.Eps) || e.Esid >= 10;
}
