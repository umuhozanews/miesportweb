export const dynamic = "force-dynamic";
import { seasonId, getWCNextMatches, getWCRecentMatches, getWCStandings, teamImg, fmtWCDate, fmtWCTime, type WCEvent, type WCGroup } from "@/lib/worldcup";

type Props = { params: Promise<{ year: string }> };

export default async function WCOverviewPage({ params }: Props) {
  const { year } = await params;
  const sid = seasonId(year);
  if (!sid) return <Empty label={`No data available for ${year}`} />;

  const [nextMatches, recentMatches, standings] = await Promise.all([
    getWCNextMatches(sid),
    getWCRecentMatches(sid),
    getWCStandings(sid),
  ]);

  const featuredMatches = nextMatches.length > 0 ? nextMatches.slice(0, 4) : recentMatches.slice(0, 4);
  const firstGroup = standings[0] ?? null;

  return (
    <div style={{ padding: "1.25rem" }}>
      {/* Featured match cards */}
      {featuredMatches.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <SectionLabel>{nextMatches.length > 0 ? "Upcoming Matches" : "Recent Results"}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {featuredMatches.map((e) => <FeaturedMatch key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* Standings preview */}
      {firstGroup && (
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <SectionLabel>Standings</SectionLabel>
            <a href={`/worldcup/${year}/standings`} style={{ textDecoration: "none", fontSize: 11, color: "#f5a623", fontWeight: 700 }}>Full view →</a>
          </div>
          <GroupStandingsPreview group={firstGroup} year={year} />
        </section>
      )}

      {featuredMatches.length === 0 && standings.length === 0 && <Empty label="No data available yet" />}
    </div>
  );
}

function FeaturedMatch({ event: e }: { event: WCEvent }) {
  const isLive = e.status.type === "inprogress";
  const isFt   = e.status.type === "finished";
  const hs = e.homeScore.current ?? 0;
  const as_ = e.awayScore.current ?? 0;

  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #222", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: "#3a3a3a", fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>
        {e.tournament?.name ?? "Match"} · {fmtWCDate(e.startTimestamp)}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TeamCard id={e.homeTeam.id} name={e.homeTeam.name} align="left" bold={isFt && hs > as_} dim={isFt && hs < as_} />

        <div style={{ textAlign: "center", padding: "0 10px", flexShrink: 0 }}>
          {isFt || isLive ? (
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: isLive ? "#22c55e" : "#f0f0f0", letterSpacing: -1 }}>{hs} – {as_}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: isLive ? "#22c55e" : "#444", marginTop: 2 }}>
                {isLive ? e.status.description : "FT"}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#60a5fa" }}>{fmtWCTime(e.startTimestamp)}</div>
              <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 2 }}>{fmtWCDate(e.startTimestamp)}</div>
            </div>
          )}
        </div>

        <TeamCard id={e.awayTeam.id} name={e.awayTeam.name} align="right" bold={isFt && as_ > hs} dim={isFt && as_ < hs} />
      </div>
    </div>
  );
}

function TeamCard({ id, name, align, bold, dim }: { id: number; name: string; align: "left" | "right"; bold?: boolean; dim?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "flex-end", gap: 6, flex: 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={teamImg(id)} alt="" width={32} height={32} style={{ objectFit: "contain" }} />
      <span style={{ fontSize: 12, fontWeight: bold ? 800 : 500, color: dim ? "#3a3a3a" : "#d8d8d8", textAlign: align, lineHeight: 1.2 }}>{name}</span>
    </div>
  );
}

function GroupStandingsPreview({ group, year }: { group: WCGroup; year: string }) {
  const COL = "24px 22px 1fr 28px 28px 28px 28px 36px";
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {/* Group header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "#141e30" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#e0e0e0" }}>{group.name}</span>
        <a href={`/worldcup/${year}/standings`} style={{ textDecoration: "none", fontSize: 10, color: "#60a5fa", fontWeight: 700 }}>See all groups →</a>
      </div>
      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "6px 12px", background: "#121212", fontSize: 9, fontWeight: 800, color: "#2e2e2e", textTransform: "uppercase", letterSpacing: 1 }}>
        <span>#</span><span /><span>Team</span>
        <span style={{ textAlign: "center" }}>P</span>
        <span style={{ textAlign: "center" }}>W</span>
        <span style={{ textAlign: "center" }}>D</span>
        <span style={{ textAlign: "center" }}>L</span>
        <span style={{ textAlign: "center" }}>Pts</span>
      </div>
      {group.rows.map((row, i) => {
        const isThrough = row.descriptions?.some((d) => d.type === "next-round");
        return (
          <div key={row.team.id} style={{
            display: "grid", gridTemplateColumns: COL, gap: 4, padding: "8px 12px",
            alignItems: "center",
            borderBottom: i < group.rows.length - 1 ? "1px solid #181818" : "none",
            background: "#1c1c1c",
            borderLeft: isThrough ? "3px solid #22c55e" : "3px solid transparent",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{row.position}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamImg(row.team.id)} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#d0d0d0" }}>{row.team.name}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#666" }}>{row.matches}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#666" }}>{row.draws}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
            <span style={{ fontSize: 13, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.points}</span>
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{children}</div>;
}
function Empty({ label }: { label: string }) {
  return <div style={{ padding: "3rem", textAlign: "center", color: "#444", fontSize: 13 }}>{label}</div>;
}
