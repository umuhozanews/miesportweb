export const dynamic = "force-dynamic";
import {
  seasonId,
  getWCKnockoutMatches,
  teamImg,
  fmtWCDateLong,
  knockoutStageName,
  type WCEvent,
} from "@/lib/worldcup";

type Props = { params: Promise<{ year: string }> };

// Canonical display order for knockout stages
const STAGE_ORDER = [
  "Round of 32", "Round of 16", "Quarter-finals",
  "Semi-finals", "3rd Place", "Final",
];

export default async function WCKnockoutPage({ params }: Props) {
  const { year } = await params;
  const sid = seasonId(year);
  if (!sid) return <Empty />;

  const events = await getWCKnockoutMatches(sid);
  const played = events.filter((e) => e.status.type !== "notstarted" || (e.homeScore.current != null));
  const scheduled = events.filter((e) => e.status.type === "notstarted" && e.homeScore.current == null);

  if (events.length === 0) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#444" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
        <p style={{ fontSize: 13, color: "#555" }}>Knockout stage hasn&apos;t started yet.</p>
        <p style={{ fontSize: 11, color: "#333", marginTop: 6 }}>
          {year === "2026" ? "Starts after the group stage in July 2026." : "No data available."}
        </p>
      </div>
    );
  }

  // Group all events by stage name
  function groupByStage(evts: WCEvent[]) {
    const map = new Map<string, WCEvent[]>();
    for (const e of evts) {
      const name = knockoutStageName(e.roundInfo) ?? "Knockout";
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(e);
    }
    return [...map.entries()].sort(([a], [b]) => {
      const ai = STAGE_ORDER.indexOf(a);
      const bi = STAGE_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }

  const playedStages = groupByStage(played);
  const scheduledStages = groupByStage(scheduled);

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── PLAYED MATCHES ── */}
      {playedStages.map(([stageName, matches]) => (
        <section key={stageName}>
          <StageHeader label={stageName} />
          <div style={{ display: "grid", gridTemplateColumns: matches.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
            {matches.map((e) => <KnockoutCard key={e.id} event={e} />)}
          </div>
        </section>
      ))}

      {/* ── SCHEDULED KNOCKOUT MATCHES ── */}
      {scheduledStages.length > 0 && (
        <>
          {playedStages.length > 0 && (
            <div style={{ height: 1, background: "#1e1e1e" }} />
          )}
          {scheduledStages.map(([stageName, matches]) => (
            <section key={stageName}>
              <StageHeader label={stageName} dim />
              <div style={{ display: "grid", gridTemplateColumns: matches.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
                {matches.map((e) => <KnockoutCard key={e.id} event={e} />)}
              </div>
            </section>
          ))}
        </>
      )}

    </div>
  );
}

function StageHeader({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: dim ? "#3a3a3a" : "#f5a623", letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
    </div>
  );
}

function KnockoutCard({ event: e }: { event: WCEvent }) {
  const isFt = e.status.type === "finished";
  const isLive = e.status.type === "inprogress";
  const isNs = e.status.type === "notstarted";
  const hs = e.homeScore.current ?? 0;
  const as_ = e.awayScore.current ?? 0;
  const homeWon = isFt && hs > as_;
  const awayWon = isFt && as_ > hs;

  return (
    <div style={{
      background: "#1a1a1a",
      border: `1px solid ${isLive ? "rgba(34,197,94,0.25)" : "#222"}`,
      borderRadius: 10,
      padding: "14px 16px",
    }}>
      <div style={{ fontSize: 10, color: "#3a3a3a", marginBottom: 12, fontWeight: 700 }}>
        {isLive
          ? <span style={{ color: "#22c55e" }}>● {e.status.description}</span>
          : isFt ? `FT · ${fmtWCDateLong(e.startTimestamp)}`
          : fmtWCDateLong(e.startTimestamp)
        }
      </div>

      {/* Home row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, opacity: isFt && !homeWon ? 0.4 : 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamImg(e.homeTeam.id)} alt="" width={24} height={24} style={{ objectFit: "contain", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: homeWon ? 800 : 500, color: isNs ? "#aaa" : "#d8d8d8" }}>
          {e.homeTeam.nameCode ?? e.homeTeam.name}
        </span>
        <span style={{ fontSize: 16, fontWeight: 900, color: isLive ? "#22c55e" : "#f0f0f0", minWidth: 20, textAlign: "right" }}>
          {(isFt || isLive) ? hs : ""}
        </span>
        {homeWon && <WinBadge />}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#222", marginBottom: 8 }} />

      {/* Away row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: isFt && !awayWon ? 0.4 : 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamImg(e.awayTeam.id)} alt="" width={24} height={24} style={{ objectFit: "contain", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: awayWon ? 800 : 500, color: isNs ? "#aaa" : "#d8d8d8" }}>
          {e.awayTeam.nameCode ?? e.awayTeam.name}
        </span>
        <span style={{ fontSize: 16, fontWeight: 900, color: isLive ? "#22c55e" : "#f0f0f0", minWidth: 20, textAlign: "right" }}>
          {(isFt || isLive) ? as_ : ""}
        </span>
        {awayWon && <WinBadge />}
      </div>

      {isNs && (
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "#3a3a3a", fontWeight: 600 }}>
          Scheduled
        </div>
      )}
    </div>
  );
}

function WinBadge() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color: "#22c55e",
      background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
      padding: "2px 6px", borderRadius: 4, flexShrink: 0, letterSpacing: 0.5,
    }}>
      WIN
    </span>
  );
}

function Empty() {
  return <div style={{ padding: "3rem", textAlign: "center", color: "#444", fontSize: 13 }}>No knockout data available.</div>;
}
