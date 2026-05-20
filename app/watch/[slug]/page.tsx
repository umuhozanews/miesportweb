import { Suspense } from "react";
import Link from "next/link";
import { StreamPlayer } from "./StreamPlayer";
import { getCachedMatchServers, getCachedIStreamSchedule, findIStreamMatch } from "@/lib/iStreamEast";
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

  // For stv- slugs: parse home/away and optional soccertvhd.com page slug
  // Slug format: stv-home-vs-away--soccertvhd-page-slug
  let effectiveParsed = parsed;
  let stvPageSlug: string | null = null;
  if (!effectiveParsed && slug.startsWith("stv-")) {
    const inner = slug.slice(4);
    const sepIdx = inner.indexOf("--");
    const teamsPart = sepIdx !== -1 ? inner.slice(0, sepIdx) : inner;
    stvPageSlug = sepIdx !== -1 ? inner.slice(sepIdx + 2) || null : null;
    const vsIdx = teamsPart.indexOf("-vs-");
    if (vsIdx !== -1) {
      effectiveParsed = {
        home: teamsPart.slice(0, vsIdx).replace(/-/g, " "),
        away: teamsPart.slice(vsIdx + 4).replace(/-/g, " "),
      };
    }
  }

  if (slug.startsWith("stv-") && effectiveParsed) {
    // Wave 1: fetch all three sources in parallel — cached, so repeat calls are instant
    const [scheduleResult, streamedResult, stvScrapeResult] = await Promise.allSettled([
      getCachedIStreamSchedule(),
      getStreamedFootballMatches(),
      stvPageSlug ? scrapeSoccerTvHdStream(stvPageSlug) : Promise.resolve(null),
    ]);

    // Resolve match objects synchronously from wave-1 results
    const iMatch = scheduleResult.status === "fulfilled"
      ? findIStreamMatch(effectiveParsed.home, effectiveParsed.away, scheduleResult.value)
      : null;
    const suMatch = streamedResult.status === "fulfilled"
      ? findStreamedMatch(effectiveParsed.home, effectiveParsed.away, streamedResult.value)
      : null;

    // Wave 2: fetch embeds in parallel
    const [iEmbeds, suEmbeds] = await Promise.allSettled([
      iMatch ? getCachedMatchServers(iMatch.slug) : Promise.resolve([]),
      suMatch ? getStreamedEmbeds(suMatch) : Promise.resolve([]),
    ]);

    // Collect HLS proxy URLs separately — CacheFly blocks CF Workers IPs so they
    // often return 403. Add direct embeds first so the default server always works.
    const hlsProxyUrls: string[] = [];
    if (stvPageSlug && stvScrapeResult.status === "fulfilled" && stvScrapeResult.value) {
      for (const s of stvScrapeResult.value.streams) {
        if (s.type === "embed") add(s.url);
        else if (s.type === "hls" || s.type === "dash") hlsProxyUrls.push(getProxiedHlsUrl(s.url));
      }
    }
    // Direct embeds from iStreamEast + streamed.su come before HLS proxies
    if (iEmbeds.status === "fulfilled") iEmbeds.value.forEach(add);
    if (suEmbeds.status === "fulfilled") suEmbeds.value.forEach(add);
    // HLS proxy streams as fallback (may fail if CDN blocks CF Workers IPs)
    hlsProxyUrls.forEach(add);
    // Raw page URL as final fallback — browser IP is not blocked
    if (stvPageSlug) add(`https://www.soccertvhd.com/${stvPageSlug}/`);
  } else {
    const [iStreamResult, streamedResult] = await Promise.allSettled([
      getCachedMatchServers(slug),
      getStreamedFootballMatches(),
    ]);

    if (iStreamResult.status === "fulfilled") {
      iStreamResult.value.forEach(add);
    }

    if (streamedResult.status === "fulfilled" && effectiveParsed) {
      const match = findStreamedMatch(effectiveParsed.home, effectiveParsed.away, streamedResult.value);
      if (match) {
        const embeds = await getStreamedEmbeds(match);
        embeds.forEach(add);
      }
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
    // stv-home-vs-away--soccertvhd-page-slug → strip '--' suffix before parsing team names
    const inner = slug.slice(4);
    const sepIdx = inner.indexOf("--");
    const teamsPart = sepIdx !== -1 ? inner.slice(0, sepIdx) : inner;
    const vsIdx = teamsPart.indexOf("-vs-");
    homeTeam = vsIdx !== -1 ? toTitle(teamsPart.slice(0, vsIdx)) : "";
    awayTeam = vsIdx !== -1 ? toTitle(teamsPart.slice(vsIdx + 4)) : "";
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
    <main style={{
      maxWidth: 1000,
      width: "100%",
      margin: "0 auto",
      padding: "1.5rem 1rem 3rem",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>

      {/* Back link */}
      <div>
        <Link href="/" style={{
          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(0,102,255,0.08)", border: "1px solid rgba(0,102,255,0.2)",
          color: "#7ab4ff", borderRadius: 8, padding: "6px 13px", fontSize: 13, fontWeight: 700,
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Match header */}
      <div style={{
        background: "linear-gradient(135deg, #060f1f 0%, #071a10 100%)",
        border: "1px solid rgba(0,230,118,0.2)",
        borderRadius: 16, padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          opacity: 0.04, pointerEvents: "none",
        }} />
        <span className="dot-live-red" style={{ flexShrink: 0, position: "relative" }} />
        <h1 style={{
          margin: 0, fontSize: "clamp(1rem, 2.5vw, 1.35rem)", fontWeight: 900,
          color: "#fff", letterSpacing: 0.2, position: "relative",
        }}>
          {homeTeam && awayTeam ? (
            <>{homeTeam} <span style={{ color: "#ff1744" }}>vs</span> {awayTeam}</>
          ) : matchTitle}
        </h1>
        <span className="mc-live-pill" style={{ position: "relative" }}>
          <span className="dot-b" />LIVE
        </span>
      </div>

      <Suspense fallback={<StreamPlayerFallback />}>
        <ServerPlayer slug={slug} matchTitle={matchTitle} parsed={parsed} />
      </Suspense>

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.22)", flexWrap: "wrap" }}>
        <span>🔒 Stream provided by third-party sources</span>
        <span style={{ margin: "0 4px" }}>·</span>
        <span>If a stream fails, try another server above</span>
      </div>

    </main>
  );
}
