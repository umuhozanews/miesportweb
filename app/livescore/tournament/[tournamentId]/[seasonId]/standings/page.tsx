export const dynamic = "force-dynamic";
import Link from "next/link";
import { getLsCompStandings, lsTeamImg } from "@/lib/livescoreCom";
import {
  getESPNPLStandings, getESPNWCStandings,
  type EspnStandingRow, type EspnGroup,
} from "@/lib/espn";
import { TeamImg } from "@/app/livescore/TeamImg";
import { ESPN_LEAGUE } from "../_shared";

type Props = {
  params: Promise<{ tournamentId: string; seasonId: string }>;
  searchParams: Promise<{ g?: string; view?: string }>;
};

const COL = "28px 28px 1fr 34px 34px 34px 34px 48px 52px 42px";

const VIEWS = [
  { id: "overall", label: "Overall" },
  { id: "home",    label: "Home" },
  { id: "away",    label: "Away" },
  { id: "form",    label: "Form" },
];

function ViewTabs({ active, href }: { active: string; href: (v: string) => string }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: "0.75rem", flexWrap: "wrap" }}>
      {VIEWS.map((v) => (
        <Link key={v.id} href={href(v.id)} style={{ textDecoration: "none" }}>
          <span style={{
            display: "block", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: active === v.id ? "#60a5fa" : "#1e1e1e",
            color: active === v.id ? "#0a1628" : "#555",
            border: active === v.id ? "none" : "1px solid #2a2a2a",
          }}>
            {v.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

function TableHeader() {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px",
      background: "#141e30", color: "#354060", fontSize: 10, fontWeight: 800,
      letterSpacing: 1, textTransform: "uppercase",
    }}>
      <span>#</span><span /><span>Team</span>
      <span style={{ textAlign: "center" }}>P</span>
      <span style={{ textAlign: "center" }}>W</span>
      <span style={{ textAlign: "center" }}>D</span>
      <span style={{ textAlign: "center" }}>L</span>
      <span style={{ textAlign: "center" }}>GD</span>
      <span style={{ textAlign: "center" }}>GF:GA</span>
      <span style={{ textAlign: "center" }}>Pts</span>
    </div>
  );
}

const promotionColors: Record<string, string> = {
  "Champions League": "#2563eb",
  "Europa League": "#f97316",
  "Conference League": "#16a34a",
  "Relegation": "#dc2626",
};

function PLRow({ row, i, total }: { row: EspnStandingRow; i: number; total: number }) {
  const gd = row.goalsFor - row.goalsAgainst;
  const pos = row.position > 0 ? row.position : i + 1;
  const promoColor = row.noteText
    ? Object.entries(promotionColors).find(([k]) => row.noteText!.includes(k))?.[1] ?? "transparent"
    : "transparent";
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px",
      alignItems: "center",
      borderBottom: i < total - 1 ? "1px solid #181818" : "none",
      borderLeft: `3px solid ${promoColor}`,
      background: "#1c1c1c",
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{pos}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={row.team.logo} alt={row.team.name} width={22} height={22} style={{ borderRadius: 2, objectFit: "contain" }} />
      <span style={{ fontWeight: 600, fontSize: 13, color: "#d8d8d8" }}>{row.team.name}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.played}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.draws}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: gd > 0 ? "#22c55e" : gd < 0 ? "#f87171" : "#888", fontWeight: 600 }}>
        {gd > 0 ? `+${gd}` : gd}
      </span>
      <span style={{ fontSize: 11, textAlign: "center", color: "#484848" }}>{row.goalsFor}:{row.goalsAgainst}</span>
      <span style={{ fontSize: 14, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.points}</span>
    </div>
  );
}

function ComingSoon() {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#444" }}>
      <p style={{ fontWeight: 600, color: "#666", margin: 0, fontSize: 14 }}>Not available yet</p>
      <p style={{ fontSize: 12, color: "#444", marginTop: 4 }}>Switch to Overall for the current standings.</p>
    </div>
  );
}

export default async function StandingsPage({ params, searchParams }: Props) {
  const { tournamentId, seasonId } = await params;
  const { g, view = "overall" } = await searchParams;
  const espnLeague = ESPN_LEAGUE[tournamentId];

  const pageUrl = `/livescore/tournament/${tournamentId}/${seasonId}/standings`;

  // ── ESPN PL ──
  if (espnLeague === "pl") {
    const rows = await getESPNPLStandings();
    if (rows.length === 0) {
      return <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 13 }}>Standings not available yet.</div>;
    }
    return (
      <div style={{ padding: "0.5rem 0" }}>
        <ViewTabs active={view} href={(v) => `${pageUrl}?view=${v}`} />
        {view !== "overall" ? <ComingSoon /> : (
          <div className="table-scroll">
            <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden", minWidth: 480 }}>
              <TableHeader />
              {rows.map((row, i) => <PLRow key={row.team.id} row={row} i={i} total={rows.length} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ESPN WC ──
  if (espnLeague === "wc") {
    const groups = await getESPNWCStandings();
    if (groups.length === 0) {
      return <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 13 }}>Standings not available yet.</div>;
    }
    const activeIdx = Math.min(Math.max(parseInt(g ?? "0"), 0), groups.length - 1);
    const active = groups[activeIdx];
    return (
      <div style={{ padding: "0.5rem 0" }}>
        <ViewTabs active={view} href={(v) => `${pageUrl}?g=${activeIdx}&view=${v}`} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem", padding: "0 4px" }}>
          {groups.map((grp, i) => (
            <Link key={grp.name} href={`${pageUrl}?g=${i}&view=${view}`} style={{ textDecoration: "none" }}>
              <span style={{
                display: "block", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: i === activeIdx ? "#fff" : "#1e1e1e",
                color: i === activeIdx ? "#111" : "#555",
                border: i === activeIdx ? "none" : "1px solid #2a2a2a",
              }}>
                {grp.name}
              </span>
            </Link>
          ))}
        </div>
        {view !== "overall" ? <ComingSoon /> : (
          <div className="table-scroll">
            <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden", minWidth: 480 }}>
              <TableHeader />
              {active.rows.map((row, i) => <PLRow key={row.team.id} row={row} i={i} total={active.rows.length} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Livescore fallback ──
  const { tables } = await getLsCompStandings(seasonId);
  const lsRows = tables[0]?.L ?? [];

  if (lsRows.length === 0) {
    return <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 13 }}>Standings not available yet.</div>;
  }

  const gd = (r: (typeof lsRows)[0]) => r.GD ?? (r.GF - r.GA);

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <ViewTabs active={view} href={(v) => `${pageUrl}?view=${v}`} />
      {view !== "overall" ? <ComingSoon /> : (
        <div className="table-scroll">
          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden", minWidth: 480 }}>
            <TableHeader />
            {lsRows.map((row, i) => {
              const diff = gd(row);
              return (
                <div key={row.Eid} style={{
                  display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px",
                  alignItems: "center",
                  borderBottom: i < lsRows.length - 1 ? "1px solid #181818" : "none",
                  borderLeft: "3px solid transparent",
                  background: "#1c1c1c",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{row.Rnk}</span>
                  <TeamImg src={lsTeamImg(row.TImg, row.Eid)} name={row.Tnm} size={22} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#d8d8d8" }}>{row.Tnm}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.Pld}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.W}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: "#888" }}>{row.D}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.L}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: diff > 0 ? "#22c55e" : diff < 0 ? "#f87171" : "#888", fontWeight: 600 }}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                  <span style={{ fontSize: 11, textAlign: "center", color: "#484848" }}>{row.GF}:{row.GA}</span>
                  <span style={{ fontSize: 14, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.Pts}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
