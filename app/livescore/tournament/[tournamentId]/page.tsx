export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getLatestSeasonId } from "@/lib/sofascore";

type Props = { params: Promise<{ tournamentId: string }> };

export default async function TournamentRootPage({ params }: Props) {
  const { tournamentId } = await params;
  const seasonId = await getLatestSeasonId(Number(tournamentId));
  if (seasonId) {
    redirect(`/livescore/tournament/${tournamentId}/${seasonId}`);
  }
  return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
      League data unavailable.
    </div>
  );
}
