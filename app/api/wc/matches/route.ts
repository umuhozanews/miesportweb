import { type NextRequest } from "next/server";
import { getWCMatchesByRound } from "@/lib/worldcup";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const seasonId = Number(sp.get("seasonId") ?? "0");
  const round = Number(sp.get("round") ?? "1");
  if (!seasonId) return Response.json({ events: [] });
  const events = await getWCMatchesByRound(seasonId, round);
  return Response.json({ events });
}
