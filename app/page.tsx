import Link from "next/link";
import Image from "next/image";
import { scrapeSoccerTvHdHomeMatches, type ScrapedMatch } from "@/lib/soccerTvHd";

export const dynamic = "force-dynamic";

export default async function Home() {
  let data: Awaited<ReturnType<typeof scrapeSoccerTvHdHomeMatches>>;
  try {
    data = await scrapeSoccerTvHdHomeMatches();
  } catch {
    data = { matches: [] };
  }
  const now = new Date();

  const live = data.matches.filter(
    (m) => now >= new Date(m.startIso) && now <= new Date(m.endIso),
  );
  const upcoming = data.matches.filter(
    (m) => now < new Date(m.startIso),
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f0f4f8" }}>

      {/* ── NAV ── */}
      <header style={{
        background: "#0a1e3d",
        padding: "0 2rem",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/mie-logo.png" alt="MIE Empire" width={44} height={44}
            style={{ borderRadius: 8, display: "block" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>
              MIE EMPIRE
            </div>
            <div style={{ color: "#5b9bd5", fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
              Live Football
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/livescore" style={{
            textDecoration: "none",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}>
            📊 Live Scores
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="dot-live" style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Live Now</span>
          </div>
        </div>
      </header>

      {/* ── HERO STRIP ── */}
      <div style={{
        background: "linear-gradient(135deg, #1041a3 0%, #0a1e3d 100%)",
        padding: "3rem 2rem",
        textAlign: "center",
      }}>
        <p style={{ color: "#93c5fd", fontSize: 13, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
          Today&apos;s Schedule
        </p>
        <h1 style={{ color: "#fff", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, margin: 0, lineHeight: 1.1 }}>
          Watch Football Live
        </h1>
        <p style={{ color: "#93c5fd", marginTop: 12, fontSize: 15 }}>
          {data.matches.length > 0
            ? `${data.matches.length} match${data.matches.length !== 1 ? "es" : ""} · Free streaming`
            : "Free streaming · Check back soon"}
        </p>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, maxWidth: 900, width: "100%", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* LIVE SECTION */}
        {live.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
              <span className="dot-live" style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#ef4444" }}>
                Live Now
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {live.map((m) => <MatchRow key={m.id} match={m} isLive />)}
            </div>
          </section>
        )}

        {/* UPCOMING SECTION */}
        {upcoming.length > 0 && (
          <section>
            <h2 style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#64748b" }}>
              Upcoming
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {upcoming.map((m) => <MatchRow key={m.id} match={m} isLive={false} />)}
            </div>
          </section>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid #e2e8f0",
        background: "#fff",
        padding: "1.25rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>
          © {new Date().getFullYear()} MIE Empire
        </span>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>
          Special thanks to{" "}
          <a href="https://www.atomiq.rw/" target="_blank" rel="noopener noreferrer" style={{ color: "#1041a3", fontWeight: 700 }}>ATOMIQ</a>
        </span>
      </footer>

    </div>
  );
}

function MatchRow({ match, isLive }: { match: ScrapedMatch; isLive: boolean }) {
  const [home, away] = match.name.split(/\s+vs\s+/i);
  const start = new Date(match.startIso);
  const time = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const date = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const watchHref = match.slug
    ? `/watch/${encodeURIComponent(match.slug)}`
    : `/api/stream?url=${encodeURIComponent(match.button.link ?? "")}`;

  return (
    <Link href={watchHref} className={`match-row${isLive ? " live" : ""}`}>
        {/* Time column */}
        <div style={{ minWidth: 80, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: isLive ? "#ef4444" : "#0a1e3d" }}>
            {isLive ? "LIVE" : time}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{date}</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, alignSelf: "stretch", background: "#e9eef5" }} />

        {/* Teams */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0a1e3d" }}>
            {home?.trim() ?? match.name}
          </div>
          {away ? (
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
              vs &nbsp;<span style={{ fontWeight: 600, color: "#334155" }}>{away.trim()}</span>
            </div>
          ) : null}
        </div>

        {/* Watch button */}
        <div style={{
          background: isLive ? "#1041a3" : "#f1f5f9",
          color: isLive ? "#fff" : "#1041a3",
          border: isLive ? "none" : "1.5px solid #cbd5e1",
          borderRadius: 8,
          padding: "0.5rem 1.1rem",
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Watch
        </div>
    </Link>
  );
}
