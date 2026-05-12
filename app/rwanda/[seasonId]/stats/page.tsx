export const dynamic = "force-dynamic";
import Link from "next/link";
import { getRPStandings, getRPTeamForms, getRPTopPlayers, teamImg, type RPStandingRow, type RPTopPlayer } from "@/lib/rwandapl";

const BASE_SF = "https://api.sofascore.com/api/v1";
function playerImg(id: number) { return `${BASE_SF}/player/${id}/image`; }

type Props = { params: Promise<{ seasonId: string }> };

export default async function RwandaStatsPage({ params }: Props) {
  const { seasonId } = await params;
  const sid = Number(seasonId);

  const [rows, forms, topPlayers] = await Promise.all([
    getRPStandings(sid),
    getRPTeamForms(sid),
    getRPTopPlayers(sid),
  ]);

  const hasTeamStats = rows.length > 0;
  const hasPlayerStats = topPlayers.goals.length > 0 || topPlayers.assists.length > 0;

  if (!hasTeamStats && !hasPlayerStats) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#444", fontSize: 13 }}>Stats not available.</div>;
  }

  const byWins  = [...rows].sort((a, b) => b.wins - a.wins).slice(0, 8);
  const byGF    = [...rows].sort((a, b) => b.scoresFor - a.scoresFor).slice(0, 8);
  const byGD    = [...rows].sort((a, b) => (b.scoresFor - b.scoresAgainst) - (a.scoresFor - a.scoresAgainst)).slice(0, 8);
  const byClean = [...rows].sort((a, b) => a.scoresAgainst - b.scoresAgainst).slice(0, 8);

  return (
    <div style={{ padding: "1.25rem" }}>

      {/* ── Top Players (from Sofascore) ── */}
      {hasPlayerStats && (
        <section style={{ marginBottom: "1.5rem" }}>
          <SectionLabel>Top Players</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {topPlayers.goals.length > 0 && (
              <PlayerStatTable
                title="Top Scorers"
                players={topPlayers.goals.slice(0, 10)}
                getValue={(p) => String(p.statistics.goals ?? 0)}
                label="G"
                accent="#22c55e"
                playerImg={playerImg}
              />
            )}
            {topPlayers.assists.length > 0 && (
              <PlayerStatTable
                title="Top Assists"
                players={topPlayers.assists.slice(0, 10)}
                getValue={(p) => String(p.statistics.assists ?? 0)}
                label="A"
                accent="#60a5fa"
                playerImg={playerImg}
              />
            )}
            {topPlayers.rating.length > 0 && (
              <PlayerStatTable
                title="Top Rated"
                players={topPlayers.rating.slice(0, 10)}
                getValue={(p) => Number(p.statistics.rating ?? 0).toFixed(2)}
                label="Rtg"
                accent="#f5a623"
                playerImg={playerImg}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Team Statistics ── */}
      {hasTeamStats && (
        <>
          <SectionLabel>Team Statistics · {rows[0]?.matches ?? 0} rounds played</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <TeamStatTable title="Most Wins" rows={byWins} getValue={(r) => String(r.wins)} label="W" accent="#22c55e" forms={forms} />
            <TeamStatTable title="Top Scorers" rows={byGF} getValue={(r) => String(r.scoresFor)} label="GF" accent="#60a5fa" forms={forms} />
            <TeamStatTable title="Best Goal Diff" rows={byGD} getValue={(r) => { const gd = r.scoresFor - r.scoresAgainst; return gd > 0 ? `+${gd}` : String(gd); }} label="GD" accent="#f5a623" forms={forms} />
            <TeamStatTable title="Best Defense" rows={byClean} getValue={(r) => String(r.scoresAgainst)} label="GA" accent="#a855f7" forms={forms} />
          </div>

          {/* Form table */}
          <div style={{ marginTop: "1rem" }}>
            <FormTable rows={rows} forms={forms} />
          </div>
        </>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1, textTransform: "uppercase", marginBottom: "0.75rem" }}>
      {children}
    </div>
  );
}

function PlayerStatTable({
  title, players, getValue, label, accent, playerImg: getPlayerImg,
}: {
  title: string;
  players: RPTopPlayer[];
  getValue: (p: RPTopPlayer) => string;
  label: string;
  accent: string;
  playerImg: (id: number) => string;
}) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", background: "#141e30", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#e0e0e0", letterSpacing: 0.3 }}>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#354060", letterSpacing: 1 }}>{label}</span>
      </div>
      {players.map((p, i) => (
        <div key={p.player.id} className="sf-row" style={{
          display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
          borderBottom: i < players.length - 1 ? "1px solid #181818" : "none",
          background: "#1c1c1c",
        }}>
          <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: "#3a3a3a", textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getPlayerImg(p.player.id)} alt="" width={26} height={26} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.player.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamImg(p.team.id)} alt="" width={11} height={11} style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 10, color: "#484848" }}>{p.team.name}</span>
            </div>
          </div>
          <span style={{ fontSize: 17, fontWeight: 900, color: accent, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{getValue(p)}</span>
        </div>
      ))}
    </div>
  );
}

function TeamStatTable({
  title, rows, getValue, label, accent, forms,
}: {
  title: string; rows: RPStandingRow[]; getValue: (r: RPStandingRow) => string;
  label: string; accent: string; forms: Record<number, string[]>;
}) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", background: "#141e30", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#e0e0e0" }}>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#354060", letterSpacing: 1 }}>{label}</span>
      </div>
      {rows.map((row, i) => (
        <div key={row.team.id} className="sf-row" style={{
          display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
          borderBottom: i < rows.length - 1 ? "1px solid #181818" : "none",
          background: "#1c1c1c",
        }}>
          <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: "#3a3a3a", textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamImg(row.team.id)} alt="" width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.team.name}</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: accent, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{getValue(row)}</span>
        </div>
      ))}
    </div>
  );
}

const FORM_COLORS: Record<string, { bg: string; color: string }> = {
  W: { bg: "#22c55e", color: "#fff" },
  D: { bg: "#3a3a3a", color: "#aaa" },
  L: { bg: "#f87171", color: "#fff" },
};

function FormTable({ rows, forms }: { rows: RPStandingRow[]; forms: Record<number, string[]> }) {
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", background: "#141e30" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#e0e0e0" }}>Recent Form (Last 5)</span>
      </div>
      {sorted.map((row, i) => {
        const form = forms[row.team.id] ?? [];
        return (
          <div key={row.team.id} className="sf-row" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
            borderBottom: i < sorted.length - 1 ? "1px solid #181818" : "none",
            background: "#1c1c1c",
          }}>
            <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: "#3a3a3a", textAlign: "center", flexShrink: 0 }}>{row.position}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamImg(row.team.id)} alt="" width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.team.name}</span>
            <div style={{ display: "flex", gap: 3 }}>
              {form.slice(0, 5).map((r, idx) => {
                const s = FORM_COLORS[r] ?? { bg: "#333", color: "#888" };
                return (
                  <span key={idx} style={{ width: 20, height: 20, borderRadius: 4, fontSize: 10, fontWeight: 800, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{r}</span>
                );
              })}
              {Array.from({ length: Math.max(0, 5 - form.length) }).map((_, idx) => (
                <span key={`e${idx}`} style={{ width: 20, height: 20, borderRadius: 4, background: "#1e1e1e", border: "1px solid #2a2a2a", flexShrink: 0 }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
