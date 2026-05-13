import Link from "next/link";
import Image from "next/image";
import { StreamPlayer } from "./StreamPlayer";
import { scrapeMatchServers } from "@/lib/iStreamEast";
import { scrapeSoccerTvHdStream } from "@/lib/soccerTvHd";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Slug format: "team-a-vs-team-b-1234567" — only safe chars allowed
const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

function parseMatchSlug(slug: string) {
  const vsIdx = slug.indexOf("-vs-");
  if (vsIdx === -1) return null;

  const afterVs = slug.slice(vsIdx + 4);
  const idMatch = afterVs.match(/-(\d+)$/);
  if (!idMatch) return null;

  const id = idMatch[1];
  const away = afterVs.slice(0, afterVs.length - id.length - 1);
  const home = slug.slice(0, vsIdx);

  return { home, away, id };
}

function toTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function WatchPage({ params }: PageProps) {
  const { slug } = await params;

  // Reject slugs that don't match the expected pattern — prevents SSRF/abuse
  if (!SAFE_SLUG_RE.test(slug)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff" }}>
        <p>Invalid match link.</p>
      </div>
    );
  }

  const parsed = parseMatchSlug(slug);

  let servers: string[] = [];
  let matchTitle = "Live Stream";
  let homeTeam = "";
  let awayTeam = "";

  if (parsed) {
    homeTeam = toTitle(parsed.home);
    awayTeam = toTitle(parsed.away);
    matchTitle = `${homeTeam} vs ${awayTeam}`;

    // iStreamEast first (in-memory cached, fast)
    const mainServers = await scrapeMatchServers(slug);

    if (mainServers.length > 0) {
      servers = mainServers;
    } else {
      // Only hit soccertvhd when iStreamEast has nothing (also cached for 5 min)
      const tvhdResult = await scrapeSoccerTvHdStream("sportsurge-sport-surge-live-streaming").catch(() => null);
      const tvhdServers = tvhdResult?.streams
        .filter((s) => s.type === "embed" || s.type === "hls" || s.type === "mp4")
        .map((s) => s.url)
        .slice(0, 3) ?? [];
      servers = tvhdServers;
    }
  } else {
    matchTitle = toTitle(slug);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* ── NAV ── */}
      <header style={{
        background: "#111",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 1.5rem",
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/mie-logo.png" alt="MIE Empire" width={36} height={36}
            style={{ borderRadius: 6, display: "block" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: 1 }}>MIE EMPIRE</div>
            <div style={{ color: "#5b9bd5", fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Live Football</div>
          </div>
        </Link>

        <Link href="/" style={{
          textDecoration: "none",
          display: "flex", alignItems: "center", gap: 6,
          color: "rgba(255,255,255,0.5)",
          fontSize: 13, fontWeight: 600,
        }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
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
        gap: 14,
      }}>

        {/* Match title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="dot-live" />
          <h1 style={{
            margin: 0,
            fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
            fontWeight: 800,
            color: "#fff",
          }}>
            {homeTeam && awayTeam
              ? <>{homeTeam} <span style={{ color: "#dc2626" }}>vs</span> {awayTeam}</>
              : matchTitle}
          </h1>
          <span style={{
            fontSize: 10, fontWeight: 800, color: "#22c55e",
            letterSpacing: 1.5, textTransform: "uppercase",
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 4, padding: "2px 7px",
          }}>
            LIVE
          </span>
        </div>

        {/* Player */}
        <StreamPlayer servers={servers} matchTitle={matchTitle} />

        {/* Info bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 12, color: "rgba(255,255,255,0.35)",
          flexWrap: "wrap",
        }}>
          <span>🔒 Stream provided by third-party sources</span>
          <span style={{ margin: "0 4px" }}>·</span>
          <span>If stream fails, try Server 2 or Server 3 above</span>
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "1rem 2rem",
        display: "flex", justifyContent: "center",
      }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>
          © {new Date().getFullYear()} MIE Empire
        </span>
      </footer>

    </div>
  );
}
