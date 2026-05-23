export const dynamic = "force-dynamic";
import { getESPNLeagueStandings, getESPNWCStandings, type EspnStandingRow } from "@/lib/espn";
import { getLsCompStandings, lsTeamImg, type LsTableRow } from "@/lib/livescoreCom";
import { TeamImg } from "@/app/livescore/TeamImg";
import { COMP_ESPN_MAP } from "../../_shared";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

function Empty() {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#444" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
      <p style={{ fontWeight: 600, margin: 0, color: "#666", fontSize: 14 }}>Team stats not available.</p>
    </div>
  );
}

type TeamStatRow = {
  id: string;
  logo: string;
  name: string;
  played: number;
  gf: number;
  ga: number;
  gd: number;
  wins: number;
  gpg: number;
};

function StatTable({ title, rows, valueKey, valueLabel, color, ascending }: {
  title: string;
  rows: TeamStatRow[];
  valueKey: keyof TeamStatRow;
  valueLabel: string;
  color: string;
  ascending?: boolean;
}) {
  const sorted = [...rows].sort((a, b) =>
    ascending
      ? (a[valueKey] as number) - (b[valueKey] as number)
      : (b[valueKey] as number) - (a[valueKey] as number)
  );
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px", background: "#141e30",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, color, letterSpacing: 1, textTransform: "uppercase" }}>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#354060", letterSpacing: 1 }}>{valueLabel}</span>
      </div>
      {sorted.slice(0, 15).map((row, i) => (
        <div key={row.id} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
          borderBottom: i < Math.min(sorted.length, 15) - 1 ? "1px solid #181818" : "none",
          background: "#1c1c1c",
        }}>
          <span style={{ width: 20, fontSize: 11, fontWeight: 700, color: "#3a3a3a", flexShrink: 0 }}>{i + 1}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {row.logo.startsWith("http")
            ? <img src={row.logo} alt={row.name} width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
            : <TeamImg src={row.logo} name={row.name} size={22} />
          }
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.name}
          </span>
          <span style={{ fontSize: 16, fontWeight: 900, color, flexShrink: 0 }}>
            {typeof row[valueKey] === "number" && valueKey === "gpg"
              ? (row[valueKey] as number).toFixed(2)
              : row[valueKey]}
          </span>
        </div>
      ))}
    </div>
  );
}

function buildTeamStats(rows: Array<{ id: string; logo: string; name: string; played: number; gf: number; ga: number; wins: number }>): TeamStatRow[] {
  return rows.map((r) => ({
    ...r,
    gd: r.gf - r.ga,
    gpg: r.played > 0 ? r.gf / r.played : 0,
  }));
}

export default async function TournamentTeamStatsPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;
  const espnCode = COMP_ESPN_MAP[tournamentId];

  let teamRows: TeamStatRow[] = [];

  if (espnCode === "fifa.world") {
    const groups = await getESPNWCStandings();
    const flat = groups.flatMap((g) => g.rows);
    teamRows = buildTeamStats(flat.map((r) => ({
      id: r.team.id,
      logo: r.team.logo,
      name: r.team.name,
      played: r.played,
      gf: r.goalsFor,
      ga: r.goalsAgainst,
      wins: r.wins,
    })));
  } else if (espnCode) {
    const rows: EspnStandingRow[] = await getESPNLeagueStandings(espnCode);
    teamRows = buildTeamStats(rows.map((r) => ({
      id: r.team.id,
      logo: r.team.logo,
      name: r.team.name,
      played: r.played,
      gf: r.goalsFor,
      ga: r.goalsAgainst,
      wins: r.wins,
    })));
  } else {
    const { tables } = await getLsCompStandings(seasonId);
    const lsRows: LsTableRow[] = tables[0]?.L ?? [];
    teamRows = buildTeamStats(lsRows.map((r) => ({
      id: r.Eid,
      logo: lsTeamImg(r.TImg, r.Eid),
      name: r.Tnm,
      played: r.Pld,
      gf: r.GF,
      ga: r.GA,
      wins: r.W,
    })));
  }

  if (teamRows.length === 0) return <Empty />;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <StatTable
        title="Top Scoring Teams"
        rows={teamRows}
        valueKey="gf"
        valueLabel="Goals"
        color="#60a5fa"
      />
      <StatTable
        title="Best Defence"
        rows={teamRows}
        valueKey="ga"
        valueLabel="GA"
        color="#22c55e"
        ascending
      />
      <StatTable
        title="Goals per Game"
        rows={teamRows}
        valueKey="gpg"
        valueLabel="G/Game"
        color="#f59e0b"
      />
      <StatTable
        title="Most Wins"
        rows={teamRows}
        valueKey="wins"
        valueLabel="W"
        color="#a78bfa"
      />
    </div>
  );
}
