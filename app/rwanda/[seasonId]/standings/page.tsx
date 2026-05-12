export const dynamic = "force-dynamic";
import { getRPStandings, getRPTeamForms, teamImg, type RPStandingRow } from "@/lib/rwandapl";

type Props = { params: Promise<{ seasonId: string }>; searchParams: Promise<{ type?: string }> };

const COL = "26px 24px 1fr 30px 30px 30px 30px 40px 44px 110px 36px";

const FILTER_TABS = [
  { key: "total", label: "All" },
  { key: "home",  label: "Home" },
  { key: "away",  label: "Away" },
] as const;

export default async function RwandaStandingsPage({ params, searchParams }: Props) {
  const { seasonId } = await params;
  const { type } = await searchParams;
  const sid = Number(seasonId);
  const activeType = (["total", "home", "away"].includes(type ?? "") ? type : "total") as "total" | "home" | "away";

  const [rows, forms] = await Promise.all([
    getRPStandings(sid, activeType),
    getRPTeamForms(sid),
  ]);

  if (rows.length === 0) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#444", fontSize: 13 }}>Standings not available.</div>;
  }

  return (
    <div style={{ padding: "1.25rem" }}>
      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
        {FILTER_TABS.map(({ key, label }) => (
          <a key={key} href={`?type=${key}`} style={{ textDecoration: "none" }}>
            <span style={{
              display: "block", padding: "6px 18px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: key === activeType ? "#fff" : "#1e1e1e",
              color: key === activeType ? "#111" : "#555",
              border: key === activeType ? "none" : "1px solid #2a2a2a",
            }}>{label}</span>
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="table-scroll">
      <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden", minWidth: 560 }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px", background: "#141e30", fontSize: 9, fontWeight: 800, color: "#354060", textTransform: "uppercase", letterSpacing: 1 }}>
          <span>#</span><span />
          <span>Team</span>
          <span style={{ textAlign: "center" }}>P</span>
          <span style={{ textAlign: "center" }}>W</span>
          <span style={{ textAlign: "center" }}>D</span>
          <span style={{ textAlign: "center" }}>L</span>
          <span style={{ textAlign: "center" }}>DIFF</span>
          <span style={{ textAlign: "center" }}>GLS</span>
          <span style={{ textAlign: "center" }}>Last 5</span>
          <span style={{ textAlign: "center" }}>PTS</span>
        </div>
        {rows.map((row, i) => (
          <StandingRow key={row.team.id} row={row} i={i} total={rows.length} form={forms[row.team.id] ?? []} />
        ))}
      </div>
      </div>{/* /table-scroll */}

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        <LegendItem color="#f5a623" label="CAF Champions League" />
        <LegendItem color="#22c55e" label="CAF Confederation Cup" />
        <LegendItem color="#f87171" label="Relegation zone" />
      </div>
    </div>
  );
}

const FORM_COLORS: Record<string, { bg: string; color: string }> = {
  W: { bg: "#22c55e", color: "#fff" },
  D: { bg: "#3a3a3a", color: "#aaa" },
  L: { bg: "#f87171", color: "#fff" },
};

function StandingRow({ row, i, total, form }: { row: RPStandingRow; i: number; total: number; form: string[] }) {
  const isChampion = row.promotion?.id === 804;
  const isCaf = row.promotion?.id === 25;
  const isRelegation = row.position >= total - 1;
  const accent = isChampion ? "#f5a623" : isCaf ? "#22c55e" : isRelegation ? "#f87171" : "transparent";
  const gd = row.scoresFor - row.scoresAgainst;

  return (
    <div className="sf-row" style={{
      display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px",
      alignItems: "center",
      borderBottom: i < total - 1 ? "1px solid #181818" : "none",
      borderLeft: `3px solid ${accent}`,
      background: "#1c1c1c",
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a" }}>{row.position}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={teamImg(row.team.id)} alt="" width={22} height={22} style={{ objectFit: "contain" }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.team.name}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#666" }}>{row.matches}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#666" }}>{row.draws}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: gd > 0 ? "#22c55e" : gd < 0 ? "#f87171" : "#666", fontWeight: 600 }}>
        {row.scoreDiffFormatted ?? (gd > 0 ? `+${gd}` : gd)}
      </span>
      <span style={{ fontSize: 11, textAlign: "center", color: "#484848" }}>{row.scoresFor}:{row.scoresAgainst}</span>

      {/* Last 5 form badges */}
      <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
        {form.slice(0, 5).map((r, idx) => {
          const style = FORM_COLORS[r] ?? { bg: "#333", color: "#888" };
          return (
            <span key={idx} style={{
              width: 18, height: 18, borderRadius: 4, fontSize: 10, fontWeight: 800,
              background: style.bg, color: style.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>{r}</span>
          );
        })}
        {Array.from({ length: Math.max(0, 5 - form.length) }).map((_, idx) => (
          <span key={`e${idx}`} style={{ width: 18, height: 18, borderRadius: 4, background: "#1e1e1e", border: "1px solid #2a2a2a", flexShrink: 0 }} />
        ))}
      </div>

      <span style={{ fontSize: 15, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.points}</span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 10, color: "#555", fontWeight: 600 }}>{label}</span>
    </div>
  );
}
