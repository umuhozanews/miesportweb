import Link from "next/link";
import { StreamPlayer } from "./StreamPlayer";
import { getCachedStvStream } from "@/lib/soccerTvHd";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

function toTitle(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Pre-resolve stream URLs on the server so the player can start immediately.
// We use a short timeout so cold-cache scrapes don't block the page render.
async function resolveInitialServers(slug: string): Promise<string[]> {
  if (!slug.startsWith("stv-")) return [];
  const inner = slug.slice(4);
  const sepIdx = inner.indexOf("--");
  if (sepIdx === -1) return [];
  const pageSlug = inner.slice(sepIdx + 2);
  if (!pageSlug) return [];
  try {
    const result = await Promise.race([
      getCachedStvStream(pageSlug),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2000)),
    ]);
    const seen = new Set<string>();
    const servers: string[] = [];
    const add = (url: string) => { if (url && !seen.has(url)) { seen.add(url); servers.push(url); } };
    for (const s of result.streams) {
      if (s.type === "hls" || s.type === "dash") add(getProxiedHlsUrl(s.url));
    }
    for (const s of result.streams) {
      if (s.type === "embed") add(s.url);
    }
    return servers;
  } catch {
    return [];
  }
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
  let matchTitle = "Live Match";

  if (slug.startsWith("stv-")) {
    const inner = slug.slice(4);
    const sepIdx = inner.indexOf("--");
    const teamsPart = sepIdx !== -1 ? inner.slice(0, sepIdx) : inner;
    const vsIdx = teamsPart.indexOf("-vs-");
    homeTeam = vsIdx !== -1 ? toTitle(teamsPart.slice(0, vsIdx)) : "";
    awayTeam = vsIdx !== -1 ? toTitle(teamsPart.slice(vsIdx + 4)) : "";
    if (homeTeam && awayTeam) matchTitle = `${homeTeam} vs ${awayTeam}`;
  }

  const initialServers = await resolveInitialServers(slug);

  return (
    <main style={{
      maxWidth: 1000,
      width: "100%",
      margin: "0 auto",
      padding: "1rem 1rem 3rem",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }}>

      {/* Top row: match title + back */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span className="dot-live-red" style={{ flexShrink: 0 }} />
          <h1 style={{
            margin: 0,
            fontSize: "clamp(0.95rem, 2.5vw, 1.25rem)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: 0.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: "var(--font-display)",
            textTransform: "uppercase",
          }}>
            {homeTeam && awayTeam ? (
              <>{homeTeam} <span style={{ color: "#ff1744" }}>vs</span> {awayTeam}</>
            ) : matchTitle}
          </h1>
          <span className="mc-live-pill" style={{ flexShrink: 0 }}>
            <span className="dot-b" />LIVE
          </span>
        </div>

        <Link href="/" style={{
          textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(67,56,202,0.12)", border: "1px solid rgba(67,56,202,0.3)",
          color: "#818CF8", borderRadius: 8, padding: "6px 13px",
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Stream player — initialServers pre-resolved server-side for instant start */}
      <StreamPlayer slug={slug} matchTitle={matchTitle} initialServers={initialServers} />

      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>
        If a stream fails, switch to another server above.
      </div>

    </main>
  );
}
