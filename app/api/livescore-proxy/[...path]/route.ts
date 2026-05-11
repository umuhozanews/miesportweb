import { Agent } from "undici";
import { corsHeaders } from "@/lib/hlsProxy";

const agent = new Agent({ connect: { rejectUnauthorized: false } });
const BASE = "https://api.sofascore.com/api/v1";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = "/" + path.join("/");
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const upstreamUrl = `${BASE}${apiPath}${qs ? "?" + qs : ""}`;

  try {
    const res = await fetch(upstreamUrl, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatcher: agent as any,
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        accept: "application/json",
        referer: "https://www.sofascore.com/",
        origin: "https://www.sofascore.com",
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
