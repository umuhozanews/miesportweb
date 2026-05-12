export const dynamic = "force-dynamic";
import { getLsCompEvents } from "@/lib/livescoreCom";
import { CompMatchTable, Empty } from "../page";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

export default async function TournamentResultsPage({ params }: Props) {
  const { seasonId } = await params;
  const results = await getLsCompEvents(seasonId, "res");
  if (results.length === 0) return <Empty label="No results yet" />;
  return <CompMatchTable events={results} />;
}
