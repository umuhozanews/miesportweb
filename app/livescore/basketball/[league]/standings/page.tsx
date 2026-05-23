export const dynamic = "force-dynamic";
import { BBALL_LEAGUES, getESPNBballStandings } from "@/lib/espn";

type Props = { params: Promise<{ league: string }> };

export default async function BballStandingsPage({ params }: Props) {
  const { league } = await params;
  const info = BBALL_LEAGUES[league];
  if (!info) return <div style={{ padding: "3rem", textAlign: "center", color: "#555" }}>League not found.</div>;

  const conferences = await getESPNBballStandings(info.espnId);

  if (conferences.length === 0) {
    return <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#555", fontSize: 13 }}>Standings not available for {info.name}.</div>;
  }

  const COL = "32px 26px 1fr 36px 36px 36px 48px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {conferences.map((conf) => (
        <div key={conf.name}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{conf.name}</div>
          <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "8px 14px", background: "#1a1a1a", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: 1 }}>
              <span>#</span><span /><span>Team</span>
              <span style={{ textAlign: "center" }}>W</span>
              <span style={{ textAlign: "center" }}>L</span>
              <span style={{ textAlign: "center" }}>PCT</span>
              <span style={{ textAlign: "center" }}>PTS</span>
            </div>
            {conf.rows.map((row, i) => {
              const pct = row.played > 0 ? (row.wins / row.played).toFixed(3).replace("0.", ".") : ".000";
              const pos = row.position > 0 ? row.position : i + 1;
              const isPlayoffs = pos <= 8;
              return (
                <div key={row.team.id} style={{
                  display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px", alignItems: "center",
                  borderBottom: i < conf.rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  borderLeft: isPlayoffs ? "3px solid #22c55e" : "3px solid transparent",
                  background: "#1c1c1c",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.2)" }}>{pos}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.team.logo} alt="" width={22} height={22} style={{ objectFit: "contain" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#d8d8d8" }}>{row.team.name}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{pct}</span>
                  <span style={{ fontSize: 13, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
