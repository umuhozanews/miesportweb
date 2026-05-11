export const dynamic = "force-dynamic";
import { seasonId, getWCTopPlayers, teamImg, type WCTopPlayer } from "@/lib/worldcup";

type Props = { params: Promise<{ year: string }> };

export default async function WCStatsPage({ params }: Props) {
  const { year } = await params;
  const sid = seasonId(year);
  if (!sid) return <div style={{ padding: "3rem", textAlign: "center", color: "#444" }}>No data for {year}</div>;

  const { goals, assists, rating } = await getWCTopPlayers(sid);

  if (goals.length === 0) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#444", fontSize: 13 }}>Stats not available for {year}.</div>;
  }

  return (
    <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <StatTable title="Top Scorers" players={goals.slice(0, 10)} statKey="goals" label="G" />
      <StatTable title="Top Assists" players={assists.slice(0, 10)} statKey="assists" label="A" />
      {rating.length > 0 && (
        <div style={{ gridColumn: "span 2" }}>
          <StatTable title="Top Rated" players={rating.slice(0, 10)} statKey="rating" label="Rtg" decimal />
        </div>
      )}
    </div>
  );
}

function StatTable({ title, players, statKey, label, decimal }: {
  title: string; players: WCTopPlayer[];
  statKey: "goals" | "assists" | "rating"; label: string; decimal?: boolean;
}) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", background: "#141e30", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#e0e0e0" }}>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#354060", letterSpacing: 1 }}>{label}</span>
      </div>
      {players.map((p, i) => {
        const val = p.statistics[statKey];
        const display = decimal && val != null ? Number(val).toFixed(2) : String(val ?? "—");
        return (
          <div key={p.player.id} className="sf-row" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
            borderBottom: i < players.length - 1 ? "1px solid #181818" : "none",
            background: "#1c1c1c",
          }}>
            <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: "#3a3a3a", textAlign: "center", flexShrink: 0 }}>
              {i + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.player.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teamImg(p.team.id)} alt="" width={11} height={11} style={{ objectFit: "contain" }} />
                <span style={{ fontSize: 10, color: "#484848" }}>{p.team.name}</span>
              </div>
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#e8e8e8", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{display}</span>
          </div>
        );
      })}
    </div>
  );
}
