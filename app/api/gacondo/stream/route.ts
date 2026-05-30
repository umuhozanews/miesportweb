import { getCachedGacondoStream } from "@/GACONDO";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,120}[a-z0-9]$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Accept either ?slug=team-a-vs-team-b or ?slugs=slug1,slug2,...
  const rawSlugs = searchParams.get("slugs") ?? searchParams.get("slug") ?? "";
  const slugs = rawSlugs.split(",").map(s => s.trim().toLowerCase()).filter(s => SLUG_RE.test(s));

  if (slugs.length === 0) {
    return Response.json({ error: "Provide ?slug=team-a-vs-team-b or ?slugs=slug1,slug2" }, { status: 400 });
  }

  try {
    const data = await getCachedGacondoStream(slugs);

    const cacheHeader =
      data.streams.length > 0
        ? "public, s-maxage=60, stale-while-revalidate=20"
        : "public, s-maxage=15, stale-while-revalidate=10";

    return Response.json(data, { headers: { "Cache-Control": cacheHeader } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to scrape streams.";
    return Response.json({ error: message }, { status: 502 });
  }
}
