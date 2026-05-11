export const dynamic = "force-dynamic";
import { getTeamFixtures, getTeamResults } from "@/lib/sofascore";
import { EventList } from "./EventList";

type Props = { params: Promise<{ teamId: string }> };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
    </div>
  );
}

export default async function TeamOverviewPage({ params }: Props) {
  const { teamId } = await params;
  const id = Number(teamId);
  const [fixtures, results] = await Promise.all([getTeamFixtures(id), getTeamResults(id)]);

  return (
    <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "1fr 1fr" }}>
      <section>
        <SectionLabel>Next Fixtures</SectionLabel>
        <EventList events={fixtures.slice(0, 5)} teamId={id} />
      </section>
      <section>
        <SectionLabel>Recent Results</SectionLabel>
        <EventList events={results.slice(0, 5)} teamId={id} />
      </section>
    </div>
  );
}
