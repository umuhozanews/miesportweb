export const dynamic = "force-dynamic";
import { seasonId, getWCStandings, teamImg, type WCGroup, type WCStandingRow } from "@/lib/worldcup";

type Props = { params: Promise<{ year: string }>; searchParams: Promise<{ g?: string }> };

const COL = "26px 24px 1fr 30px 30px 30px 30px 42px 46px 36px";

export default async function WCStandingsPage({ params, searchParams }: Props) {
  const { year } = await params;
  const { g } = await searchParams;
  const sid = seasonId(year);
  if (!sid) return <div style={{ padding: "3rem", textAlign: "center", color: "#444" }}>No data for {year}</div>;

  const groups = await getWCStandings(sid);
  if (groups.length === 0) return <div style={{ padding: "3rem", textAlign: "center", color: "#444", fontSize: 13 }}>Standings not available yet.</div>;

  const activeIdx = Math.min(Math.max(parseInt(g ?? "0"), 0), groups.length - 1);
  const active = groups[activeIdx];

  return (
    <div style={{ padding: "1.25rem" }}>
      {/* Group selector pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
        {groups.map((grp, i) => (
          <a key={grp.name} href={`?g=${i}`} style={{ textDecoration: "none" }}>
            <span style={{
              display: "block", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: i === activeIdx ? "#fff" : "#1e1e1e",
              color: i === activeIdx ? "#111" : "#555",
              border: i === activeIdx ? "none" : "1px solid #2a2a2a",
            }}>
              {grp.name}
            </span>
          </a>
        ))}
      </div>

      {/* Standings table */}
      <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px", background: "#141e30", fontSize: 9, fontWeight: 800, color: "#354060", textTransform: "uppercase", letterSpacing: 1 }}>
          <span>#</span><span />
          <span>Team</span>
          <span style={{ textAlign: "center" }}>P</span>
          <span style={{ textAlign: "center" }}>W</span>
          <span style={{ textAlign: "center" }}>D</span>
          <span style={{ textAlign: "center" }}>L</span>
          <span style={{ textAlign: "center" }}>GD</span>
          <span style={{ textAlign: "center" }}>GF:GA</span>
          <span style={{ textAlign: "center" }}>Pts</span>
        </div>
        {active.rows.map((row, i) => <StandingRow key={row.team.id} row={row} i={i} total={active.rows.length} />)}
      </div>
    </div>
  );
}

function StandingRow({ row, i, total }: { row: WCStandingRow; i: number; total: number }) {
  const isThrough = row.descriptions?.some((d) => d.type === "next-round");
  const gd = row.scoresFor - row.scoresAgainst;
  return (
    <div className="sf-row" style={{
      display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px",
      alignItems: "center",
      borderBottom: i < total - 1 ? "1px solid #181818" : "none",
      borderLeft: isThrough ? "3px solid #22c55e" : "3px solid transparent",
      background: "#1c1c1c",
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{row.position}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={teamImg(row.team.id)} alt="" width={22} height={22} style={{ objectFit: "contain" }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "#d8d8d8" }}>{row.team.name}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#666" }}>{row.matches}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#666" }}>{row.draws}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: gd > 0 ? "#22c55e" : gd < 0 ? "#f87171" : "#666", fontWeight: 600 }}>{gd > 0 ? `+${gd}` : gd}</span>
      <span style={{ fontSize: 11, textAlign: "center", color: "#484848" }}>{row.scoresFor}:{row.scoresAgainst}</span>
      <span style={{ fontSize: 15, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.points}</span>
    </div>
  );
}
