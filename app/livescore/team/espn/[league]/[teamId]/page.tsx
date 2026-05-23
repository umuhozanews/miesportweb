export const dynamic = "force-dynamic";
import { getESPNTeamSchedule, espnFmtDate, espnFmtTime, type EspnEvent } from "@/lib/espn";
import { TeamImg } from "@/app/livescore/TeamImg";

type Props = { params: Promise<{ league: string; teamId: string }> };

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

function MatchRow({ event: e, focusTeamId }: { event: EspnEvent; focusTeamId: string }) {
  const isHome = e.homeTeam.id === focusTeamId;
  const opp = isHome ? e.awayTeam : e.homeTeam;
  const myScore = isHome ? e.homeScore : e.awayScore;
  const oppScore = isHome ? e.awayScore : e.homeScore;
  const won = e.status === "finished" && myScore !== null && oppScore !== null && myScore > oppScore;
  const lost = e.status === "finished" && myScore !== null && oppScore !== null && myScore < oppScore;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "60px 24px 1fr auto auto",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderBottom: "1px solid #181818",
      background: e.status === "live" ? "rgba(34,197,94,0.04)" : "#1c1c1c",
    }}>
      <div style={{ textAlign: "center" }}>
        {e.status === "live" ? (
          <span style={{ fontSize: 10, fontWeight: 900, color: "#22c55e" }}>LIVE</span>
        ) : e.status === "finished" ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#444" }}>FT</span>
        ) : (
          <div>
            <div style={{ fontSize: 9, color: "#484848" }}>{espnFmtDate(e.startTimestamp)}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>{espnFmtTime(e.startTimestamp)}</div>
          </div>
        )}
      </div>

      <span style={{
        fontSize: 9, fontWeight: 800, color: "#3a3a3a",
        background: "#222", padding: "2px 5px", borderRadius: 3,
        letterSpacing: 0.5, textAlign: "center",
      }}>
        {isHome ? "H" : "A"}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <TeamImg src={opp.logo} name={opp.name} size={18} />
        <span style={{ fontSize: 13, fontWeight: 500, color: "#d0d0d0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {opp.name}
        </span>
      </div>

      {(e.status === "finished" || e.status === "live") && myScore !== null && oppScore !== null ? (
        <span style={{
          fontSize: 14, fontWeight: 800,
          color: won ? "#22c55e" : lost ? "#f87171" : "#888",
          fontVariantNumeric: "tabular-nums", letterSpacing: -0.5,
          minWidth: 36, textAlign: "center",
        }}>
          {myScore}–{oppScore}
        </span>
      ) : (
        <span style={{ fontSize: 12, color: "#3a3a3a", minWidth: 36, textAlign: "center" }}>vs</span>
      )}

      {e.status === "finished" && myScore !== null && oppScore !== null && (
        <span className={`wdl ${won ? "wdl-w" : lost ? "wdl-l" : "wdl-d"}`}>
          {won ? "W" : lost ? "L" : "D"}
        </span>
      )}
    </div>
  );
}

export default async function EspnTeamOverviewPage({ params }: Props) {
  const { league, teamId } = await params;
  const allEvents = await getESPNTeamSchedule(league, teamId);

  const upcoming = allEvents
    .filter((e) => e.status === "scheduled" || e.status === "live")
    .sort((a, b) => a.startTimestamp - b.startTimestamp)
    .slice(0, 5);
  const results = allEvents
    .filter((e) => e.status === "finished")
    .sort((a, b) => b.startTimestamp - a.startTimestamp)
    .slice(0, 5);

  const Empty = ({ msg }: { msg: string }) => (
    <p style={{ color: "#555", fontSize: 13, padding: "1.5rem 0", textAlign: "center" }}>{msg}</p>
  );

  return (
    <div className="two-col-grid">
      <section>
        <SectionLabel>Next Fixtures</SectionLabel>
        {upcoming.length === 0 ? (
          <Empty msg="No upcoming fixtures." />
        ) : (
          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
            {upcoming.map((e) => <MatchRow key={e.id} event={e} focusTeamId={teamId} />)}
          </div>
        )}
      </section>
      <section>
        <SectionLabel>Recent Results</SectionLabel>
        {results.length === 0 ? (
          <Empty msg="No recent results." />
        ) : (
          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
            {results.map((e) => <MatchRow key={e.id} event={e} focusTeamId={teamId} />)}
          </div>
        )}
      </section>
    </div>
  );
}
