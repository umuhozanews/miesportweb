export const dynamic = "force-dynamic";
import Link from "next/link";
import { getLsCompStandings, lsTeamImg } from "@/lib/livescoreCom";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

const COL = "28px 28px 1fr 34px 34px 34px 34px 48px 52px 42px";

export default async function StandingsPage({ params }: Props) {
  const { seasonId } = await params;
  const { tables } = await getLsCompStandings(seasonId);
  const rows = tables[0]?.L ?? [];

  if (rows.length === 0) {
    return <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 13 }}>Standings not available yet.</div>;
  }

  const gd = (r: (typeof rows)[0]) => r.GD ?? (r.GF - r.GA);

  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px",
        background: "#141e30", color: "#354060", fontSize: 10, fontWeight: 800,
        letterSpacing: 1, textTransform: "uppercase",
      }}>
        <span>#</span>
        <span />
        <span>Team</span>
        <span style={{ textAlign: "center" }}>P</span>
        <span style={{ textAlign: "center" }}>W</span>
        <span style={{ textAlign: "center" }}>D</span>
        <span style={{ textAlign: "center" }}>L</span>
        <span style={{ textAlign: "center" }}>GD</span>
        <span style={{ textAlign: "center" }}>GF:GA</span>
        <span style={{ textAlign: "center" }}>Pts</span>
      </div>

      {rows.map((row, i) => {
        const diff = gd(row);
        return (
          <div
            key={row.Eid}
            className="sf-row"
            style={{
              display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px",
              alignItems: "center",
              borderBottom: i < rows.length - 1 ? "1px solid #181818" : "none",
              borderLeft: "3px solid transparent",
              background: "#1c1c1c",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{row.Rnk}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lsTeamImg(row.TImg)} alt="" width={22} height={22} style={{ objectFit: "contain" }} />
            <Link href={`/livescore/team/${row.Eid}`} style={{ textDecoration: "none" }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#d8d8d8" }}>{row.Tnm}</span>
            </Link>
            <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.Pld}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.W}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.D}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.L}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: diff > 0 ? "#22c55e" : diff < 0 ? "#f87171" : "#888", fontWeight: 600 }}>
              {diff > 0 ? `+${diff}` : diff}
            </span>
            <span style={{ fontSize: 11, textAlign: "center", color: "#484848" }}>{row.GF}:{row.GA}</span>
            <span style={{ fontSize: 14, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.Pts}</span>
          </div>
        );
      })}
    </div>
  );
}
