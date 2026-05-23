import { scrapeSoccerTvHdStream } from "@/lib/soccerTvHd";
import { getProxiedHlsUrl, getOriginalStreamUrl } from "@/lib/hlsProxy";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const REFERER = "https://www.soccertvhd.com";

async function probe(url: string): Promise<{ ok: boolean; status: number; ct: string; body: string }> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "user-agent": UA, referer: REFERER, origin: REFERER, accept: "*/*" },
    });
    const text = await r.text();
    return { ok: r.ok, status: r.status, ct: r.headers.get("content-type") ?? "", body: text.slice(0, 300) };
  } catch (e) {
    return { ok: false, status: 0, ct: "", body: String(e) };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";
  if (!slug) return Response.json({ error: "?slug= required" }, { status: 400 });

  let stvResult;
  try {
    stvResult = await scrapeSoccerTvHdStream(slug);
  } catch (e) {
    return Response.json({ error: String(e) });
  }

  const diagnostics = await Promise.all(
    stvResult.streams.map(async (s) => {
      const proxied = (s.type === "hls" || s.type === "dash")
        ? getProxiedHlsUrl(s.url, request.url) : null;
      const originalForCheck = proxied ? (getOriginalStreamUrl(proxied) ?? s.url) : s.url;
      const check = await probe(originalForCheck);
      return {
        type: s.type,
        originalUrl: s.url,
        proxiedUrl: proxied,
        check,
      };
    })
  );

  return Response.json({
    sourceUrl: stvResult.sourceUrl,
    scrapedAt: stvResult.scrapedAt,
    streams: diagnostics,
  });
}
