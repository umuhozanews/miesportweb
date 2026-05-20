import { getLsStageMeta } from "@/lib/livescoreCom";
import { getTournamentSeasons, tournamentImg } from "@/lib/sofascore";
import { TournamentNav } from "../TournamentNav";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }>; children: React.ReactNode };

// Sofascore unique-tournament IDs we handle natively
const SF_UIDS: Record<string, number> = {
  "17": 17, // Premier League
  "16": 16, // World Cup
};

export default async function TournamentSeasonLayout({ params, children }: Props) {
  const { tournamentId, seasonId } = await params;

  let name = "Competition";
  let country = "";
  let badgeUrl = "";

  const sfUid = SF_UIDS[tournamentId];
  if (sfUid) {
    const seasons = await getTournamentSeasons(sfUid);
    const season = seasons.find((s) => String(s.id) === seasonId) ?? seasons[0];
    name = season?.name ?? "Competition";
    country = sfUid === 17 ? "England" : sfUid === 16 ? "International" : "";
    badgeUrl = tournamentImg(sfUid);
  } else {
    const meta = await getLsStageMeta(seasonId);
    name = meta.name;
    country = meta.country;
    badgeUrl = meta.badge
      ? `https://storage.livescore.com/images/competition/medium/${meta.badge}`
      : "";
  }

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
        {badgeUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={badgeUrl} alt={name} width={52} height={52} style={{ borderRadius: 10, objectFit: "contain" }} />
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
