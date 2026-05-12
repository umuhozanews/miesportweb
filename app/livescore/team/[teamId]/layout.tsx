import { getLsTeam, lsTeamImg } from "@/lib/livescoreCom";
import { TeamNav } from "./TeamNav";

type Props = { params: Promise<{ teamId: string }>; children: React.ReactNode };

export default async function TeamLayout({ params, children }: Props) {
  const { teamId } = await params;
  const team = await getLsTeam(teamId);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem" }}>
      {/* Team header */}
      <div style={{
        background: "linear-gradient(135deg, #141e30 0%, #1a2540 100%)",
        borderRadius: "12px 12px 0 0",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: 18,
        border: "1px solid #1e2a3a",
        borderBottom: "none",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={team?.Img ? lsTeamImg(team.Img) : `https://storage.livescore.com/images/team/medium/${teamId}.png`}
          alt=""
          width={60}
          height={60}
          style={{ objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#f0f0f0", fontSize: 20, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>
            {team?.Nm ?? `Team ${teamId}`}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
            {team?.Cnm && (
              <span style={{ color: "#60a5fa", fontSize: 12, fontWeight: 600 }}>{team.Cnm}</span>
            )}
            {team?.CoachNm && (
              <>
                <span style={{ color: "#303040", fontSize: 11 }}>·</span>
                <span style={{ color: "#606070", fontSize: 12 }}>Mgr: {team.CoachNm}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: "#161616",
        borderRadius: "0 0 10px 10px",
        border: "1px solid #1e2a3a",
        borderTop: "1px solid #202020",
        marginBottom: "1rem",
      }}>
        <TeamNav teamId={teamId} />
      </div>

      {children}
    </div>
  );
}
