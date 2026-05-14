import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { StreamPlayer } from "./StreamPlayer";
import { scrapeMatchServers } from "@/lib/iStreamEast";
import { getStreamedFootballMatches, findStreamedMatch, getStreamedEmbeds } from "@/lib/streamedSu";
import { scrapeSoccerTvHdStream } from "@/lib/soccerTvHd";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

function parseMatchSlug(slug: string) {
  const vsIdx = slug.indexOf("-vs-");
  if (vsIdx === -1) return null;
  const afterVs = slug.slice(vsIdx + 4);
  const idMatch = afterVs.match(/-(\d+)$/);
  if (!idMatch) return null;
  return {
    home: slug.slice(0, vsIdx),
    away: afterVs.slice(0, afterVs.length - idMatch[1].length - 1),
  };
}

function toTitle(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function ServerPlayer({
  slug,
  matchTitle,
  parsed,
}: {
  slug: string;
  matchTitle: string;
  parsed: { home: string; away: string } | null;
}) {
  const seen = new Set<string>();
  const servers: string[] = [];
  const add = (url: string) => {
    if (url && !seen.has(url)) { seen.add(url); servers.push(url); }
  };

  // For stv- slugs: add the soccertvhd.com page as a direct iframe embed (Server 1).
  // soccertvhd.com has no X-Frame-Options → it can embed in the browser directly.
  // The browser sends Referer: soccertvhd.com → CDN allows the HLS stream.
  // This works even when the Vercel/AWS HLS proxy is CDN-blocked.
  if (slug.startsWith("stv-")) {
    add("https://www.soccertvhd.com/score808-score808-live/");
  }

  // HLS proxy (cleaner player; works where the CDN isn't IP-restricted, e.g. locally)
  try {
    const stv = await scrapeSoccerTvHdStream("score808-score808-live");
    for (const res of stv.streams) {
      if (!res.url || res.url.includes("soccertvhd.com")) continue;
      const proxied =
        res.type === "hls" || res.type === "dash"
          ? getProxiedHlsUrl(res.url)
          : res.url;
      add(proxied);
    }
  } catch { /* fall through */ }

  // Direct streamed.su lookup by match ID
  if (slug.startsWith("su-")) {
    const suId = slug.slice(3);
    const allMatches = await getStreamedFootballMatches();
    const match = allMatches.find((m) => m.id === suId);
    if (match) {
      const embeds = await getStreamedEmbeds(match);
      embeds.forEach(add);
    }
    return <StreamPlayer slug={slug} matchTitle={matchTitle} initialServers={servers} />;
  }

  // For stv- slugs: derive home/away from slug (stv-home-team-vs-away-team)
  // so we can fall back to streamed.su when soccertvhd.com is unreachable (e.g. on Vercel)
  let effectiveParsed = parsed;
  if (!effectiveParsed && slug.startsWith("stv-")) {
    const inner = slug.slice(4);
    const vsIdx = inner.indexOf("-vs-");
    if (vsIdx !== -1) {
      effectiveParsed = {
        home: inner.slice(0, vsIdx).replace(/-/g, " "),
        away: inner.slice(vsIdx + 4).replace(/-/g, " "),
      };
    }
  }

  const [iStreamResult, streamedResult] = await Promise.allSettled([
    slug.startsWith("stv-") ? Promise.resolve([]) : scrapeMatchServers(slug),
    getStreamedFootballMatches(),
  ]);

  if (iStreamResult.status === "fulfilled") {
    iStreamResult.value.forEach(add);
  }

  if (streamedResult.status === "fulfilled" && effectiveParsed) {
    const match = findStreamedMatch(
      effectiveParsed.home,
      effectiveParsed.away,
      streamedResult.value,
    );
    if (match) {
      const embeds = await getStreamedEmbeds(match);
      embeds.forEach(add);
    }
  }

  return <StreamPlayer slug={slug} matchTitle={matchTitle} initialServers={servers} />;
}

function StreamPlayerFallback() {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="sp-server-bar">
        <div className="sp-status-row">
          <span className="sp-dot-blue" />
          <span className="sp-status-text">Finding streams…</span>
        </div>
      </div>
      <div style={{
        border: "2px solid rgba(0,102,255,0.45)",
        borderRadius: 12,
        background: "linear-gradient(135deg, #050d1a 0%, #060f0a 100%)",
        boxShadow: "0 0 40px rgba(0,102,255,0.18)",
        aspectRatio: "16 / 9",
        width: "100%",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20,
      }}>
        <svg width={48} height={48} viewBox="0 0 44 44"
          style={{ animation: "spin 0.85s linear infinite", transformOrigin: "center" }}>
          <circle cx={22} cy={22} r={18} fill="none" stroke="rgba(0,102,255,0.12)" strokeWidth={4} />
          <path d="M40 22a18 18 0 0 0-18-18" fill="none" stroke="#0066ff" strokeWidth={4} strokeLinecap="round" />
        </svg>
        <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 13, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>
          Connecting to stream…
        </p>
      </div>
    </div>
  );
}

export default async function WatchPage({ params }: PageProps) {
  const { slug } = await params;

  if (!SAFE_SLUG_RE.test(slug)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", color: "#fff" }}>
        <p>Invalid match link.</p>
      </div>
    );
  }

  let homeTeam = "";
  let awayTeam = "";
  let matchTitle = "";
  let parsed: { home: string; away: string } | null = null;

  if (slug.startsWith("stv-")) {
    // stv-real-madrid-vs-real-oviedo → parse home/away from slug
    const inner = slug.slice(4);
    const vsIdx = inner.indexOf("-vs-");
    homeTeam = vsIdx !== -1 ? toTitle(inner.slice(0, vsIdx)) : "";
    awayTeam = vsIdx !== -1 ? toTitle(inner.slice(vsIdx + 4)) : "";
    matchTitle = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : "Live Match";
  } else if (slug.startsWith("su-")) {
    const suId = slug.slice(3);
    const suMatches = await getStreamedFootballMatches();
    const suMatch = suMatches.find((m) => m.id === suId);
    homeTeam = suMatch?.home ?? "";
    awayTeam = suMatch?.away ?? "";
    matchTitle = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : "Live Match";
  } else {
    parsed = parseMatchSlug(slug);
    homeTeam = parsed ? toTitle(parsed.home) : "";
    awayTeam = parsed ? toTitle(parsed.away) : "";
    matchTitle = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : toTitle(slug);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#0a0a0f",
      color: "#fff",
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── NAV ── */}
      <header style={{
        background: "linear-gradient(180deg, #0d1428 0%, #08090f 100%)",
        borderBottom: "1px solid rgba(0,102,255,0.18)",
        padding: "0 1.5rem",
        height: 58,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        boxShadow: "0 1px 0 rgba(0,102,255,0.12), 0 4px 28px rgba(0,0,0,0.7)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        backdropFilter: "blur(18px)",
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/mie-logo.png" alt="MIE Empire" width={36} height={36}
            style={{ borderRadius: 8, display: "block" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: 0.5 }}>MIE EMPIRE</div>
            <div style={{ color: "#0066ff", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Live Football</div>
          </div>
        </Link>

        <Link href="/" style={{
          textDecoration: "none",
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(0,102,255,0.1)",
          border: "1px solid rgba(0,102,255,0.22)",
          color: "#7ab4ff",
          borderRadius: 8, padding: "6px 13px",
          fontSize: 13, fontWeight: 700,
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </header>

      {/* ── MAIN ── */}
      <main style={{
        flex: 1,
        maxWidth: 1000,
        width: "100%",
        margin: "0 auto",
        padding: "1.5rem 1rem 3rem",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>

        {/* Match header */}
        <div style={{
          background: "linear-gradient(135deg, #060f1f 0%, #071a10 100%)",
          border: "1px solid rgba(0,230,118,0.2)",
          borderRadius: 16,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* grain overlay */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            opacity: 0.04, pointerEvents: "none",
          }} />
          <span className="dot-live-red" style={{ flexShrink: 0, position: "relative" }} />
          <h1 style={{
            margin: 0,
            fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: 0.2,
            position: "relative",
          }}>
            {homeTeam && awayTeam ? (
              <>
                {homeTeam}{" "}
                <span style={{ color: "#ff1744" }}>vs</span>{" "}
                {awayTeam}
              </>
            ) : matchTitle}
          </h1>
          <span className="mc-live-pill" style={{ position: "relative" }}>
            <span className="dot-b" />
            LIVE
          </span>
        </div>

        {/* Stream servers fetched server-side — iframe in initial HTML, no extra round-trip */}
        <Suspense fallback={<StreamPlayerFallback />}>
          <ServerPlayer slug={slug} matchTitle={matchTitle} parsed={parsed} />
        </Suspense>

        {/* Info bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 12, color: "rgba(255,255,255,0.22)",
          flexWrap: "wrap",
        }}>
          <span>🔒 Stream provided by third-party sources</span>
          <span style={{ margin: "0 4px" }}>·</span>
          <span>If a stream fails, try another server above</span>
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(0,102,255,0.1)",
        padding: "1rem 2rem",
        display: "flex", justifyContent: "center",
        background: "rgba(6,8,18,0.8)",
      }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.1)" }}>
          © {new Date().getFullYear()} MIE Empire
        </span>
      </footer>

    </div>
  );
}
