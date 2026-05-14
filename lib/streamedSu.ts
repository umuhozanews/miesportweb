import { unstable_cache as cache } from "next/cache";

const API = "https://streamed.su/api";

type StreamedTeam = { name: string; badge?: string };

type StreamedMatch = {
  id: string;
  title: string;
  teams?: { home?: StreamedTeam; away?: StreamedTeam };
  date: number;
  sources: Array<{ source: string; id: string }>;
};

type StreamedStream = {
  embedUrl: string;
  headers?: Record<string, string>;
};

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        referer: "https://streamed.su/",
        origin: "https://streamed.su",
        accept: "application/json",
      },
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export type StreamedMatchInfo = {
  id: string;
  home: string;
  away: string;
  sources: Array<{ source: string; id: string }>;
};

export const getStreamedFootballMatches = cache(
  async (): Promise<StreamedMatchInfo[]> => {
    const matches = await apiFetch<StreamedMatch[]>("/matches/football");
    if (!matches || !Array.isArray(matches)) return [];
    return matches
      .filter((m) => Array.isArray(m.sources) && m.sources.length > 0)
      .map((m) => ({
        id: m.id,
        home: m.teams?.home?.name ?? m.title.split(" vs ")[0] ?? "",
        away: m.teams?.away?.name ?? m.title.split(" vs ")[1] ?? "",
        sources: m.sources,
      }));
  },
  ["streamed-football"],
  { revalidate: 120 },
);

function normWords(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

export function findStreamedMatch(
  homeNm: string,
  awayNm: string,
  matches: StreamedMatchInfo[],
): StreamedMatchInfo | null {
  const hw = normWords(homeNm);
  const aw = normWords(awayNm);
  for (const m of matches) {
    const mhw = normWords(m.home);
    const maw = normWords(m.away);
    const homeHit = [...hw].some((w) => mhw.has(w));
    const awayHit = [...aw].some((w) => maw.has(w));
    if (homeHit && awayHit) return m;
  }
  return null;
}

export async function getStreamedEmbeds(match: StreamedMatchInfo): Promise<string[]> {
  const results = await Promise.allSettled(
    match.sources.slice(0, 4).map(async (src) => {
      // Try source-specific ID first, fall back to global match ID
      const streams =
        (await apiFetch<StreamedStream[]>(`/stream/${src.source}/${src.id}/1`)) ??
        (await apiFetch<StreamedStream[]>(`/stream/${src.source}/${match.id}/1`));
      return streams?.[0]?.embedUrl ?? null;
    }),
  );
  return results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => (r as PromiseFulfilledResult<string>).value);
}
