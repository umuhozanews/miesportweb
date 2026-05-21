export const dynamic = "force-dynamic";
import { getLsStageResults } from "@/lib/livescoreCom";
import { getESPNLeagueResults } from "@/lib/espn";
import { EspnMatchTable, CompMatchTable, Empty, COMP_ESPN_MAP } from "../_shared";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

export default async function TournamentResultsPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;
  const espnCode = COMP_ESPN_MAP[tournamentId];

  if (espnCode) {
    const results = await getESPNLeagueResults(espnCode);
    return <EspnMatchTable events={results} emptyLabel="No results yet" />;
  }

  const results = await getLsStageResults(seasonId);
  if (results.length === 0) return <Empty label="No results yet" />;
  return <CompMatchTable events={results} />;
}
