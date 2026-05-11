export const dynamic = "force-dynamic";
import { seasonId, getWCRecentMatches, teamImg, fmtWCDate, knockoutStageName, isKnockout, type WCEvent } from "@/lib/worldcup";

type Props = { params: Promise<{ year: string }> };

const STAGE_ORDER = ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "3rd Place", "3rd place", "Match for 3rd place", "Final"];

export default async function WCKnockoutPage({ params }: Props) {
  const { year } = await params;
  const sid = seasonId(year);
  if (!sid) return <Empty />;

  const allEvents = await getWCRecentMatches(sid);
  const knockoutEvents = allEvents.filter((e) => isKnockout(e.roundInfo));

  if (knockoutEvents.length === 0) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#444" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
        <p style={{ fontSize: 13, color: "#555" }}>Knockout stage hasn&apos;t started yet.</p>
      </div>
    );
  }

  // Group by stage name
  const stageMap = new Map<string, WCEvent[]>();
  for (const e of knockoutEvents) {
    const name = knockoutStageName(e.roundInfo) ?? "Knockout";
    if (!stageMap.has(name)) stageMap.set(name, []);
    stageMap.get(name)!.push(e);
  }

  // Sort by STAGE_ORDER (known stages first, unknown last)
  const sorted = [...stageMap.entries()].sort(([a], [b]) => {
    const ai = STAGE_ORDER.findIndex((s) => a.includes(s) || s.includes(a));
    const bi = STAGE_ORDER.findIndex((s) => b.includes(s) || s.includes(b));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {sorted.map(([stageName, matches]) => (
        <section key={stageName}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#f5a623", letterSpacing: 1, textTransform: "uppercase" }}>{stageName}</span>
            <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: matches.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
            {matches.map((e) => <KnockoutCard key={e.id} event={e} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function KnockoutCard({ event: e }: { event: WCEvent }) {
  const isFt = e.status.type === "finished";
  const isLive = e.status.type === "inprogress";
  const hs = e.homeScore.current ?? 0;
  const as_ = e.awayScore.current ?? 0;
  const homeWon = isFt && hs > as_;
  const awayWon = isFt && as_ > hs;

  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #222", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: "#3a3a3a", marginBottom: 12, fontWeight: 700 }}>{fmtWCDate(e.startTimestamp)}</div>

      {/* Home row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, opacity: isFt && !homeWon ? 0.45 : 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamImg(e.homeTeam.id)} alt="" width={24} height={24} style={{ objectFit: "contain", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: homeWon ? 800 : 500, color: "#d8d8d8" }}>{e.homeTeam.name}</span>
        <span style={{ fontSize: 16, fontWeight: 900, color: isLive ? "#22c55e" : "#f0f0f0", minWidth: 20, textAlign: "right" }}>{isFt || isLive ? hs : ""}</span>
        {homeWon && <span style={{ fontSize: 10, fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: 4 }}>WIN</span>}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#1e1e1e", marginBottom: 8 }} />

      {/* Away row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: isFt && !awayWon ? 0.45 : 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamImg(e.awayTeam.id)} alt="" width={24} height={24} style={{ objectFit: "contain", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: awayWon ? 800 : 500, color: "#d8d8d8" }}>{e.awayTeam.name}</span>
        <span style={{ fontSize: 16, fontWeight: 900, color: isLive ? "#22c55e" : "#f0f0f0", minWidth: 20, textAlign: "right" }}>{isFt || isLive ? as_ : ""}</span>
        {awayWon && <span style={{ fontSize: 10, fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: 4 }}>WIN</span>}
      </div>

      {!isFt && !isLive && (
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "#3a3a3a" }}>Scheduled</div>
      )}
    </div>
  );
}

function Empty() {
  return <div style={{ padding: "3rem", textAlign: "center", color: "#444", fontSize: 13 }}>No knockout data available.</div>;
}
