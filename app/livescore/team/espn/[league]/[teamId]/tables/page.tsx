export const dynamic = "force-dynamic";
import { getESPNLeagueStandings, type EspnStandingRow } from "@/lib/espn";

type Props = { params: Promise<{ league: string; teamId: string }> };

const COL = "28px 32px 1fr 34px 34px 34px 34px 46px 52px 42px";

export default async function EspnTeamTablesPage({ params }: Props) {
  const { league, teamId } = await params;

  const rows = await getESPNLeagueStandings(league);

  if (rows.length === 0) {
    return <Empty label="Standings not available for this competition." />;
  }

  return (
    <div className="table-scroll">
      <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden", minWidth: 500 }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px",
          background: "#141e30", color: "#354060", fontSize: 10, fontWeight: 800,
          letterSpacing: 1, textTransform: "uppercase",
        }}>
          <span>#</span><span /><span>Team</span>
          <span style={{ textAlign: "center" }}>P</span>
          <span style={{ textAlign: "center" }}>W</span>
          <span style={{ textAlign: "center" }}>D</span>
          <span style={{ textAlign: "center" }}>L</span>
          <span style={{ textAlign: "center" }}>GD</span>
          <span style={{ textAlign: "center" }}>GF:GA</span>
          <span style={{ textAlign: "center" }}>Pts</span>
        </div>
        {rows.map((row, i) => (
          <EspnRow key={row.team.id} row={row} i={i} total={rows.length} isMe={row.team.id === teamId} />
        ))}
      </div>
    </div>
  );
}

function EspnRow({ row, i, total, isMe }: { row: EspnStandingRow; i: number; total: number; isMe: boolean }) {
  const gd = row.goalsFor - row.goalsAgainst;
  const pos = row.position > 0 ? row.position : i + 1;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px",
      alignItems: "center",
      borderBottom: i < total - 1 ? "1px solid #181818" : "none",
      background: isMe ? "rgba(96,165,250,0.07)" : "#1c1c1c",
      borderLeft: isMe ? "3px solid #60a5fa" : "3px solid transparent",
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{pos}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={row.team.logo} alt={row.team.name} width={22} height={22} style={{ borderRadius: 2, objectFit: "contain" }} />
      <span style={{ fontWeight: isMe ? 700 : 600, fontSize: 13, color: isMe ? "#60a5fa" : "#d8d8d8" }}>
        {row.team.name}
      </span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.played}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.draws}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: gd > 0 ? "#22c55e" : gd < 0 ? "#f87171" : "#888", fontWeight: 600 }}>
        {gd > 0 ? `+${gd}` : gd}
      </span>
      <span style={{ fontSize: 11, textAlign: "center", color: "#484848" }}>{row.goalsFor}:{row.goalsAgainst}</span>
      <span style={{ fontSize: 14, textAlign: "center", fontWeight: 900, color: isMe ? "#fff" : "#888" }}>{row.points}</span>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#444" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
      <p style={{ fontWeight: 600, margin: 0, color: "#666", fontSize: 14 }}>{label}</p>
    </div>
  );
}
