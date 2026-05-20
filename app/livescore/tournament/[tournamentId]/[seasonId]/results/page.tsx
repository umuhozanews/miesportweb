export const dynamic = "force-dynamic";
import { getLsStageResults } from "@/lib/livescoreCom";
import { getESPNPLResults, getESPNWCResults } from "@/lib/espn";
import { EspnMatchTable, CompMatchTable, Empty } from "../page";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

const ESPN_LEAGUE: Record<string, "pl" | "wc"> = { "17": "pl", "16": "wc" };

export default async function TournamentResultsPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;

  const espnLeague = ESPN_LEAGUE[tournamentId];
  if (espnLeague) {
    const results = espnLeague === "pl" ? await getESPNPLResults() : await getESPNWCResults();
    return <EspnMatchTable events={results} emptyLabel="No results yet" />;
  }

  const results = await getLsStageResults(seasonId);
  if (results.length === 0) return <Empty label="No results yet" />;
  return <CompMatchTable events={results} />;
}
