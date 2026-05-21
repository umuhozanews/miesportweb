export const dynamic = "force-dynamic";
import { getLsSquad } from "@/lib/livescoreCom";
import { TeamImg } from "@/app/livescore/TeamImg";

type Props = { params: Promise<{ teamId: string }> };

const POS_LABEL: Record<string, string> = {
  GK: "Goalkeepers", DF: "Defenders", MF: "Midfielders", FW: "Forwards",
  G: "Goalkeepers", D: "Defenders", M: "Midfielders", F: "Forwards",
};
const POS_ORDER = ["GK", "G", "DF", "D", "MF", "M", "FW", "F"];

export default async function SquadPage({ params }: Props) {
  const { teamId } = await params;
  const players = await getLsSquad(teamId);

  if (players.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#555" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <p style={{ fontWeight: 600, margin: 0, color: "#666", fontSize: 14 }}>Squad data not available</p>
        <p style={{ fontSize: 12, marginTop: 6, color: "#444" }}>
          Use Results and Fixtures tabs to follow this team.
        </p>
      </div>
    );
  }

  const grouped = new Map<string, typeof players>();
  for (const p of players) {
    const pos = p.Pos ?? "Other";
    if (!grouped.has(pos)) grouped.set(pos, []);
    grouped.get(pos)!.push(p);
  }

  const sortedKeys = [
    ...POS_ORDER.filter((k) => grouped.has(k)),
    ...[...grouped.keys()].filter((k) => !POS_ORDER.includes(k)),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {sortedKeys.map((pos) => {
        const plrs = grouped.get(pos)!;
        return (
          <section key={pos}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: "#3a3a3a",
              letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8,
            }}>
              {POS_LABEL[pos] ?? pos}
            </div>
            <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
              {plrs.map((p, i) => (
                <div key={p.Pid} style={{
                  display: "grid",
                  gridTemplateColumns: "32px 36px 1fr auto",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  background: "#1c1c1c",
                  borderBottom: i < plrs.length - 1 ? "1px solid #181818" : "none",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#3a3a3a", textAlign: "center" }}>
                    {p.Sno ?? "—"}
                  </span>
                  <TeamImg
                    src={`/api/img?url=${encodeURIComponent(`https://storage.livescore.com/images/player/medium/${p.Img ?? p.Pid + ".png"}`)}`}
                    name={p.Pnm}
                    size={32}
                    radius={16}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#d8d8d8" }}>{p.Pnm}</div>
                    {p.Nat && (
                      <div style={{ fontSize: 11, color: "#484848", marginTop: 1 }}>{p.Nat}</div>
                    )}
                  </div>
                  {p.Age && (
                    <span style={{ fontSize: 11, color: "#3a3a3a" }}>Age {p.Age}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
