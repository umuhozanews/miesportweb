export const dynamic = "force-dynamic";
import { getLsCompTopScorers, lsTeamImg } from "@/lib/livescoreCom";
import { getESPNLeaders, type EspnLeaderEntry, type EspnLeaders } from "@/lib/espn";
import { TeamImg } from "@/app/livescore/TeamImg";
import Link from "next/link";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

const ESPN_LEAGUES: Record<string, string> = { "17": "eng.1", "16": "fifa.world" };

function Empty() {
  return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 13 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
      <p style={{ fontWeight: 600, color: "#666" }}>Player stats not yet available.</p>
    </div>
  );
}

function LeaderRow({ entry, i, last, statKey }: { entry: EspnLeaderEntry; i: number; last: boolean; statKey: "goals" | "assists" }) {
  const color = statKey === "goals" ? "#60a5fa" : "#22c55e";
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "32px 32px 1fr 1fr 44px 44px",
      gap: 4, padding: "10px 14px", alignItems: "center",
      borderBottom: !last ? "1px solid #181818" : "none",
      background: "#1c1c1c",
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{entry.rank}</span>
      {entry.athlete.headshot
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={entry.athlete.headshot} alt={entry.athlete.name} width={28} height={28} style={{ borderRadius: "50%", objectFit: "cover" }} />
        : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2a2a2a" }} />
      }
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.athlete.name}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={entry.team.logo} alt={entry.team.name} width={18} height={18} style={{ borderRadius: 2, objectFit: "contain" }} />
        <span style={{ fontSize: 11, color: "#484848", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.team.name}</span>
      </div>
      <span style={{ fontSize: 14, textAlign: "center", fontWeight: 900, color }}>{entry.value}</span>
      <span style={{ fontSize: 13, textAlign: "center", color: "#888" }}>—</span>
    </div>
  );
}

function LeaderTable({ leaders, statKey }: { leaders: EspnLeaderEntry[]; statKey: "goals" | "assists" }) {
  const label = statKey === "goals" ? "Top Scorers" : "Top Assists";
  const color = statKey === "goals" ? "#60a5fa" : "#22c55e";
  const colHeader = statKey === "goals" ? ["G", "—"] : ["A", "—"];
  return (
    <section>
      <h3 style={{ fontSize: 13, fontWeight: 800, color, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px" }}>
        {label}
      </h3>
      <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "32px 32px 1fr 1fr 44px 44px",
          gap: 4, padding: "9px 14px",
          background: "#141e30", color: "#354060",
          fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
        }}>
          <span>#</span><span /><span>Player</span><span>Club</span>
          <span style={{ textAlign: "center" }}>{colHeader[0]}</span>
          <span style={{ textAlign: "center" }}>{colHeader[1]}</span>
        </div>
        {leaders.slice(0, 25).map((entry, i) => (
          <LeaderRow key={entry.athlete.id} entry={entry} i={i} last={i === Math.min(leaders.length, 25) - 1} statKey={statKey} />
        ))}
      </div>
    </section>
  );
}

export default async function StatsPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;

  const espnLeague = ESPN_LEAGUES[tournamentId];

  if (espnLeague) {
    const { goals, assists } = await getESPNLeaders(espnLeague);
    if (goals.length === 0 && assists.length === 0) return <Empty />;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {goals.length > 0 && <LeaderTable leaders={goals} statKey="goals" />}
        {assists.length > 0 && <LeaderTable leaders={assists} statKey="assists" />}
      </div>
    );
  }

  // Livescore fallback
  const scorers = await getLsCompTopScorers(seasonId);
  if (scorers.length === 0) return <Empty />;

  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr 32px 44px 44px 44px",
        gap: 4, padding: "9px 14px",
        background: "#141e30", color: "#354060",
        fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
      }}>
        <span>#</span><span>Player</span><span />
        <span style={{ textAlign: "center" }}>G</span>
        <span style={{ textAlign: "center" }}>A</span>
        <span style={{ textAlign: "center" }}>MP</span>
      </div>
      {scorers.slice(0, 30).map((s, i) => (
        <div key={`${s.Pid}-${i}`} style={{
          display: "grid",
          gridTemplateColumns: "32px 1fr 32px 44px 44px 44px",
          gap: 4, padding: "10px 14px",
          alignItems: "center",
          borderBottom: i < scorers.length - 1 ? "1px solid #181818" : "none",
          background: "#1c1c1c",
        }}>
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
