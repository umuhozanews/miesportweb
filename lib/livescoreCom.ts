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
  Tr1?: string;   // Home full-time score
  Tr2?: string;   // Away full-time score
  Trh1?: string;  // Home half-time score
  Trh2?: string;  // Away half-time score
  Eps: string;    // Status string: "NS" | "FT" | "HT" | "AET" | "Pen" | "45+2'" | "67'" etc.
  Esid: number;   // Status ID: 1=NS, 2=live, 3=live, 4=live, 6=FT, 10=postponed, 12=canceled
  Esd: number;    // Start datetime YYYYMMDDHHMMSS (in EAT timezone)
  ErnInf?: string; // Round info
};

export type LsStage = {
  Sid: string;
  Snm: string;      // Competition name
  Cnm: string;      // Country name
  Ccd: string;      // Country code (2-letter)
  CompId: string;
  CompUrlName?: string;
  badgeUrl: string;
  Events: LsEvent[];
};

async function lsFetch(date: string): Promise<{ Stages: LsStage[] } | null> {
  const d = date.replace(/-/g, ""); // YYYY-MM-DD → YYYYMMDD
  try {
    const res = await fetch(`${BASE}/v1/api/app/date/soccer/${d}/${EAT_OFFSET}`, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatcher: agent as any,
      headers: HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ Stages: LsStage[] }>;
  } catch {
    return null;
  }
}

export const getLsStages = cache(
  async (date: string): Promise<LsStage[]> => {
    const d = await lsFetch(date);
    return d?.Stages ?? [];
  },
  ["ls-stages"],
  { revalidate: 30 },
);

/** Team badge — https://storage.livescore.com/images/team/medium/{img} */
export function lsTeamImg(img: string): string {
  return `https://storage.livescore.com/images/team/medium/${img}`;
}

/** Competition badge — https://storage.livescore.com/images/competition/medium/{badgeUrl} */
export function lsCompImg(badgeUrl: string): string {
  return `https://storage.livescore.com/images/competition/medium/${badgeUrl}`;
}

/** Extract HH:MM from Esd (YYYYMMDDHHMMSS) — already in EAT timezone */
export function lsTime(esd: number): string {
  const s = String(esd);
  return `${s.slice(8, 10)}:${s.slice(10, 12)}`;
}

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
