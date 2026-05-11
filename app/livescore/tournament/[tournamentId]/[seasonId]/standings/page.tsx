export const dynamic = "force-dynamic";
import Link from "next/link";
import { getStandings, teamImg } from "@/lib/sofascore";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

const PROMO_COLORS: Record<string, string> = {
  "Champions League": "#3b82f6",
  "Europa League":   "#f97316",
  "Promotion":       "#22c55e",
  "Relegation":      "#ef4444",
};

function promoColor(text?: string) {
  if (!text) return null;
  return Object.entries(PROMO_COLORS).find(([k]) => text.includes(k))?.[1] ?? "#3b82f6";
}

const COL = "28px 28px 1fr 34px 34px 34px 34px 48px 52px 42px";

export default async function StandingsPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;
  const rows = await getStandings(Number(tournamentId), Number(seasonId));

  if (rows.length === 0) {
    return <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 13 }}>Standings not available yet.</div>;
  }

  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: COL,
        gap: 4,
        padding: "9px 14px",
        background: "#141e30",
        color: "#354060",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: "uppercase",
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
        const pc = promoColor(row.promotion?.text);
        const gd = row.scoresFor - row.scoresAgainst;
        return (
          <div
            key={row.team.id}
            className="sf-row"
            style={{
              display: "grid",
              gridTemplateColumns: COL,
              gap: 4,
              padding: "9px 14px",
              alignItems: "center",
              borderBottom: i < rows.length - 1 ? "1px solid #181818" : "none",
              borderLeft: pc ? `3px solid ${pc}` : "3px solid transparent",
              background: "#1c1c1c",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{row.position}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamImg(row.team.id)} alt="" width={22} height={22} style={{ objectFit: "contain" }} />
            <Link href={`/livescore/team/${row.team.id}`} style={{ textDecoration: "none" }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#d8d8d8" }}>{row.team.name}</span>
            </Link>
            <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.matches}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.draws}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: gd > 0 ? "#22c55e" : gd < 0 ? "#f87171" : "#888", fontWeight: 600 }}>
              {gd > 0 ? `+${gd}` : gd}
            </span>
            <span style={{ fontSize: 11, textAlign: "center", color: "#484848" }}>{row.scoresFor}:{row.scoresAgainst}</span>
            <span style={{ fontSize: 14, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.points}</span>
          </div>
        );
      })}

      {/* Legend */}
      <div style={{ padding: "10px 14px", display: "flex", gap: 16, flexWrap: "wrap", borderTop: "1px solid #181818", background: "#161616" }}>
        {Object.entries(PROMO_COLORS).map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
            <span style={{ fontSize: 10, color: "#3a3a3a", fontWeight: 700 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
