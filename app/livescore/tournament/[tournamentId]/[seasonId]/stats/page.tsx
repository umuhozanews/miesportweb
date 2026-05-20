export const dynamic = "force-dynamic";
import Link from "next/link";
import { getLsCompTopScorers, lsTeamImg } from "@/lib/livescoreCom";
import { getTopPlayers, teamImg as sfTeamImg, playerImg } from "@/lib/sofascore";
import { TeamImg } from "@/app/livescore/TeamImg";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

const SF_UIDS: Record<string, number> = { "17": 17, "16": 16 };

function Empty() {
  return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 13 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
      <p style={{ fontWeight: 600, color: "#666" }}>Player stats not yet available.</p>
    </div>
  );
}

export default async function StatsPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;

  const sfUid = SF_UIDS[tournamentId];

  if (sfUid) {
    const { goals, assists } = await getTopPlayers(sfUid, Number(seasonId));

    if (goals.length === 0 && assists.length === 0) return <Empty />;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {goals.length > 0 && (
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60a5fa", letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px" }}>
              Top Scorers
            </h3>
            <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "32px 32px 1fr 1fr 44px 44px",
                gap: 4, padding: "9px 14px",
                background: "#141e30", color: "#354060",
                fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
              }}>
                <span>#</span><span /><span>Player</span><span>Club</span>
                <span style={{ textAlign: "center" }}>G</span>
                <span style={{ textAlign: "center" }}>A</span>
              </div>
              {goals.slice(0, 25).map((p, i) => (
                <div key={`${p.player.id}-g`} style={{
                  display: "grid", gridTemplateColumns: "32px 32px 1fr 1fr 44px 44px",
                  gap: 4, padding: "10px 14px", alignItems: "center",
                  borderBottom: i < Math.min(goals.length, 25) - 1 ? "1px solid #181818" : "none",
                  background: "#1c1c1c",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={playerImg(p.player.id)} alt={p.player.name} width={28} height={28} style={{ borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.player.name}</div>
                    {p.player.country?.name && (
                      <div style={{ fontSize: 10, color: "#484848" }}>{p.player.country.name}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sfTeamImg(p.team.id)} alt={p.team.name} width={18} height={18} style={{ borderRadius: 2, objectFit: "contain" }} />
                    <span style={{ fontSize: 11, color: "#484848", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.team.name}</span>
                  </div>
                  <span style={{ fontSize: 14, textAlign: "center", fontWeight: 900, color: "#60a5fa" }}>{p.statistics.goals ?? 0}</span>
                  <span style={{ fontSize: 13, textAlign: "center", color: "#888" }}>{p.statistics.assists ?? "—"}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {assists.length > 0 && (
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#22c55e", letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px" }}>
              Top Assists
            </h3>
            <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "32px 32px 1fr 1fr 44px 44px",
                gap: 4, padding: "9px 14px",
                background: "#141e30", color: "#354060",
                fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
              }}>
                <span>#</span><span /><span>Player</span><span>Club</span>
                <span style={{ textAlign: "center" }}>A</span>
                <span style={{ textAlign: "center" }}>G</span>
              </div>
              {assists.slice(0, 25).map((p, i) => (
                <div key={`${p.player.id}-a`} style={{
                  display: "grid", gridTemplateColumns: "32px 32px 1fr 1fr 44px 44px",
                  gap: 4, padding: "10px 14px", alignItems: "center",
                  borderBottom: i < Math.min(assists.length, 25) - 1 ? "1px solid #181818" : "none",
                  background: "#1c1c1c",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={playerImg(p.player.id)} alt={p.player.name} width={28} height={28} style={{ borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.player.name}</div>
                    {p.player.country?.name && (
                      <div style={{ fontSize: 10, color: "#484848" }}>{p.player.country.name}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sfTeamImg(p.team.id)} alt={p.team.name} width={18} height={18} style={{ borderRadius: 2, objectFit: "contain" }} />
                    <span style={{ fontSize: 11, color: "#484848", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.team.name}</span>
                  </div>
                  <span style={{ fontSize: 14, textAlign: "center", fontWeight: 900, color: "#22c55e" }}>{p.statistics.assists ?? 0}</span>
                  <span style={{ fontSize: 13, textAlign: "center", color: "#888" }}>{p.statistics.goals ?? "—"}</span>
                </div>
              ))}
            </div>
          </section>
        )}
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
        <span>#</span>
        <span>Player</span>
        <span />
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
