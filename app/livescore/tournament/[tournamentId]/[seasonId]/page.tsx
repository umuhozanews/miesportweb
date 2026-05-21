export const dynamic = "force-dynamic";
import {
  getLsStageFixtures, getLsStageResults, getLsCompTopScorers,
  getLsCompStandings, lsTeamImg, type LsEvent,
} from "@/lib/livescoreCom";
import {
  getESPNLeagueFixtures, getESPNLeagueResults, getESPNLeagueStandings, getESPNLeaders,
  getESPNWCFixtures, getESPNWCResults, getESPNWCStandings,
  type EspnEvent, type EspnStandingRow,
} from "@/lib/espn";
import { TeamImg } from "@/app/livescore/TeamImg";
import { EspnMatchTable, CompMatchTable, Empty, COMP_ESPN_MAP } from "./_shared";
import Link from "next/link";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

// ── Mini standings strip ──────────────────────────────────────────────────────

function MiniStandings({ rows, base }: { rows: EspnStandingRow[]; base: string }) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "24px 24px 1fr 28px 28px 28px 36px",
        gap: 4, padding: "8px 12px",
        background: "#141e30", color: "#354060",
        fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
      }}>
        <span>#</span><span /><span>Team</span>
        <span style={{ textAlign: "center" }}>P</span>
        <span style={{ textAlign: "center" }}>W</span>
        <span style={{ textAlign: "center" }}>D</span>
        <span style={{ textAlign: "center" }}>Pts</span>
      </div>
      {rows.slice(0, 6).map((row, i) => {
        const pos = row.position > 0 ? row.position : i + 1;
        return (
          <div key={row.team.id} style={{
            display: "grid", gridTemplateColumns: "24px 24px 1fr 28px 28px 28px 36px",
            gap: 4, padding: "8px 12px", alignItems: "center",
            borderBottom: i < Math.min(rows.length, 6) - 1 ? "1px solid #181818" : "none",
            background: "#1c1c1c",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>{pos}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.team.logo} alt={row.team.name} width={18} height={18} style={{ borderRadius: 2, objectFit: "contain" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#d0d0d0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row.team.name}
            </span>
            <span style={{ fontSize: 11, textAlign: "center", color: "#888" }}>{row.played}</span>
            <span style={{ fontSize: 11, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
            <span style={{ fontSize: 11, textAlign: "center", color: "#888" }}>{row.draws}</span>
            <span style={{ fontSize: 13, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.points}</span>
          </div>
        );
      })}
      <Link href={`${base}/standings`} style={{
        display: "block", textAlign: "center", padding: "8px",
        fontSize: 12, fontWeight: 700, color: "#60a5fa",
        textDecoration: "none", borderTop: "1px solid #181818", background: "#181818",
      }}>
        Full standings →
      </Link>
    </div>
  );
}

function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase" }}>
        {title}
      </span>
      {href && (
        <Link href={href} style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", textDecoration: "none" }}>
          See all →
        </Link>
      )}
    </div>
  );
}

// ── ESPN Overview ─────────────────────────────────────────────────────────────

async function EspnOverview({
  league, base,
}: {
  league: string;
  base: string;
}) {
  const isWC = league === "fifa.world";
  const [fixtures, results, standingRows, { goals }] = await Promise.all([
    isWC ? getESPNWCFixtures()                            : getESPNLeagueFixtures(league),
    isWC ? getESPNWCResults()                             : getESPNLeagueResults(league),
    isWC ? getESPNWCStandings().then((gs) => gs[0]?.rows ?? []) : getESPNLeagueStandings(league),
    getESPNLeaders(league),
  ]);
  const standings = { rows: standingRows };

  const nextFixtures = fixtures.slice(0, 5);
  const recentResults = results.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Recent results */}
      <section>
        <SectionHeading title="Recent Results" href={`${base}/results`} />
        {recentResults.length > 0
          ? <EspnMatchTable events={recentResults} emptyLabel="No results yet" />
          : <Empty label="No results yet" />
        }
      </section>

      {/* Upcoming fixtures */}
      <section>
        <SectionHeading title="Upcoming Fixtures" href={`${base}/fixtures`} />
        {nextFixtures.length > 0
          ? <EspnMatchTable events={nextFixtures} emptyLabel="No upcoming fixtures" />
          : <Empty label="No upcoming fixtures" />
        }
      </section>

      {/* Standings preview */}
      {standings.rows.length > 0 && (
        <section>
          <SectionHeading title="Standings" href={`${base}/standings`} />
          <MiniStandings rows={standings.rows} base={base} />
        </section>
      )}

      {/* Top scorers */}
      {goals.length > 0 && (
        <section>
          <SectionHeading title="Top Scorers" href={`${base}/stats`} />
          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
            {goals.slice(0, 5).map((entry, i) => (
              <div key={entry.athlete.id} style={{
                display: "grid", gridTemplateColumns: "24px 28px 1fr 1fr 36px",
                gap: 8, padding: "9px 12px", alignItems: "center",
                borderBottom: i < 4 ? "1px solid #181818" : "none",
                background: "#1c1c1c",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>{entry.rank}</span>
                {entry.athlete.headshot
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={entry.athlete.headshot} alt={entry.athlete.name} width={24} height={24} style={{ borderRadius: "50%", objectFit: "cover" }} />
                  : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2a2a2a" }} />
                }
                <span style={{ fontSize: 12, fontWeight: 700, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.athlete.name}
                </span>
                <span style={{ fontSize: 11, color: "#484848", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.team.name}
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#60a5fa", textAlign: "center" }}>{entry.value}</span>
              </div>
            ))}
            <Link href={`${base}/stats`} style={{
              display: "block", textAlign: "center", padding: "8px",
              fontSize: 12, fontWeight: 700, color: "#60a5fa",
              textDecoration: "none", borderTop: "1px solid #181818", background: "#181818",
            }}>
              Full stats →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Livescore Overview ────────────────────────────────────────────────────────

async function LsOverview({ seasonId, base }: { seasonId: string; base: string }) {
  const [fixtures, results, { tables }, scorers] = await Promise.all([
    getLsStageFixtures(seasonId),
    getLsStageResults(seasonId),
    getLsCompStandings(seasonId),
    getLsCompTopScorers(seasonId),
  ]);

  const lsRows = tables[0]?.L ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Recent results */}
      <section>
        <SectionHeading title="Recent Results" href={`${base}/results`} />
        {results.length > 0
          ? <CompMatchTable events={results.slice(0, 5)} />
          : <Empty label="No results yet" />
        }
      </section>

      {/* Upcoming fixtures */}
      <section>
        <SectionHeading title="Upcoming Fixtures" href={`${base}/fixtures`} />
        {fixtures.length > 0
          ? <CompMatchTable events={fixtures.slice(0, 5)} />
          : <Empty label="No upcoming fixtures" />
        }
      </section>

      {/* Mini standings */}
      {lsRows.length > 0 && (
        <section>
          <SectionHeading title="Standings" href={`${base}/standings`} />
          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "24px 24px 1fr 28px 28px 28px 36px",
              gap: 4, padding: "8px 12px",
              background: "#141e30", color: "#354060",
              fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
            }}>
              <span>#</span><span /><span>Team</span>
              <span style={{ textAlign: "center" }}>P</span>
              <span style={{ textAlign: "center" }}>W</span>
              <span style={{ textAlign: "center" }}>D</span>
              <span style={{ textAlign: "center" }}>Pts</span>
            </div>
            {lsRows.slice(0, 6).map((row, i) => (
              <div key={row.Eid} style={{
                display: "grid", gridTemplateColumns: "24px 24px 1fr 28px 28px 28px 36px",
                gap: 4, padding: "8px 12px", alignItems: "center",
                borderBottom: i < 5 ? "1px solid #181818" : "none",
                background: "#1c1c1c",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>{row.Rnk}</span>
                <TeamImg src={lsTeamImg(row.TImg, row.Eid)} name={row.Tnm} size={18} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#d0d0d0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.Tnm}
                </span>
                <span style={{ fontSize: 11, textAlign: "center", color: "#888" }}>{row.Pld}</span>
                <span style={{ fontSize: 11, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.W}</span>
                <span style={{ fontSize: 11, textAlign: "center", color: "#888" }}>{row.D}</span>
                <span style={{ fontSize: 13, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.Pts}</span>
              </div>
            ))}
            <Link href={`${base}/standings`} style={{
              display: "block", textAlign: "center", padding: "8px",
              fontSize: 12, fontWeight: 700, color: "#60a5fa",
              textDecoration: "none", borderTop: "1px solid #181818", background: "#181818",
            }}>
              Full standings →
            </Link>
          </div>
        </section>
      )}

      {/* Top scorers */}
      {scorers.length > 0 && (
        <section>
          <SectionHeading title="Top Scorers" href={`${base}/stats`} />
          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
            {scorers.slice(0, 5).map((s, i) => (
              <div key={s.Pid} style={{
                display: "grid", gridTemplateColumns: "24px 28px 1fr 1fr 36px",
                gap: 8, padding: "9px 12px", alignItems: "center",
                borderBottom: i < 4 ? "1px solid #181818" : "none",
                background: "#1c1c1c",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>{s.Rnk ?? i + 1}</span>
                <TeamImg src={lsTeamImg(s.TImg ?? "", s.Tid)} name={s.Tnm} size={24} radius={12} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.Pnm}
                </span>
                <span style={{ fontSize: 11, color: "#484848", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.Tnm}
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#60a5fa", textAlign: "center" }}>{s.Gls}</span>
              </div>
            ))}
            <Link href={`${base}/stats`} style={{
              display: "block", textAlign: "center", padding: "8px",
              fontSize: 12, fontWeight: 700, color: "#60a5fa",
              textDecoration: "none", borderTop: "1px solid #181818", background: "#181818",
            }}>
              Full stats →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TournamentOverviewPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;
  const base = `/livescore/tournament/${tournamentId}/${seasonId}`;
  const espnCode = COMP_ESPN_MAP[tournamentId];

  if (espnCode) {
    return <EspnOverview league={espnCode} base={base} />;
  }
  return <LsOverview seasonId={seasonId} base={base} />;
}

// Re-export shared types for results page
export type { EspnEvent, LsEvent };
