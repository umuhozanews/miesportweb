export const runtime = "edge";

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

export async function GET() {
  try {
    const res = await fetch(
      `${BASE}/unique-tournament/${UID}/seasons`,
      { headers: HEADERS },
    );
    if (!res.ok) return Response.json({ seasons: [] });
    const data = (await res.json()) as { seasons?: unknown[] };
    return Response.json({ seasons: data.seasons ?? [] });
  } catch {
    return Response.json({ seasons: [] });
  }
}
