export const dynamic = "force-dynamic";
import { getESPNLeadersByYear, getWCDateRange, type EspnLeaderEntry } from "@/lib/espn";

type Props = { params: Promise<{ year: string }> };

const WC_2026_START = new Date("2026-06-11T00:00:00Z");

export default async function WCStatsPage({ params }: Props) {
  const { year } = await params;

  if (!getWCDateRange(year)) {
    return <ComingSoon year={year} msg={`Historical player stats are not available for ${year}`} />;
  }

  if (year === "2026" && new Date() < WC_2026_START) {
    return <ComingSoon year={year} msg="Stats will be available once the tournament begins June 11, 2026" />;
  }

  const leaders = await getESPNLeadersByYear(year);

  if (leaders.goals.length === 0 && leaders.assists.length === 0) {
    return <ComingSoon year={year} msg={`Player stats not available for ${year}`} />;
  }

  return (
    <div style={{ padding: "1.25rem" }}>
      <div className="wc-stats-grid">
        {leaders.goals.length > 0 && <EspnLeaderTable title="Top Scorers" leaders={leaders.goals} label="G" />}
        {leaders.assists.length > 0 && <EspnLeaderTable title="Top Assists" leaders={leaders.assists} label="A" />}
      </div>
    </div>
  );
}

function EspnLeaderTable({ title, leaders, label }: { title: string; leaders: EspnLeaderEntry[]; label: string }) {
  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(67,56,202,0.25)", overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", background: "rgba(67,56,202,0.18)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(129,140,248,0.55)", letterSpacing: 1 }}>{label}</span>
      </div>
      {leaders.slice(0, 10).map((entry, i) => (
        <div key={entry.athlete.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: i < Math.min(leaders.length, 10) - 1 ? "1px solid rgba(67,56,202,0.12)" : "none", background: "rgba(15,15,35,0.45)" }}>
          <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
          {entry.athlete.headshot
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={entry.athlete.headshot} alt="" width={28} height={28} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(67,56,202,0.2)", flexShrink: 0 }} />
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.athlete.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.team.logo} alt="" width={11} height={11} style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{entry.team.name}</span>
            </div>
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function ComingSoon({ year, msg }: { year: string; msg: string }) {
  void year;
  return (
    <div style={{ padding: "3rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(67,56,202,0.1)", border: "1px solid rgba(67,56,202,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="rgba(129,140,248,0.5)" strokeWidth={1.4} strokeLinecap="round">
          <circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" />
        </svg>
      </div>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 700, margin: 0 }}>Stats not yet available</p>
      <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, margin: 0 }}>{msg}</p>
    </div>
  );
}
