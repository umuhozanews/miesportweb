export const dynamic = "force-dynamic";
import { getLsTeamResults, lsIsFinished, type LsEvent } from "@/lib/livescoreCom";

type Props = { params: Promise<{ teamId: string }> };

function computeStats(events: LsEvent[], teamId: string) {
  let played = 0, won = 0, drew = 0, lost = 0, gf = 0, ga = 0, cs = 0;
  for (const e of events) {
    if (!lsIsFinished(e)) continue;
    const isHome = e.T1?.[0]?.ID === teamId;
    const hs = e.Tr1 !== undefined ? Number(e.Tr1) : null;
    const as_ = e.Tr2 !== undefined ? Number(e.Tr2) : null;
    if (hs === null || as_ === null) continue;
    const my = isHome ? hs : as_;
    const opp = isHome ? as_ : hs;
    played++;
    gf += my;
    ga += opp;
    if (my > opp) won++;
    else if (my === opp) drew++;
    else lost++;
    if (opp === 0) cs++;
  }
  return { played, won, drew, lost, gf, ga, cs };
}

function FormDot({ result }: { result: "W" | "D" | "L" }) {
  const bg = result === "W" ? "#22c55e" : result === "L" ? "#f87171" : "#f59e0b";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: "50%",
      background: `${bg}22`, border: `1px solid ${bg}55`,
      fontSize: 11, fontWeight: 800, color: bg,
    }}>
      {result}
    </span>
  );
}

export default async function TeamStatsPage({ params }: Props) {
  const { teamId } = await params;
  const results = await getLsTeamResults(teamId);

  if (results.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#555" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <p style={{ fontWeight: 600, margin: 0, color: "#666", fontSize: 14 }}>No stats available yet.</p>
      </div>
    );
  }

  const stats = computeStats(results, teamId);
  const finished = results.filter((e) => lsIsFinished(e));
  const form5 = finished.slice(0, 5).map((e) => {
    const isHome = e.T1?.[0]?.ID === teamId;
    const hs = e.Tr1 !== undefined ? Number(e.Tr1) : 0;
    const as_ = e.Tr2 !== undefined ? Number(e.Tr2) : 0;
    const my = isHome ? hs : as_;
    const opp = isHome ? as_ : hs;
    return (my > opp ? "W" : my < opp ? "L" : "D") as "W" | "D" | "L";
  });

  const statBlocks = [
    { label: "Played",  value: stats.played, color: "#e8e8e8" },
    { label: "Won",     value: stats.won,    color: "#22c55e" },
    { label: "Drawn",   value: stats.drew,   color: "#f59e0b" },
    { label: "Lost",    value: stats.lost,   color: "#f87171" },
  ];
  const goalBlocks = [
    { label: "Goals For",     value: stats.gf, color: "#60a5fa" },
    { label: "Goals Against", value: stats.ga, color: "#f87171" },
    { label: "Clean Sheets",  value: stats.cs, color: "#22c55e" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Match stats */}
      <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
        <div style={{
          padding: "9px 14px", background: "#141e30",
          fontSize: 10, fontWeight: 800, color: "#354060",
          letterSpacing: 1, textTransform: "uppercase",
        }}>
          Recent Record (last 7 days)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "1.25rem 1rem" }}>
          {statBlocks.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: "0 1rem 1.25rem", borderTop: "1px solid #181818" }}>
          {goalBlocks.map((s) => (
            <div key={s.label} style={{ textAlign: "center", paddingTop: 14 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent form */}
      {form5.length > 0 && (
        <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
          <div style={{
            padding: "9px 14px", background: "#141e30",
            fontSize: 10, fontWeight: 800, color: "#354060",
            letterSpacing: 1, textTransform: "uppercase",
          }}>
            Recent Form
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "1rem 14px" }}>
            {form5.map((r, i) => <FormDot key={i} result={r} />)}
          </div>
        </div>
      )}

      {/* Win rate bar */}
      {stats.played > 0 && (
        <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
          <div style={{
            padding: "9px 14px", background: "#141e30",
            fontSize: 10, fontWeight: 800, color: "#354060",
            letterSpacing: 1, textTransform: "uppercase",
          }}>
            Result Distribution
          </div>
          <div style={{ padding: "1rem 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Win",  val: stats.won,  color: "#22c55e" },
              { label: "Draw", val: stats.drew, color: "#f59e0b" },
              { label: "Loss", val: stats.lost, color: "#f87171" },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.color, minWidth: 30 }}>{r.label}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#2a2a2a" }}>
                  <div style={{
                    height: 8, borderRadius: 4, background: r.color,
                    width: `${Math.round((r.val / stats.played) * 100)}%`,
                    opacity: 0.75,
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#484848", minWidth: 20, textAlign: "right" }}>
                  {r.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
