export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import {
  getLsStages,
  lsIsLive,
  lsIsNS,
  lsIsFinished,
  lsTime,
  lsDate,
  type LsEvent,
  type LsStage,
} from "@/lib/livescoreCom";
import {
  scrapeSoccerTvHdHomeMatches,
  type ScrapedMatch,
} from "@/lib/soccerTvHd";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

// Normalize a team name to a set of significant words for fuzzy matching
function normWords(s: string): Set<string> {
  const words = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // strip accents: é→e
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);       // skip "fc", "de", "vs" etc.
  return new Set(words);
}

// Find a matching soccertvhd slug for a livescore event
function findStreamSlug(homeNm: string, awayNm: string, streamMatches: ScrapedMatch[]): string | null {
  const homeW = normWords(homeNm);
  const awayW = normWords(awayNm);

  for (const m of streamMatches) {
    if (!m.slug || !m.isLiveOrUpcoming) continue;
    const nameW = normWords(m.name);

    const homeHit = [...homeW].some((w) => nameW.has(w));
    const awayHit = [...awayW].some((w) => nameW.has(w));

    if (homeHit && awayHit) return m.slug;
  }
  return null;
}

export default async function Home() {
  // Fetch livescore data and soccertvhd stream list in parallel
  const [stagesResult, streamResult] = await Promise.allSettled([
    getLsStages(getTodayDate(), "soccer"),
    scrapeSoccerTvHdHomeMatches(),
  ]);

  const stages: LsStage[] =
    stagesResult.status === "fulfilled" ? stagesResult.value : [];
  const streamMatches: ScrapedMatch[] =
    streamResult.status === "fulfilled" ? streamResult.value.matches : [];

  const allEvents: LsEvent[] = stages.flatMap((s) => s.Events ?? []);
  const liveEvents     = allEvents.filter(lsIsLive);
  const upcomingEvents = allEvents.filter(lsIsNS);
  const finishedEvents = allEvents.filter(lsIsFinished).slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)", color: "var(--t-primary)", fontFamily: "system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <header style={{
        background: "var(--brand-navy)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 1.25rem",
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        flexShrink: 0,
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <Image src="/mie-logo.png" alt="MIE Empire" width={36} height={36}
            style={{ borderRadius: 7, display: "block" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: 0.5 }}>MIE Sport</div>
            <div style={{ color: "#5b9bd5", fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>Live Football</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/livescore" style={{
            textDecoration: "none",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#c8d8f0",
            borderRadius: 7,
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}>
            📊 Scores
          </Link>
          {liveEvents.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <span className="dot-live" />
              <span style={{ color: "var(--c-live)", fontSize: 12, fontWeight: 700 }}>{liveEvents.length}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, maxWidth: 780, width: "100%", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>

        {/* LIVE */}
        {liveEvents.length > 0 && (
          <section style={{ marginBottom: "1.75rem" }}>
            <SectionLabel live>Live Now</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {liveEvents.map((e) => {
                const slug = findStreamSlug(
                  e.T1?.[0]?.Nm ?? "",
                  e.T2?.[0]?.Nm ?? "",
                  streamMatches,
                );
                return <MatchCard key={e.Eid} event={e} isLive watchSlug={slug ?? undefined} />;
              })}
            </div>
          </section>
        )}

        {/* UPCOMING */}
        {upcomingEvents.length > 0 && (
          <section style={{ marginBottom: "1.75rem" }}>
            <SectionLabel>Upcoming</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
              {upcomingEvents.map((e) => (
                <MatchCard key={e.Eid} event={e} isLive={false} />
              ))}
            </div>
          </section>
        )}

        {/* FINISHED */}
        {finishedEvents.length > 0 && liveEvents.length === 0 && upcomingEvents.length === 0 && (
          <section>
            <SectionLabel>Today&apos;s Results</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
              {finishedEvents.map((e) => (
                <MatchCard key={e.Eid} event={e} isLive={false} />
              ))}
            </div>
          </section>
        )}

        {liveEvents.length === 0 && upcomingEvents.length === 0 && finishedEvents.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--t-tertiary)", fontSize: 14 }}>
            No matches found for today.
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        background: "var(--brand-navy)",
      }}>
        <span style={{ fontSize: 12, color: "#2a3a54" }}>© {new Date().getFullYear()} MIE Empire</span>
        <span style={{ fontSize: 12, color: "#2a3a54" }}>
          Special thanks to{" "}
          <a href="https://www.atomiq.rw/" target="_blank" rel="noopener noreferrer"
            style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>ATOMIQ</a>
        </span>
      </footer>

    </div>
  );
}

function SectionLabel({ children, live }: { children: React.ReactNode; live?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {live && <span className="dot-live" />}
      <span style={{ fontSize: 10, fontWeight: 800, color: live ? "var(--c-live)" : "var(--t-label)", letterSpacing: 1.5, textTransform: "uppercase" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}

function MatchCard({ event: e, isLive, watchSlug }: { event: LsEvent; isLive: boolean; watchSlug?: string }) {
  const home = e.T1?.[0];
  const away = e.T2?.[0];
  const hasScore = e.Tr1 != null && e.Tr2 != null;

  return (
    <div style={{
      background: "#0d1523",
      border: `1px solid ${isLive ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}>
      {/* Time / status */}
      <div style={{ minWidth: 48, flexShrink: 0, textAlign: "center" }}>
        {isLive ? (
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-live)", lineHeight: 1.3 }}>
            {["HT", "FT", "AET"].includes(e.Eps) ? e.Eps : e.Eps || "LIVE"}
          </div>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-time)" }}>
            {lsTime(e.Esd)}
          </div>
        )}
        <div style={{ fontSize: 10, color: "var(--t-label)", marginTop: 1 }}>
          {lsDate(e.Esd)}
        </div>
      </div>

      {/* Teams */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#dde4f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {home?.Nm ?? "Home"} <span style={{ color: "var(--t-label)", fontWeight: 400, fontSize: 11 }}>vs</span> {away?.Nm ?? "Away"}
        </div>
        {e.Stg?.Snm && (
          <div style={{ fontSize: 10, color: "var(--t-label)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {e.Stg.Snm}{e.Stg.Cnm ? ` · ${e.Stg.Cnm}` : ""}
          </div>
        )}
      </div>

      {/* Score */}
      {hasScore && (
        <div style={{
          fontSize: 16,
          fontWeight: 900,
          color: isLive ? "var(--c-live)" : "var(--t-primary)",
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
          minWidth: 40,
          textAlign: "center",
        }}>
          {e.Tr1} – {e.Tr2}
        </div>
      )}

      {/* Watch button — only shown when a stream slug is matched */}
      {isLive && watchSlug && (
        <Link href={`/watch/${watchSlug}`} style={{ textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            background: "#dc2626",
            color: "#fff",
            borderRadius: 7,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 5,
            letterSpacing: 0.3,
          }}>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch
          </div>
        </Link>
      )}
    </div>
  );
}
