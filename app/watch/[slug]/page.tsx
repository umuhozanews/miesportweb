import Link from "next/link";
import { StreamPlayer } from "./StreamPlayer";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

function toTitle(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

      {/* Stream player — loads streams client-side */}
      <StreamPlayer slug={slug} matchTitle={matchTitle} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.18)", flexWrap: "wrap" }}>
        <span>🔒 Streams from third-party sources</span>
        <span style={{ margin: "0 4px" }}>·</span>
        <span>If a stream fails, try another server above</span>
      </div>

    </main>
  );
}
