export const dynamic = "force-dynamic";
import { getLsStageFixtures } from "@/lib/livescoreCom";
import { getESPNPLFixtures, getESPNWCFixtures } from "@/lib/espn";
import { EspnMatchTable, CompMatchTable, Empty, ESPN_LEAGUE } from "../_shared";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

export default async function TournamentFixturesPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;
  const espnLeague = ESPN_LEAGUE[tournamentId];

  if (espnLeague) {
    const fixtures = espnLeague === "pl" ? await getESPNPLFixtures() : await getESPNWCFixtures();
    if (fixtures.length === 0) {
      const results = espnLeague === "pl"
        ? await import("@/lib/espn").then((m) => m.getESPNPLResults())
        : await import("@/lib/espn").then((m) => m.getESPNWCResults());
      return <EspnMatchTable events={results.slice(0, 20)} emptyLabel="No upcoming fixtures" />;
    }
    return <EspnMatchTable events={fixtures} />;
  }

  const fixtures = await getLsStageFixtures(seasonId);
  if (fixtures.length === 0) return <Empty label="No upcoming fixtures" />;
  return <CompMatchTable events={fixtures} />;
}
