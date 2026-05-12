export const dynamic = "force-dynamic";
import { getLsTeamResults } from "@/lib/livescoreCom";
import { EventList } from "../EventList";

type Props = { params: Promise<{ teamId: string }> };

export default async function ResultsPage({ params }: Props) {
  const { teamId } = await params;
  const results = await getLsTeamResults(teamId);
  return (
    <div>
      <h3 style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#6b7280", letterSpacing: 2, textTransform: "uppercase" }}>
        Recent Results
      </h3>
      <EventList events={results} teamId={teamId} />
    </div>
  );
}
