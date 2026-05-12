import { Agent } from "undici";

const agent = new Agent({ connect: { rejectUnauthorized: false } });
const BASE = "https://mev-api.live-lsm.ls-g.net";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = "/" + path.join("/");
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const upstreamUrl = `${BASE}${apiPath}${qs ? "?" + qs : ""}`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await fetch(upstreamUrl, {
      ...({ dispatcher: agent } as any),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.livescore.com/",
        Origin: "https://www.livescore.com",
      },
      cache: "no-store",
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Upstream error" }, { status: 502 });
  }
}
