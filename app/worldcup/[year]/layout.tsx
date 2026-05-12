import Link from "next/link";
import { WC_YEARS, tournamentImg, seasonId } from "@/lib/worldcup";
import { WCMatchesClient } from "./WCMatchesClient";
import { WCTabNav } from "./WCTabNav";

type Props = { params: Promise<{ year: string }>; children: React.ReactNode };

const STAGES_2026 = ["Group stage", "R32", "R16", "QF", "SF", "3rd", "Final"];
const STAGES_DEFAULT = ["Group stage", "R16", "QF", "SF", "3rd", "Final"];

export default async function WorldCupYearLayout({ params, children }: Props) {
  const { year } = await params;
  const sid = seasonId(year);

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
              src={tournamentImg()}
              alt="World Cup"
              width={70}
              height={70}
              style={{ objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 4px 20px rgba(255,180,60,0.35))" }}
            />

            {/* Title */}
            <div>
              <h1 style={{ fontSize: "clamp(18px, 4vw, 28px)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: -0.5, lineHeight: 1.1 }}>
                FIFA World Cup {year}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "5px 0 0", fontWeight: 500 }}>
                {sid ? "Group stage & match results" : "Historical data"}
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
          <div style={{ position: "relative", paddingBottom: "1.75rem" }}>
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
        {sid ? (
          <WCMatchesClient seasonId={sid} year={year} />
        ) : (
          <div style={{ background: "#161616", borderRadius: 12, border: "1px solid #1e1e1e", padding: "2rem", textAlign: "center", color: "#444", fontSize: 13 }}>
            Match data unavailable for {year}
          </div>
        )}

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
