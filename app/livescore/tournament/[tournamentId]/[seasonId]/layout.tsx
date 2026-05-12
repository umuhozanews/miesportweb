import { getLsStageMeta, lsCompImg } from "@/lib/livescoreCom";
import { TournamentNav } from "../TournamentNav";
import { CompImg } from "@/app/livescore/TeamImg";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }>; children: React.ReactNode };

export default async function TournamentSeasonLayout({ params, children }: Props) {
  const { tournamentId, seasonId } = await params;

  const meta = await getLsStageMeta(seasonId);
  const name = meta.name;
  const country = meta.country;
  const badge = meta.badge;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem" }}>
      {/* League header */}
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
        <CompImg src={lsCompImg(badge)} size={52} radius={10} />
        <div>
          <div style={{ color: "#f0f0f0", fontSize: 19, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>
            {name}
          </div>
          {country && (
            <div style={{ color: "#60a5fa", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
              {country}
            </div>
          )}
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
        <TournamentNav tournamentId={tournamentId} seasonId={seasonId} />
      </div>

      {children}
    </div>
  );
}
