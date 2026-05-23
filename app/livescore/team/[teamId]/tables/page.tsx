export const dynamic = "force-dynamic";
import {
  getLsTeamResults, getLsTeamFixtures,
  getLsCompStandings, lsTeamImg,
} from "@/lib/livescoreCom";
import { TeamImg } from "@/app/livescore/TeamImg";

type Props = { params: Promise<{ teamId: string }> };

const COL = "28px 28px 1fr 34px 34px 34px 34px 46px 42px";

export default async function TeamTablesPage({ params }: Props) {
  const { teamId } = await params;

  const [results, fixtures] = await Promise.all([
    getLsTeamResults(teamId),
    getLsTeamFixtures(teamId),
  ]);

  const stageId = [...results, ...fixtures][0]?.Stg?.Sid;

  if (!stageId) {
    return <Empty label="No league table available — check back when the season starts." />;
  }

  const { tables, stageName } = await getLsCompStandings(stageId);
  const rows = tables[0]?.L ?? [];

  if (rows.length === 0) {
    return <Empty label="Standings not available yet." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {stageName && (
        <div style={{ fontSize: 11, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>
          {stageName}
        </div>
      )}
      <div className="table-scroll">
        <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden", minWidth: 460 }}>
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
            <span style={{ textAlign: "center" }}>Pts</span>
          </div>
          {rows.map((row, i) => {
            const gd = row.GD ?? (row.GF - row.GA);
            const isMe = row.Eid === teamId;
            return (
              <div key={row.Eid} style={{
                display: "grid", gridTemplateColumns: COL, gap: 4,
                padding: "9px 14px", alignItems: "center",
                borderBottom: i < rows.length - 1 ? "1px solid #181818" : "none",
                background: isMe ? "rgba(96,165,250,0.07)" : "#1c1c1c",
                borderLeft: isMe ? "3px solid #60a5fa" : "3px solid transparent",
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{row.Rnk}</span>
                <TeamImg src={lsTeamImg(row.TImg, row.Eid)} name={row.Tnm} size={22} />
                <span style={{ fontWeight: isMe ? 700 : 600, fontSize: 13, color: isMe ? "#60a5fa" : "#d8d8d8" }}>
                  {row.Tnm}
                </span>
                <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.Pld}</span>
                <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.W}</span>
                <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.D}</span>
                <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.L}</span>
                <span style={{ fontSize: 12, textAlign: "center", color: gd > 0 ? "#22c55e" : gd < 0 ? "#f87171" : "#888", fontWeight: 600 }}>
                  {gd > 0 ? `+${gd}` : gd}
                </span>
                <span style={{ fontSize: 14, textAlign: "center", fontWeight: 900, color: isMe ? "#fff" : "#888" }}>{row.Pts}</span>
              </div>
            );
          })}
        </div>
      </div>
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
