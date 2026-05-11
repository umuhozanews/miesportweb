export const dynamic = "force-dynamic";
import { getTeamPlayers, playerImg, type SfPlayer } from "@/lib/sofascore";

const POS_ORDER = ["G", "GK", "D", "M", "F"];
const POS_LABEL: Record<string, string> = {
  G: "Goalkeepers", GK: "Goalkeepers", D: "Defenders", M: "Midfielders", F: "Forwards",
};

type Props = { params: Promise<{ teamId: string }> };

export default async function SquadPage({ params }: Props) {
  const { teamId } = await params;
  const players = await getTeamPlayers(Number(teamId));

  const byPos = new Map<string, SfPlayer[]>();
  for (const { player } of players) {
    const pos = player.position ?? "F";
    if (!byPos.has(pos)) byPos.set(pos, []);
    byPos.get(pos)!.push(player);
  }

  const COL = "2rem 2.5rem 1fr 110px 60px 70px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {POS_ORDER.filter((p) => byPos.has(p)).map((pos) => (
        <section key={pos}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase" }}>
              {POS_LABEL[pos] ?? pos}
            </span>
            <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
          </div>

          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
            {/* Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: COL,
              gap: 8,
              padding: "8px 14px",
              background: "#141e30",
              color: "#404060",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}>
              <span>#</span>
              <span />
              <span>Name</span>
              <span>Nationality</span>
              <span style={{ textAlign: "center" }}>Age</span>
              <span style={{ textAlign: "center" }}>Height</span>
            </div>

            {(byPos.get(pos) ?? []).map((p, i, arr) => {
              const age = p.dateOfBirthTimestamp
                ? Math.floor((Date.now() / 1000 - p.dateOfBirthTimestamp) / 31_536_000)
                : null;
              return (
                <div
                  key={p.id}
                  className="sf-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: COL,
                    gap: 8,
                    padding: "9px 14px",
                    alignItems: "center",
                    borderBottom: i < arr.length - 1 ? "1px solid #181818" : "none",
                    background: "#1c1c1c",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>
                    {p.jerseyNumber ?? "—"}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={playerImg(p.id)}
                    alt=""
                    width={28}
                    height={28}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#e8e8e8" }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: "#555" }}>{p.country?.name ?? "—"}</span>
                  <span style={{ fontSize: 13, color: "#888", textAlign: "center" }}>{age ?? "—"}</span>
                  <span style={{ fontSize: 13, color: "#888", textAlign: "center" }}>{p.height ? `${p.height} cm` : "—"}</span>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {players.length === 0 && (
        <p style={{ color: "#444", textAlign: "center", padding: "2rem 0", fontSize: 13 }}>Squad data unavailable.</p>
      )}
    </div>
  );
}
