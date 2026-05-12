import { getLsCompMeta, getLsCompStandings, lsCompImg } from "@/lib/livescoreCom";
import { TournamentNav } from "../TournamentNav";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }>; children: React.ReactNode };

export default async function TournamentSeasonLayout({ params, children }: Props) {
  const { tournamentId, seasonId } = await params;

  // Get competition name from meta (uses cached event fetch) or standings
  const [meta, standings] = await Promise.all([
    getLsCompMeta(seasonId),
    getLsCompStandings(seasonId),
  ]);

  const name = meta.name !== "Competition" ? meta.name : (standings.stageName || `Competition`);
  const country = meta.country || "";
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
        {badge ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lsCompImg(badge)}
            alt=""
            width={52}
            height={52}
            style={{ objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
          />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: 10, background: "#1e4db7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
            🏆
          </div>
        )}
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
