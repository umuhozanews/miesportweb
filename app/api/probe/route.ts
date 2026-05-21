import { NextResponse } from "next/server";

async function get(url: string) {
  const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!r.ok) return { error: r.status };
  return r.json();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const which = url.searchParams.get("q") ?? "pl_standings";

  const urls: Record<string, string> = {
    pl_standings: "https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings",
    wc_standings: "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026",
    pl_scoreboard: "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard",
    pl_schedule: "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/schedule?limit=20",
    wc_schedule: "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/schedule?limit=10",
    pl_topscorers: "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/leaders",
    wc_topscorers: "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/leaders",
  };

  const targetUrl = urls[which];
  if (!targetUrl) return NextResponse.json({ error: "unknown query", available: Object.keys(urls) });

  const data = await get(targetUrl);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
