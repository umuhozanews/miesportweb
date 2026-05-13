import Link from "next/link";
import { getRPSeasons, getRPRecentMatches, getRPCurrentRound, tournamentImg } from "@/lib/rwandapl";
import { RPMatchesClient } from "./RPMatchesClient";
import { RPTabNav } from "./RPTabNav";

type Props = { params: Promise<{ seasonId: string }>; children: React.ReactNode };

export default async function RwandaSeasonLayout({ params, children }: Props) {
  const { seasonId } = await params;
  const sid = Number(seasonId);

  const [seasons, recent, latestRound] = await Promise.all([
    getRPSeasons(),
    getRPRecentMatches(sid),
    getRPCurrentRound(sid),
  ]);

  const activeSeason = seasons.find((s) => s.id === sid);

  // Featured match: live first, else most recent finished
  const featured = recent.find((e) => e.status.type === "inprogress")
    ?? [...recent].sort((a, b) => b.startTimestamp - a.startTimestamp)[0]
    ?? null;

  return (
    <>
      {/* ── HERO ── */}
      <div style={{
        position: "relative",
        background: "linear-gradient(180deg, #071428 0%, #0d1e38 100%)",
        overflow: "hidden",
        borderBottom: "1px solid #0f2040",
      }}>
        {/* Blue + green glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 40% 80% at 10% 50%, rgba(30,77,183,0.3) 0%, transparent 70%), radial-gradient(ellipse 30% 60% at 90% 50%, rgba(22,163,74,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="hero-inner" style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "1rem" }}>
            {/* League logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tournamentImg()}
              alt="Rwanda Premier League"
              width={64}
              height={64}
              className="hero-logo"
              style={{ objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 4px 16px rgba(105,147,205,0.4))" }}
            />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-glow)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>Rwanda</div>
              <h1 style={{ fontSize: "clamp(18px, 4vw, 26px)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: -0.3, lineHeight: 1.1 }}>
                Rwanda Premier League
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "4px 0 0", fontWeight: 500 }}>
                {activeSeason?.name ?? `Season ${seasonId}`}
              </p>
            </div>
          </div>

          {/* Season pills */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {seasons.map((s) => (
              <Link key={s.id} href={`/rwanda/${s.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                <span style={{
                  display: "block",
                  padding: "5px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: s.id === sid ? "#ffffff" : "rgba(255,255,255,0.05)",
                  color: s.id === sid ? "#0a1628" : "rgba(255,255,255,0.45)",
                  border: s.id === sid ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}>
                  {s.year}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN BODY ── */}
      <div className="panel-body">
        {/* Left: Matches panel */}
        <RPMatchesClient seasonId={sid} initialRound={latestRound} featured={featured} />

        {/* Right: Tabs + content */}
        <div>
          <div style={{ background: "#161616", borderRadius: "10px 10px 0 0", border: "1px solid #1e1e1e", borderBottom: "1px solid #202020" }}>
            <RPTabNav seasonId={seasonId} />
          </div>
          <div style={{ background: "#141414", borderRadius: "0 0 12px 12px", border: "1px solid #1e1e1e", borderTop: "none", minHeight: 400 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
