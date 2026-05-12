export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { getLsStages, lsIsLive, lsIsNS, lsTime, lsDate, type LsEvent, type LsStage } from "@/lib/livescoreCom";

const CHANNELS = [
  { name: "StreamEast",  slug: "streameast-stream-east-live-streaming",  color: "#1d4ed8", icon: "⚡" },
  { name: "Score808",    slug: "score808-score808-live",                   color: "#15803d", icon: "📺" },
  { name: "HesGoal",     slug: "hesgoal-hes-goal-live-streaming",          color: "#b91c1c", icon: "🎯" },
  { name: "SportSurge",  slug: "sportsurge-sport-surge-live-streaming",    color: "#7c3aed", icon: "🚀" },
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export default async function Home() {
  let stages: LsStage[] = [];
  try {
    stages = await getLsStages(getTodayDate(), "soccer");
  } catch {
    // livescore upstream unavailable — continue with empty
  }

  const allEvents: LsEvent[] = stages.flatMap((s) => s.Events ?? []);
  const liveEvents   = allEvents.filter(lsIsLive).slice(0, 8);
  const upcomingEvents = allEvents.filter(lsIsNS).slice(0, 12);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)", color: "var(--t-primary)", fontFamily: "system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <header style={{
        background: "var(--brand-navy)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 2rem",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/mie-logo.png" alt="MIE Empire" width={40} height={40}
            style={{ borderRadius: 8, display: "block" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: 0.5 }}>MIE EMPIRE</div>
            <div style={{ color: "#5b9bd5", fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Live Football</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/livescore" style={{
            textDecoration: "none",
            background: "rgba(255,255,255,0.09)",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "#d4e0f7",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
          }}>
            📊 Live Scores
          </Link>
          {liveEvents.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="dot-live" />
              <span style={{ color: "var(--c-live)", fontSize: 12, fontWeight: 700 }}>{liveEvents.length} Live</span>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(160deg, #071e42 0%, #0a1628 60%, #050d1a 100%)",
        padding: "3rem 2rem 2.5rem",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(30,77,183,0.2) 0%, transparent 70%)",
        }} />
        <p style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12, position: "relative" }}>
          Free · No Login · HD Quality
        </p>
        <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 900, margin: 0, lineHeight: 1.1, position: "relative" }}>
          Watch Football Live
        </h1>
        <p style={{ color: "#6b8cb3", marginTop: 10, fontSize: 14, position: "relative" }}>
          {liveEvents.length > 0
            ? `${liveEvents.length} match${liveEvents.length !== 1 ? "es" : ""} live right now · pick a channel below`
            : "Choose a channel below to start watching"}
        </p>
      </div>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, maxWidth: 860, width: "100%", margin: "0 auto", padding: "2rem 1.25rem 3rem" }}>

        {/* ── STREAMING CHANNELS ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>
            <span className="dot-live" style={{ marginRight: 4 }} />
            Watch Live Now
          </SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 12 }}>
            {CHANNELS.map((ch) => (
              <Link key={ch.slug} href={`/watch/${ch.slug}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "linear-gradient(135deg, #111827 0%, #0d1523 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "1.1rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "border-color 0.1s, background 0.1s",
                }}
                  className="match-row"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: ch.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, flexShrink: 0,
                      boxShadow: `0 4px 16px ${ch.color}55`,
                    }}>
                      {ch.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#e8eaf0" }}>{ch.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <span className="dot-live" style={{ width: 6, height: 6 }} />
                        <span style={{ fontSize: 11, color: "var(--c-live)", fontWeight: 700 }}>LIVE</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: ch.color,
                    color: "#fff",
                    borderRadius: 8,
                    padding: "7px 16px",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Watch
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── LIVE MATCHES ── */}
        {liveEvents.length > 0 && (
          <section style={{ marginBottom: "2rem" }}>
            <SectionLabel>
              <span className="dot-live" style={{ marginRight: 4 }} />
              Matches Live Right Now
            </SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 10 }}>
              {liveEvents.map((e) => <EventRow key={e.Eid} event={e} isLive />)}
            </div>
          </section>
        )}

        {/* ── UPCOMING MATCHES ── */}
        {upcomingEvents.length > 0 && (
          <section>
            <SectionLabel>Today&apos;s Upcoming Matches</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 10 }}>
              {upcomingEvents.map((e) => <EventRow key={e.Eid} event={e} isLive={false} />)}
            </div>
          </section>
        )}

        {liveEvents.length === 0 && upcomingEvents.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--t-tertiary)", fontSize: 13 }}>
            No scheduled matches found for today — channels above are always live.
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "1.1rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        background: "var(--brand-navy)",
      }}>
        <span style={{ fontSize: 12, color: "#354060" }}>© {new Date().getFullYear()} MIE Empire</span>
        <span style={{ fontSize: 12, color: "#354060" }}>
          Special thanks to{" "}
          <a href="https://www.atomiq.rw/" target="_blank" rel="noopener noreferrer" style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>ATOMIQ</a>
        </span>
      </footer>

    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-tertiary)", letterSpacing: 1.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

function EventRow({ event: e, isLive }: { event: LsEvent; isLive: boolean }) {
  const home = e.T1?.[0];
  const away = e.T2?.[0];
  const score = (e.Tr1 != null && e.Tr2 != null) ? `${e.Tr1} – ${e.Tr2}` : null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 8,
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      {/* Time / status */}
      <div style={{ minWidth: 52, textAlign: "center", flexShrink: 0 }}>
        {isLive ? (
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--c-live)" }}>
            {e.Eps === "NS" ? "LIVE" : e.Eps}
          </span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-time)" }}>
            {lsTime(e.Esd)}
          </span>
        )}
        <div style={{ fontSize: 10, color: "var(--t-label)", marginTop: 2 }}>
          {lsDate(e.Esd)}
        </div>
      </div>

      {/* Teams + score */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#d8dde8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {home?.Nm ?? "Home"} <span style={{ color: "var(--t-label)", fontWeight: 400 }}>vs</span> {away?.Nm ?? "Away"}
        </div>
        {e.Stg?.Snm && (
          <div style={{ fontSize: 10, color: "var(--t-label)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {e.Stg.Snm}
          </div>
        )}
      </div>

      {/* Score or kick-off */}
      {score ? (
        <div style={{ fontSize: 16, fontWeight: 900, color: isLive ? "var(--c-live)" : "var(--t-primary)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
          {score}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "var(--t-tertiary)", flexShrink: 0 }}>KO</div>
      )}
    </div>
  );
}
