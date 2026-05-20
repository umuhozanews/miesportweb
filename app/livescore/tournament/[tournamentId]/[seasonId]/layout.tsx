import { getLsStageMeta } from "@/lib/livescoreCom";
import { TournamentNav } from "../TournamentNav";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }>; children: React.ReactNode };

// Static meta for ESPN-powered tournaments (no API call needed)
const STATIC_META: Record<string, { name: string; country: string; badge: string }> = {
  "17": { name: "Premier League", country: "England", badge: "https://api.sofascore.com/api/v1/unique-tournament/17/image" },
  "16": { name: "FIFA World Cup 2026", country: "International", badge: "https://api.sofascore.com/api/v1/unique-tournament/16/image" },
};

export default async function TournamentSeasonLayout({ params, children }: Props) {
  const { tournamentId, seasonId } = await params;

  let name = "Competition";
  let country = "";
  let badgeUrl = "";

  const staticMeta = STATIC_META[tournamentId];
  if (staticMeta) {
    name = staticMeta.name;
    country = staticMeta.country;
    badgeUrl = staticMeta.badge; // loaded by browser, not CF Worker
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
