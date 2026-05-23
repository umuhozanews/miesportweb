import { getESPNTeamInfo } from "@/lib/espn";
import { TeamImg } from "@/app/livescore/TeamImg";
import { EspnTeamNav } from "./EspnTeamNav";

type Props = { params: Promise<{ league: string; teamId: string }>; children: React.ReactNode };

export default async function EspnTeamLayout({ params, children }: Props) {
  const { league, teamId } = await params;
  const team = await getESPNTeamInfo(league, teamId);
  const accent = team?.color ? `#${team.color}` : "1e3a6e";
  const base = `/livescore/team/espn/${league}/${teamId}`;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem 0.75rem" }}>
      <div style={{
        background: `linear-gradient(135deg, #${accent.replace("#", "")}22 0%, #1a1a1a 100%)`,
        borderRadius: "12px 12px 0 0",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: 18,
        border: "1px solid #222",
        borderBottom: "none",
      }}>
        <TeamImg
          src={team?.logo ?? ""}
          name={team?.name ?? `Team ${teamId}`}
          size={60}
          radius={10}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#f0f0f0", fontSize: 20, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>
            {team?.name ?? `Team ${teamId}`}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
            {team?.leagueName && (
              <span style={{ color: "#60a5fa", fontSize: 12, fontWeight: 600 }}>{team.leagueName}</span>
            )}
            {team?.standingSummary && (
              <>
                <span style={{ color: "#303040", fontSize: 11 }}>·</span>
                <span style={{ color: "#606070", fontSize: 12 }}>{team.standingSummary}</span>
              </>
            )}
            {team?.record && (
              <>
                <span style={{ color: "#303040", fontSize: 11 }}>·</span>
                <span style={{ color: "#606070", fontSize: 12 }}>{team.record}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{
        background: "#161616",
        borderRadius: "0 0 10px 10px",
        border: "1px solid #222",
        borderTop: "1px solid #202020",
        marginBottom: "1rem",
      }}>
        <EspnTeamNav base={base} />
      </div>

      {children}
    </div>
  );
}
