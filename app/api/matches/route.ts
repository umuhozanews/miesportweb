import { getCachedStvHomeMatches } from "@/lib/soccerTvHd";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCachedStvHomeMatches();
    return Response.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to scrape matches.";
    return Response.json({ error: message }, { status: 502 });
  }
}
