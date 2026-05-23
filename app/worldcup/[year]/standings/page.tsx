export const dynamic = "force-dynamic";
import { getESPNWCStandingsByYear, getWCDateRange, type EspnGroup, type EspnStandingRow } from "@/lib/espn";

type Props = { params: Promise<{ year: string }>; searchParams: Promise<{ g?: string }> };

const COL = "26px 24px 1fr 30px 30px 30px 30px 42px 46px 36px";

export default async function WCStandingsPage({ params, searchParams }: Props) {
  const { year } = await params;
  const { g } = await searchParams;

  if (getWCDateRange(year)) {
    const groups = await getESPNWCStandingsByYear(year);
    if (groups.length === 0) return <Empty label={year === "2026" ? "Standings will appear when the tournament begins June 11, 2026" : `No standings data for ${year}`} />;
    const activeIdx = Math.min(Math.max(parseInt(g ?? "0"), 0), groups.length - 1);
    const active = groups[activeIdx];
    return (
      <div style={{ padding: "1.25rem" }}>
        <GroupTabs groups={groups.map(gr => gr.name)} activeIdx={activeIdx} />
        <div className="table-scroll" style={{ borderRadius: 12, border: "1px solid rgba(67,56,202,0.25)", overflow: "hidden" }}>
          <div style={{ minWidth: 480 }}>
            <EspnHeader />
            {active.rows.map((row, i) => <EspnRow key={row.team.id} row={row} i={i} total={active.rows.length} />)}
          </div>
        </div>
      </div>
    );
  }

  return <Empty label={`No data available for ${year}`} />;
}

function GroupTabs({ groups, activeIdx }: { groups: string[]; activeIdx: number }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
      {groups.map((name, i) => (
        <a key={name} href={`?g=${i}`} style={{ textDecoration: "none" }}>
          <span style={{
            display: "block", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: i === activeIdx ? "rgba(67,56,202,0.75)" : "rgba(255,255,255,0.05)",
            color: i === activeIdx ? "#fff" : "rgba(255,255,255,0.42)",
            border: `1px solid ${i === activeIdx ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.08)"}`,
          }}>
            {name}
          </span>
        </a>
      ))}
    </div>
  );
}

function EspnHeader() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px", background: "rgba(67,56,202,0.18)", fontSize: 9, fontWeight: 800, color: "rgba(129,140,248,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>
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

function EspnRow({ row, i, total }: { row: EspnStandingRow; i: number; total: number }) {
  const gd = row.goalsFor - row.goalsAgainst;
  const pos = row.position > 0 ? row.position : i + 1;
  const isThrough = row.noteText
    ? row.noteText.toLowerCase().includes("advance") || row.noteText.toLowerCase().includes("qualify")
    : pos <= 2;
  return (
    <div style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px", alignItems: "center", borderBottom: i < total - 1 ? "1px solid rgba(67,56,202,0.12)" : "none", borderLeft: isThrough ? "3px solid #22c55e" : "3px solid transparent", background: "rgba(15,15,35,0.4)" }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.28)" }}>{pos}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={row.team.logo} alt="" width={22} height={22} style={{ objectFit: "contain" }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{row.team.name}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "rgba(255,255,255,0.38)" }}>{row.played}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "rgba(255,255,255,0.38)" }}>{row.draws}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
      <span style={{ fontSize: 12, textAlign: "center", color: gd > 0 ? "#22c55e" : gd < 0 ? "#f87171" : "rgba(255,255,255,0.38)", fontWeight: 600 }}>{gd > 0 ? `+${gd}` : gd}</span>
      <span style={{ fontSize: 11, textAlign: "center", color: "rgba(255,255,255,0.22)" }}>{row.goalsFor}:{row.goalsAgainst}</span>
      <span style={{ fontSize: 15, textAlign: "center", fontWeight: 900, color: "#fff" }}>{row.points}</span>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ padding: "3rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(67,56,202,0.1)", border: "1px solid rgba(67,56,202,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(129,140,248,0.5)" strokeWidth={1.4}><circle cx={12} cy={12} r={10} /><path strokeLinecap="round" d="M12 8v4m0 4h.01" /></svg>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 700, margin: 0 }}>{label}</p>
    </div>
  );
}
