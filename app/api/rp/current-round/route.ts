export const runtime = "edge";

import { type NextRequest } from "next/server";

const BASE = "https://api.sofascore.com/api/v1";
const UID = 10608;

const HEADERS: Record<string, string> = {
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

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const seasonId = Number(sp.get("seasonId") ?? "0");
  if (!seasonId) return Response.json({ round: 1 });

  try {
    const res = await fetch(
      `${BASE}/unique-tournament/${UID}/season/${seasonId}/rounds`,
      { headers: HEADERS },
    );
    if (!res.ok) return Response.json({ round: 1 });
    const data = (await res.json()) as {
      currentRound?: { round: number };
      rounds?: Array<{ round: number }>;
    };
    const round =
      data.currentRound?.round ??
      (data.rounds?.length ? data.rounds[data.rounds.length - 1].round : 1);
    return Response.json({ round });
  } catch {
    return Response.json({ round: 1 });
  }
}
