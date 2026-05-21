export const dynamic = "force-dynamic";
import { getLsStageFixtures } from "@/lib/livescoreCom";
import { getESPNLeagueFixtures, getESPNLeagueResults, getESPNWCFixtures } from "@/lib/espn";
import { EspnMatchTable, CompMatchTable, Empty, COMP_ESPN_MAP } from "../_shared";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

export default async function TournamentFixturesPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;
  const espnCode = COMP_ESPN_MAP[tournamentId];

  if (espnCode) {
    const isWC = espnCode === "fifa.world";
    const fixtures = isWC ? await getESPNWCFixtures() : await getESPNLeagueFixtures(espnCode);
    if (fixtures.length === 0) {
      const results = await getESPNLeagueResults(espnCode);
      return <EspnMatchTable events={results.slice(0, 20)} emptyLabel="No upcoming fixtures" />;
    }
    return <EspnMatchTable events={fixtures} />;
  }

  const fixtures = await getLsStageFixtures(seasonId);
  if (fixtures.length === 0) return <Empty label="No upcoming fixtures" />;
  return <CompMatchTable events={fixtures} />;
}
