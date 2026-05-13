export const dynamic = "force-dynamic";

import {
  getRPSeasonInfo,
  getRPStandings,
  getRPRecentMatches,
  teamImg,
  fmtRPDate,
  fmtRPTime,
  type RPStandingRow,
  type RPEvent,
} from "@/lib/rwandapl";

type Props = { params: Promise<{ seasonId: string }> };

export default async function RwandaDetailsPage({ params }: Props) {
  const { seasonId } = await params;
  const sid = Number(seasonId);

  const [info, rows, recent] = await Promise.all([
    getRPSeasonInfo(sid),
    getRPStandings(sid),
    getRPRecentMatches(sid),
  ]);

  const finished = recent.filter((e) => e.status.type === "finished");
  const totalMatches = info
    ? info.homeTeamWins + info.awayTeamWins + info.draws
    : (rows[0]?.matches ? rows[0].matches * rows.length : 0);

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── SEASON STATISTICS ── */}
      {info && (
        <section>
          <SectionLabel>Season Statistics</SectionLabel>

          {/* Key numbers grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 }}>
            <StatBox value={info.goals} label="Goals" color="#f5a623" />
            <StatBox value={totalMatches} label="Matches" color="#60a5fa" />
            <StatBox value={info.numberOfCompetitors} label="Teams" color="#a855f7" />
            <StatBox value={info.homeTeamWins} label="Home Wins" color="#22c55e" />
            <StatBox value={info.draws} label="Draws" color="#6b7280" />
            <StatBox value={info.awayTeamWins} label="Away Wins" color="#f87171" />
            <StatBox value={info.yellowCards} label="Yellow Cards" color="#eab308" />
            <StatBox value={info.redCards} label="Red Cards" color="#dc2626" />
            {totalMatches > 0 && (
              <StatBox
                value={(info.goals / totalMatches).toFixed(2)}
                label="Goals / Match"
                color="#c084fc"
              />
            )}
          </div>
        </section>
      )}

      {/* ── MATCH RESULTS BREAKDOWN ── */}
      {info && (
        <section>
          <SectionLabel>Result Breakdown</SectionLabel>
          <div style={{ background: "#1a1a1a", borderRadius: 10, border: "1px solid #222", padding: "16px 18px", marginTop: 10 }}>
            <BarChart
              segments={[
                { label: "Home Wins", value: info.homeTeamWins, color: "#22c55e" },
                { label: "Draws", value: info.draws, color: "#6b7280" },
                { label: "Away Wins", value: info.awayTeamWins, color: "#f87171" },
              ]}
              total={totalMatches}
            />
          </div>
        </section>
      )}

      {/* ── LEADER BOARD SNAPSHOT ── */}
      {rows.length > 0 && (
        <section>
          <SectionLabel>Top 5 Teams</SectionLabel>
          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden", marginTop: 10 }}>
            {rows.slice(0, 5).map((row, i) => (
              <LeaderRow key={row.team.id} row={row} i={i} total={Math.min(rows.length, 5)} />
            ))}
          </div>
        </section>
      )}

      {/* ── RECENT RESULTS ── */}
      {finished.length > 0 && (
        <section>
          <SectionLabel>Recent Results</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {finished.slice(0, 8).map((e) => <ResultRow key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* ── SOFASCORE LINK ── */}
      <a
        href={`https://www.sofascore.com/football/tournament/rwanda/national-league/10608#id:${sid},tab:details`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "12px 20px",
          background: "#141e30",
          border: "1px solid #1e2e48",
          borderRadius: 10,
          color: "#f5a623",
          fontWeight: 700,
          fontSize: 13,
          textDecoration: "none",
        }}
      >
        Full details on Sofascore →
      </a>

    </div>
  );
}

/* ── Sub-components ── */

function StatBox({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div style={{
      background: "#1a1a1a",
      border: "1px solid #222",
      borderRadius: 10,
      padding: "14px 12px",
      textAlign: "center",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 24, fontWeight: 900, color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#3a3a3a", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
    </div>
  );
}

function BarChart({ segments, total }: { segments: Array<{ label: string; value: number; color: string }>; total: number }) {
  if (total === 0) return null;
  return (
    <div>
      {/* Bar */}
      <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", gap: 1, marginBottom: 14 }}>
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ flex: s.value / total, background: s.color, minWidth: s.value > 0 ? 4 : 0 }}
          />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#777", fontWeight: 600 }}>
              {s.label}: <span style={{ color: "#c0c0c0", fontWeight: 800 }}>{s.value}</span>
              <span style={{ color: "#444", fontWeight: 600 }}> ({Math.round((s.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderRow({ row, i, total }: { row: RPStandingRow; i: number; total: number }) {
  const isFirst = row.position === 1;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderBottom: i < total - 1 ? "1px solid #181818" : "none",
      background: "#1c1c1c",
      borderLeft: isFirst ? "3px solid #f5a623" : "3px solid transparent",
    }}>
      <span style={{ width: 20, fontSize: 12, fontWeight: 700, color: isFirst ? "#f5a623" : "#3a3a3a", textAlign: "center", flexShrink: 0 }}>
        {row.position}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={teamImg(row.team.id)} alt="" width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {row.team.name}
      </span>
      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#555" }}>P{row.matches}</span>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#e8e8e8" }}>{row.points} pts</span>
      </div>
    </div>
  );
}

function ResultRow({ event: e }: { event: RPEvent }) {
  const hs = e.homeScore.current ?? 0;
  const as_ = e.awayScore.current ?? 0;
  return (
    <div style={{
      background: "#1a1a1a", border: "1px solid #222", borderRadius: 10,
      padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{ fontSize: 10, color: "#3a3a3a", minWidth: 52, textAlign: "center", flexShrink: 0 }}>
        <div>{fmtRPDate(e.startTimestamp)}</div>
        <div style={{ fontWeight: 700, marginTop: 1 }}>R{e.roundInfo?.round}</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamImg(e.homeTeam.id)} alt="" width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: hs > as_ ? 700 : 400, color: hs < as_ ? "#444" : "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {e.homeTeam.name}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: 44, textAlign: "center" }}>
        {hs} – {as_}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: as_ > hs ? 700 : 400, color: as_ < hs ? "#444" : "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
          {e.awayTeam.name}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamImg(e.awayTeam.id)} alt="" width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase" }}>
      {children}
    </div>
  );
}
