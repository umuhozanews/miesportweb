import Link from "next/link";
import { Suspense } from "react";
import { WC_YEARS } from "@/lib/worldcup";
import { getESPNWCFixturesByYear, espnFmtDate, espnFmtTime, type EspnEvent } from "@/lib/espn";

const WC_LOGO = "https://a.espncdn.com/i/leaguelogos/soccer/500/4.png";
import { WCTabNav } from "./WCTabNav";

type Props = { params: Promise<{ year: string }>; children: React.ReactNode };

const STAGES_2026 = ["Group stage", "R32", "R16", "QF", "SF", "3rd", "Final"];
const STAGES_DEFAULT = ["Group stage", "R16", "QF", "SF", "3rd", "Final"];

export default async function WorldCupYearLayout({ params, children }: Props) {
  const { year } = await params;

  const stages = year === "2026" ? STAGES_2026 : STAGES_DEFAULT;

  return (
    <>
      {/* ── HERO ── */}
      <div style={{
        position: "relative",
        background: "linear-gradient(180deg, #071428 0%, #0d1e38 100%)",
        overflow: "hidden",
        borderBottom: "1px solid #0f2040",
      }}>
        {/* Blue + gold glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 40% 80% at 12% 50%, rgba(30,77,183,0.3) 0%, transparent 70%), radial-gradient(ellipse 30% 60% at 88% 50%, rgba(200,60,20,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="hero-inner" style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "1rem" }}>
            {/* Trophy */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={WC_LOGO}
              alt="World Cup"
              width={70}
              height={70}
              className="hero-logo"
              style={{ objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 4px 20px rgba(255,180,60,0.35))" }}
            />

            {/* Title */}
            <div>
              <h1 style={{ fontSize: "clamp(18px, 4vw, 28px)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: -0.5, lineHeight: 1.1 }}>
                FIFA World Cup {year}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "5px 0 0", fontWeight: 500 }}>
                Group stage &amp; match results
              </p>
            </div>
          </div>

          {/* Year pills */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", marginBottom: "1.5rem" }}>
            {WC_YEARS.map((y) => (
              <Link key={y} href={`/worldcup/${y}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                <span style={{
                  display: "block",
                  padding: "5px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  background: y === year ? "#ffffff" : "rgba(255,255,255,0.05)",
                  color: y === year ? "#0a1628" : "rgba(255,255,255,0.45)",
                  border: y === year ? "none" : "1px solid rgba(255,255,255,0.12)",
                  transition: "all 0.1s",
                }}>
                  {y}
                </span>
              </Link>
            ))}
          </div>

          {/* Stage progress bar */}
          <div className="wc-stage-bar" style={{ position: "relative", paddingBottom: "1.75rem" }}>
            {/* Gradient bar */}
            <div style={{ height: 3, borderRadius: 2, background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)" }} />
            {/* Stage dots + labels */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
              {stages.map((stage, i) => {
                const pct = stages.length === 1 ? 0 : (i / (stages.length - 1)) * 100;
                return (
                  <div key={stage} style={{ position: "absolute", left: `${pct}%`, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#fff", border: "2px solid #0d0d0d", flexShrink: 0, marginTop: -3 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#555", whiteSpace: "nowrap", letterSpacing: 0.3 }}>{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN BODY ── */}
      <div className="panel-body">
        {/* Left: Matches panel */}
        <Suspense fallback={<MatchesPanelSkeleton />}>
          <EspnWCMatchesPanel year={year} />
        </Suspense>

        {/* Right: Tabs + content */}
        <div>
          <div style={{ background: "#161616", borderRadius: "10px 10px 0 0", border: "1px solid #1e1e1e", borderBottom: "1px solid #202020", marginBottom: 0 }}>
            <WCTabNav year={year} />
          </div>
          <div style={{ background: "#141414", borderRadius: "0 0 12px 12px", border: "1px solid #1e1e1e", borderTop: "none", minHeight: 400 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Left-panel server component ──────────────────────────────────────────────

async function EspnWCMatchesPanel({ year }: { year: string }) {
  const events = await getESPNWCFixturesByYear(year);

  if (events.length === 0) {
    return (
      <div style={{ background: "#161616", borderRadius: 12, border: "1px solid #1e1e1e", padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
        {year === "2026" ? "Tournament begins June 11, 2026" : `Match data unavailable for ${year}`}
      </div>
    );
  }

  const nowTs = Date.now() / 1000;
  const lastTs = events[events.length - 1]?.startTimestamp ?? 0;
  const isPast = nowTs > lastTs;
  const sorted = isPast
    ? [...events].sort((a, b) => b.startTimestamp - a.startTimestamp)
    : [...events].sort((a, b) => a.startTimestamp - b.startTimestamp);

  return (
    <div style={{ background: "#161616", borderRadius: 12, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", borderBottom: "1px solid #1e1e1e" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>Matches</span>
      </div>
      <div style={{ maxHeight: "calc(100vh - 360px)", overflowY: "auto" }}>
        {sorted.map((e: EspnEvent) => <WCMatchRow key={e.id} event={e} />)}
      </div>
    </div>
  );
}

function WCMatchRow({ event: e }: { event: EspnEvent }) {
  const isFt = e.status === "finished";
  const isLive = e.status === "live";
  const hs = e.homeScore ?? 0;
  const as_ = e.awayScore ?? 0;
  const homeWon = isFt && hs > as_;
  const awayWon = isFt && as_ > hs;
  return (
    <div style={{ padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "1fr 48px 1fr", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.homeTeam.logo} alt="" width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: homeWon ? 700 : 500, color: isFt && !homeWon ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.82)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {e.homeTeam.abbreviation || e.homeTeam.name}
        </span>
      </div>
      <div style={{ textAlign: "center" }}>
        {isFt || isLive
          ? <span style={{ fontSize: 12, fontWeight: 800, color: isLive ? "#22c55e" : "#fff" }}>{hs}–{as_}</span>
          : <span style={{ fontSize: 10, color: "#818CF8", fontWeight: 700 }}>{espnFmtTime(e.startTimestamp)}</span>
        }
        {isFt && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", fontWeight: 600, marginTop: 1 }}>FT</div>}
        {isLive && <div style={{ fontSize: 8, color: "#22c55e", fontWeight: 600, marginTop: 1 }}>LIVE</div>}
        {!isFt && !isLive && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>{espnFmtDate(e.startTimestamp)}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 11, fontWeight: awayWon ? 700 : 500, color: isFt && !awayWon ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.82)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>
          {e.awayTeam.abbreviation || e.awayTeam.name}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.awayTeam.logo} alt="" width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
      </div>
    </div>
  );
}

function MatchesPanelSkeleton() {
  return (
    <div style={{ background: "#161616", borderRadius: 12, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", borderBottom: "1px solid #1e1e1e" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>Matches</span>
      </div>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: 34, borderRadius: 6, background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    </div>
  );
}
