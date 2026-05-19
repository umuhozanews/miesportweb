export const dynamic = "force-dynamic";
import Link from "next/link";
import { getLsCompTopScorers, lsTeamImg } from "@/lib/livescoreCom";
import { TeamImg } from "@/app/livescore/TeamImg";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

export default async function StatsPage({ params }: Props) {
  const { seasonId } = await params;
  const scorers = await getLsCompTopScorers(seasonId);

  if (scorers.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 13 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <p style={{ fontWeight: 600, color: "#666" }}>Player stats not yet available.</p>
        <p style={{ marginTop: 6, color: "#444" }}>Check back once matches have been played.</p>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr 32px 44px 44px 44px",
        gap: 4, padding: "9px 14px",
        background: "#141e30", color: "#354060",
        fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
      }}>
        <span>#</span>
        <span>Player</span>
        <span />
        <span style={{ textAlign: "center" }}>G</span>
        <span style={{ textAlign: "center" }}>A</span>
        <span style={{ textAlign: "center" }}>MP</span>
      </div>

      {scorers.slice(0, 30).map((s, i) => (
        <div
          key={`${s.Pid}-${i}`}
          style={{
            display: "grid",
            gridTemplateColumns: "32px 1fr 32px 44px 44px 44px",
            gap: 4, padding: "10px 14px",
            alignItems: "center",
            borderBottom: i < scorers.length - 1 ? "1px solid #181818" : "none",
            background: "#1c1c1c",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{s.Rnk ?? i + 1}</span>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.Pnm}</div>
            {s.Tnm && (
              <Link href={`/livescore/team/${s.Tid}`} style={{ textDecoration: "none" }}>
                <div style={{ fontSize: 11, color: "#484848", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.Tnm}</div>
              </Link>
            )}
          </div>
          <TeamImg src={lsTeamImg(s.TImg ?? "", s.Tid)} name={s.Tnm} size={22} />
          <span style={{ fontSize: 14, textAlign: "center", fontWeight: 900, color: "#60a5fa" }}>{s.Gls}</span>
          <span style={{ fontSize: 13, textAlign: "center", color: "#888" }}>{s.Ast ?? "—"}</span>
          <span style={{ fontSize: 12, textAlign: "center", color: "#484848" }}>{s.Pld ?? "—"}</span>
        </div>
      ))}

      <div style={{ padding: "8px 14px", fontSize: 10, color: "#2a3a50", fontWeight: 700, letterSpacing: 1 }}>
        G = GOALS · A = ASSISTS · MP = MATCHES PLAYED
      </div>
    </div>
  );
}
