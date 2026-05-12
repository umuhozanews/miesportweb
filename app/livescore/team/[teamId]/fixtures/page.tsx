export const dynamic = "force-dynamic";
import { getLsTeamEvents } from "@/lib/livescoreCom";
import { EventList } from "../EventList";

type Props = { params: Promise<{ teamId: string }> };

export default async function FixturesPage({ params }: Props) {
  const { teamId } = await params;
  const fixtures = await getLsTeamEvents(teamId, "fix");
  return (
    <div>
      <h3 style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#6b7280", letterSpacing: 2, textTransform: "uppercase" }}>
        Upcoming Fixtures
      </h3>
      <EventList events={fixtures} teamId={teamId} />
    </div>
  );
}
