export const dynamic = "force-dynamic";
import { getTournamentResults } from "@/lib/sofascore";
import { MatchTable, Empty } from "../page";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

export default async function TournamentResultsPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;
  const results = await getTournamentResults(Number(tournamentId), Number(seasonId));
  if (results.length === 0) return <Empty label="No results yet" />;
  return <MatchTable events={results} />;
}
