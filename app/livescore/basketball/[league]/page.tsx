export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  BBALL_LEAGUES,
  getESPNBballFixtures,
  getESPNBballResults,
  espnFmtDate,
  espnFmtTime,
  type EspnEvent,
} from "@/lib/espn";

type Props = { params: Promise<{ league: string }> };

function BballMatchRow({ event: e }: { event: EspnEvent }) {
  const isFt = e.status === "finished";
  const isLive = e.status === "live";
  const hs = e.homeScore;
  const as_ = e.awayScore;
  const homeWon = isFt && hs !== null && as_ !== null && hs > as_;
  const awayWon = isFt && hs !== null && as_ !== null && as_ > hs;

  return (
    <div style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, overflow: "hidden", marginBottom: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", alignItems: "stretch" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "6px 4px", flexDirection: "column", gap: 2 }}>
          {isLive ? (
            <span style={{ fontSize: 10, fontWeight: 900, color: "#22c55e" }}>LIVE</span>
          ) : isFt ? (
            <>
              <span style={{ fontSize: 9, color: "#484848" }}>{espnFmtDate(e.startTimestamp)}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#555" }}>FT</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 9, color: "#484848" }}>{espnFmtDate(e.startTimestamp)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa" }}>{espnFmtTime(e.startTimestamp)}</span>
            </>
          )}
        </div>
        <div>
          {[
            { team: e.homeTeam, score: hs, won: homeWon },
            { team: e.awayTeam, score: as_, won: awayWon },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: i === 0 ? "7px 12px 5px" : "5px 12px 7px", borderTop: i === 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.team.logo} width={16} height={16} alt="" style={{ objectFit: "contain", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: row.won ? 700 : 400, color: isFt && !row.won ? "rgba(255,255,255,0.3)" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.team.name}
              </span>
            </div>
          ))}
        </div>
        {(isFt || isLive) && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "6px 14px 6px 4px", gap: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: homeWon ? "#fff" : isLive ? "#22c55e" : "rgba(255,255,255,0.3)", lineHeight: "2", minWidth: 28, textAlign: "right" }}>{hs ?? "-"}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: awayWon ? "#fff" : isLive ? "#22c55e" : "rgba(255,255,255,0.3)", lineHeight: "2", minWidth: 28, textAlign: "right" }}>{as_ ?? "-"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{title}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export default async function BballOverviewPage({ params }: Props) {
  const { league } = await params;
  const info = BBALL_LEAGUES[league];
  if (!info) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#555" }}>League not found.</div>;
  }

  const [fixtures, results] = await Promise.all([
    getESPNBballFixtures(info.espnId),
    getESPNBballResults(info.espnId),
  ]);

  const base = `/livescore/basketball/${league}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Fixtures */}
      <section style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px" }}>
        <SectionLabel title="Fixtures" sub={`Key ${info.name} upcoming fixtures`} />
        {fixtures.slice(0, 3).map((e) => <BballMatchRow key={e.id} event={e} />)}
        {fixtures.length === 0 && <p style={{ color: "#555", fontSize: 13, textAlign: "center", padding: "1rem 0" }}>No upcoming fixtures.</p>}
        {fixtures.length > 0 && (
          <Link href={`${base}/fixtures`} style={{ display: "block", textAlign: "center", padding: "10px", marginTop: 6, background: "rgba(255,255,255,0.04)", borderRadius: 6, color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            View more upcoming fixtures
          </Link>
        )}
      </section>

      {/* Results */}
      <section style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px" }}>
        <SectionLabel title="Results" sub={`Catch up on the latest ${info.name} action`} />
        {results.slice(0, 3).map((e) => <BballMatchRow key={e.id} event={e} />)}
        {results.length === 0 && <p style={{ color: "#555", fontSize: 13, textAlign: "center", padding: "1rem 0" }}>No recent results.</p>}
        {results.length > 0 && (
          <Link href={`${base}/results`} style={{ display: "block", textAlign: "center", padding: "10px", marginTop: 6, background: "rgba(255,255,255,0.04)", borderRadius: 6, color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            View all recent results
          </Link>
        )}
      </section>
    </div>
  );
}
