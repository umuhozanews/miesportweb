export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import {
  getLsStages,
  lsIsLive,
  lsIsNS,
  type LsEvent,
  type LsStage,
} from "@/lib/livescoreCom";
import {
  getCachedIStreamSchedule,
  type IStreamMatch,
} from "@/lib/iStreamEast";
import {
  getStreamedFootballMatches,
  findStreamedMatch,
  type StreamedMatchInfo,
} from "@/lib/streamedSu";
import {
  getCachedStvHomeMatches,
  type ScrapedMatch,
} from "@/lib/soccerTvHd";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function normWords(s: string): Set<string> {
  const words = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

function findIStreamSlug(homeNm: string, awayNm: string, iMatches: IStreamMatch[]): string | null {
  const homeW = normWords(homeNm);
  const awayW = normWords(awayNm);
  for (const m of iMatches) {
    const mHomeW = normWords(m.home.replace(/-/g, " "));
    const mAwayW = normWords(m.away.replace(/-/g, " "));
    const homeHit = [...homeW].some((w) => mHomeW.has(w));
    const awayHit = [...awayW].some((w) => mAwayW.has(w));
    if (homeHit && awayHit) return m.slug;
  }
  return null;
}

function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function normToSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStvSlug(match: ScrapedMatch): string {
  const parts = match.name.split(/\s+vs\.?\s+/i);
  const home = normToSlug(parts[0]?.trim() ?? "home");
  const away = normToSlug(parts[1]?.trim() ?? "away");
  const base = `stv-${home}-vs-${away}`;
  // Append the soccertvhd.com page slug after '--' so the watch page can scrape it directly
  return match.slug ? `${base}--${match.slug}` : base;
}

export default async function Home() {
  const [stagesResult, iStreamResult, streamedResult, stvResult] = await Promise.allSettled([
    getLsStages(getTodayDate(), "soccer"),
    getCachedIStreamSchedule(),
    getStreamedFootballMatches(),
    getCachedStvHomeMatches(),
  ]);

  const stages: LsStage[] =
    stagesResult.status === "fulfilled" ? stagesResult.value : [];
  const iStreamMatches: IStreamMatch[] =
    iStreamResult.status === "fulfilled" ? iStreamResult.value : [];
  const streamedMatches: StreamedMatchInfo[] =
    streamedResult.status === "fulfilled" ? streamedResult.value : [];

  // STV matches — primary streaming source
  const now = new Date();
  const stvRaw: ScrapedMatch[] =
    stvResult.status === "fulfilled" ? stvResult.value.matches : [];
  const stvMatches = stvRaw
    .filter((m) => new Date(m.endIso) > now)
    .map((m) => ({ match: m, slug: getStvSlug(m) }))
    .filter(({ slug }) => /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/.test(slug));

  // Other matches (live + upcoming) — exclude any already shown via STV
  const stvNames = new Set(stvMatches.map(({ match: m }) => m.name.toLowerCase()));
  const allEvents: LsEvent[] = stages.flatMap((s) => s.Events ?? []);

  function toWatchEntry(e: LsEvent) {
    const homeNm = e.T1?.[0]?.Nm ?? "";
    const awayNm = e.T2?.[0]?.Nm ?? "";
    const iSlug = findIStreamSlug(homeNm, awayNm, iStreamMatches);
    if (iSlug) return { event: e, watchSlug: iSlug };
    const suMatch = findStreamedMatch(homeNm, awayNm, streamedMatches);
    if (suMatch) return { event: e, watchSlug: `su-${suMatch.id}` };
    return { event: e, watchSlug: null };
  }

  function notInStv(e: LsEvent) {
    const nm = `${e.T1?.[0]?.Nm ?? ""} vs ${e.T2?.[0]?.Nm ?? ""}`.toLowerCase();
    return !stvNames.has(nm);
  }

  const liveEventsWithStream = allEvents
    .filter(lsIsLive)
    .filter(notInStv)
    .map(toWatchEntry)
    .filter((x) => x.watchSlug !== null);

  const upcomingEventsWithStream = allEvents
    .filter(lsIsNS)
    .filter(notInStv)
    .map(toWatchEntry)
    .filter((x) => x.watchSlug !== null)
    .slice(0, 10);

  const count = liveEventsWithStream.length;
  const upcomingCount = upcomingEventsWithStream.length;
  const stvCount = stvMatches.length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0f", color: "#fff", fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ── */}
      <header style={{
        background: "linear-gradient(180deg, #0d1428 0%, #08090f 100%)",
        borderBottom: "1px solid rgba(0,102,255,0.18)",
        padding: "0 1.25rem",
        height: 58,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 0 rgba(0,102,255,0.12), 0 4px 28px rgba(0,0,0,0.7)",
        flexShrink: 0,
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 30,
        backdropFilter: "blur(18px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <Image src="/mie-logo.png" alt="MIE Empire" width={36} height={36}
            style={{ borderRadius: 8, display: "block" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: 0.5 }}>MIE Sport</div>
            <div style={{ color: "#0066ff", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Live Football</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/livescore" style={{
            textDecoration: "none",
            background: "rgba(0,102,255,0.1)",
            border: "1px solid rgba(0,102,255,0.28)",
            color: "#7ab4ff",
            borderRadius: 8,
            padding: "5px 13px",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}>
            📊 Scores
          </Link>
          {(stvCount > 0 || count > 0) && (
            <span className="mc-sticky-pill">
              <span className="dot-live-red" />
              {stvCount + count} LIVE
            </span>
          )}
          {upcomingCount > 0 && count === 0 && stvCount === 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#7ab4ff", background: "rgba(0,102,255,0.1)", border: "1px solid rgba(0,102,255,0.22)", borderRadius: 6, padding: "3px 9px" }}>
              {upcomingCount} UPCOMING
            </span>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, maxWidth: 780, width: "100%", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>

        {stvCount > 0 || count > 0 || upcomingCount > 0 ? (
          <section>
            {/* Sticky bar */}
            {(stvCount > 0 || count > 0) && (
              <div className="mc-sticky-bar">
                <span className="dot-live-red" />
                <span className="mc-sticky-label">Streaming Now</span>
                <span className="mc-sticky-pill">
                  {stvCount + count} match{stvCount + count > 1 ? "es" : ""}
                </span>
              </div>
            )}

            {/* STV PRIMARY section */}
            {stvCount > 0 && (
              <>
                <div className="mc-section-hdr">
                  <span className="dot-live-red" />
                  <span className="mc-section-hdr-title">Live Now</span>
                  <div className="mc-section-hdr-line" />
                  <span className="mc-section-hdr-count">
                    {stvCount} match{stvCount > 1 ? "es" : ""}
                  </span>
                </div>
                <div className="mc-list">
                  {stvMatches.map(({ match, slug }) => (
                    <STVMatchCard key={match.id} match={match} watchSlug={slug} />
                  ))}
                </div>
              </>
            )}

            {/* Other live matches (iStreamEast / streamed.su) */}
            {count > 0 && (
              <>
                <div className="mc-section-hdr" style={{ marginTop: stvCount > 0 ? 24 : 0 }}>
                  <span className="dot-live-red" />
                  <span className="mc-section-hdr-title">More Live</span>
                  <div className="mc-section-hdr-line" />
                  <span className="mc-section-hdr-count">
                    {count} match{count > 1 ? "es" : ""}
                  </span>
                </div>
                <div className="mc-list">
                  {liveEventsWithStream.map(({ event: e, watchSlug }) => (
                    <MatchCard key={e.Eid} event={e} watchSlug={watchSlug} />
                  ))}
                </div>
              </>
            )}

            {/* Upcoming matches with stream links */}
            {upcomingCount > 0 && (
              <>
                <div className="mc-section-hdr" style={{ marginTop: stvCount > 0 || count > 0 ? 24 : 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7ab4ff", flexShrink: 0 }} />
                  <span className="mc-section-hdr-title">Upcoming</span>
                  <div className="mc-section-hdr-line" />
                  <span className="mc-section-hdr-count">
                    {upcomingCount} match{upcomingCount > 1 ? "es" : ""}
                  </span>
                </div>
                <div className="mc-list">
                  {upcomingEventsWithStream.map(({ event: e, watchSlug }) => (
                    <MatchCard key={e.Eid} event={e} watchSlug={watchSlug} />
                  ))}
                </div>
              </>
            )}
          </section>
        ) : (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "5rem 1rem", gap: 18, textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(0,102,255,0.08)",
              border: "1px solid rgba(0,102,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="rgba(0,102,255,0.4)" strokeWidth={1.5}>
                <circle cx={12} cy={12} r={10} />
                <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 700, margin: 0 }}>
              No live matches right now
            </p>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, margin: 0 }}>
              Check back when matches kick off — this page updates automatically.
            </p>
            <Link href="/livescore" style={{
              marginTop: 4,
              textDecoration: "none",
              background: "linear-gradient(90deg, #0066ff, #00c6ff)",
              color: "#fff",
              borderRadius: 10,
              padding: "10px 22px",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              boxShadow: "0 4px 20px rgba(0,102,255,0.4)",
            }}>
              View Today&apos;s Schedule →
            </Link>
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(0,102,255,0.1)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        background: "rgba(6,8,18,0.8)",
      }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.12)" }}>© {new Date().getFullYear()} MIE Empire</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.12)" }}>
          Special thanks to{" "}
          <a href="https://www.atomiq.rw/" target="_blank" rel="noopener noreferrer"
            style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>ATOMIQ</a>
        </span>
      </footer>

    </div>
  );
}

function MatchCard({ event: e, watchSlug }: { event: LsEvent; watchSlug?: string | null }) {
  const home = e.T1?.[0];
  const away = e.T2?.[0];
  const hasScore = e.Tr1 != null && e.Tr2 != null;
  const watchHref = watchSlug ? `/watch/${watchSlug}` : null;

  const statusLabel = e.Eps || "LIVE";
  const isLive = !["HT", "FT", "AET"].includes(statusLabel);
  const competition = [e.Stg?.Snm, e.Stg?.Cnm].filter(Boolean).join(" · ");

  const homeInit = teamInitials(home?.Nm ?? "HM");
  const awayInit = teamInitials(away?.Nm ?? "AW");

  return (
    <div className={`mc-card${isLive ? " mc-card-live" : ""}`}>

      {/* Top: competition + status pill */}
      <div className="mc-top">
        <span className="mc-competition">{competition || "Football"}</span>
        {isLive ? (
          <span className="mc-live-pill">
            <span className="dot-b" />
            {statusLabel === "LIVE" ? "LIVE" : statusLabel}
          </span>
        ) : (
          <span className="mc-status-pill">{statusLabel}</span>
        )}
      </div>

      {/* Center: avatars + score */}
      <div className="mc-center">
        {/* Home team */}
        <div className="mc-team">
          <div className="mc-avatar mc-avatar-home">{homeInit}</div>
          <div className="mc-team-name">{home?.Nm ?? "Home"}</div>
        </div>

        {/* Score */}
        <div className="mc-score">
          {hasScore ? (
            <>
              <div className={`mc-score-num${isLive ? " mc-score-num-live" : ""}`}>
                {e.Tr1}&thinsp;–&thinsp;{e.Tr2}
              </div>
              <div className="mc-score-label">Score</div>
            </>
          ) : (
            <div className="mc-score-vs">VS</div>
          )}
        </div>

        {/* Away team */}
        <div className="mc-team">
          <div className="mc-avatar mc-avatar-away">{awayInit}</div>
          <div className="mc-team-name">{away?.Nm ?? "Away"}</div>
        </div>
      </div>

      {/* Watch Now CTA */}
      {watchHref && (
        <Link href={watchHref} className="mc-watch-btn">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Watch Now
        </Link>
      )}
    </div>
  );
}

function STVMatchCard({ match, watchSlug }: { match: ScrapedMatch; watchSlug: string }) {
  const nameParts = match.name.split(/\s+vs\.?\s+/i);
  const home = nameParts[0]?.trim() ?? match.name;
  const away = nameParts[1]?.trim() ?? "";
  const isLive = new Date() >= new Date(match.startIso) && new Date() <= new Date(match.endIso);
  const startTime = new Date(match.startIso);
  const timeLabel = isLive
    ? "LIVE"
    : startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const homeInit = teamInitials(home);
  const awayInit = teamInitials(away);

  return (
    <div className={`mc-card${isLive ? " mc-card-live" : ""}`}>
      <div className="mc-top">
        <span className="mc-competition">Soccer TV HD</span>
        {isLive ? (
          <span className="mc-live-pill">
            <span className="dot-b" />LIVE
          </span>
        ) : (
          <span className="mc-status-pill">{timeLabel}</span>
        )}
      </div>
      <div className="mc-center">
        <div className="mc-team">
          <div className="mc-avatar mc-avatar-home">{homeInit}</div>
          <div className="mc-team-name">{home}</div>
        </div>
        <div className="mc-score">
          <div className="mc-score-vs">VS</div>
        </div>
        <div className="mc-team">
          <div className="mc-avatar mc-avatar-away">{awayInit}</div>
          <div className="mc-team-name">{away}</div>
        </div>
      </div>
      <Link href={`/watch/${watchSlug}`} className="mc-watch-btn">
        <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        Watch Now
      </Link>
    </div>
  );
}
