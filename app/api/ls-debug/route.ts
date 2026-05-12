import { Agent, fetch as undiciFetch } from "undici";

export const dynamic = "force-dynamic";

const agent = new Agent({ connect: { rejectUnauthorized: false } });
const BASE = "https://mev-api.live-lsm.ls-g.net";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://www.livescore.com/",
  Origin: "https://www.livescore.com",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") ?? "/v1/api/app/comp/fix/22180/0/2";
  const url = `${BASE}${path}`;

  try {
    const res = await undiciFetch(url, { dispatcher: agent, headers: HEADERS, cache: "no-store" });
    const text = await res.text();
    return new Response(
      JSON.stringify({ status: res.status, ok: res.ok, url, bodyPreview: text.slice(0, 2000) }),
      { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err), url }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
