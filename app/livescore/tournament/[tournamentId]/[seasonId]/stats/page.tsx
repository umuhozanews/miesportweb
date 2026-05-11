export const dynamic = "force-dynamic";
import Link from "next/link";
import { getTopPlayers, teamImg, playerImg, type SfTopPlayer } from "@/lib/sofascore";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

export default async function StatsPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;
  const { goals: scorers, assists: assisters, rating: rated } = await getTopPlayers(Number(tournamentId), Number(seasonId));

  if (scorers.length === 0 && assisters.length === 0 && rated.length === 0) {
    return <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 13 }}>Stats not available for this season.</div>;
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "1fr 1fr" }}>
      <StatTable title="Top Scorers" players={scorers.slice(0, 15)} statKey="goals" statLabel="G" />
      <StatTable title="Top Assists" players={assisters.slice(0, 15)} statKey="assists" statLabel="A" />
      <StatTable title="Top Rated" players={rated.slice(0, 15)} statKey="rating" statLabel="Rtg" decimal />
    </div>
  );
}

function StatTable({ title, players, statKey, statLabel, decimal }: {
  title: string;
  players: SfTopPlayer[];
  statKey: "goals" | "assists" | "rating";
  statLabel: string;
  decimal?: boolean;
}) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", background: "#141e30", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#e0e0e0", letterSpacing: 0.3 }}>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#354060", letterSpacing: 1 }}>{statLabel}</span>
      </div>

      {players.map((p, i) => {
        const val = p.statistics[statKey];
        const display = decimal && val != null ? Number(val).toFixed(2) : String(val ?? "—");
        return (
          <div
            key={p.player.id}
            className="sf-row"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: i < players.length - 1 ? "1px solid #181818" : "none", background: "#1c1c1c" }}
          >
            <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: "#3a3a3a", textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={playerImg(p.player.id)} alt="" width={26} height={26} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.player.name}
              </div>
              <Link href={`/livescore/team/${p.team.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teamImg(p.team.id)} alt="" width={11} height={11} style={{ objectFit: "contain" }} />
                <span style={{ fontSize: 10, color: "#484848" }}>{p.team.name}</span>
              </Link>
            </div>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#e8e8e8", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{display}</span>
          </div>
        );
      })}
    </div>
  );
}
