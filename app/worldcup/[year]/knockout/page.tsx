export const dynamic = "force-dynamic";
import { getESPNWCFixturesByYear, getWCDateRange, espnFmtDate, type EspnEvent } from "@/lib/espn";
import {
  getWCKnockoutMatches, seasonId, fmtWCDate, fmtWCTime, roundLabel,
  type WCEvent,
} from "@/lib/worldcup";

type Props = { params: Promise<{ year: string }> };

export default async function WCKnockoutPage({ params }: Props) {
  const { year } = await params;
  const sid = seasonId(year);

  // 2026+: ESPN with date filter
  if (parseInt(year) >= 2026) {
    const range = getWCDateRange(year);
    if (!range) return <Empty />;

    const knockoutStartTs = Math.floor(new Date(range.knockoutStart + "T00:00:00Z").getTime() / 1000);
    const all = await getESPNWCFixturesByYear(year);
    const knockout = all.filter((e) => e.startTimestamp >= knockoutStartTs);

    if (knockout.length === 0) {
      return (
        <Placeholder
          label="Knockout stage not yet available"
          sub={`Begins ${range.knockoutStart} · After group stage concludes`}
        />
      );
    }

    const played = knockout.filter((e) => e.status === "finished" || e.status === "live");
    const scheduled = knockout.filter((e) => e.status === "scheduled");
    return (
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {played.length > 0 && <section><StageHeader label="Results" /><MatchGrid>{played.map((e) => <EspnCard key={e.id} event={e} />)}</MatchGrid></section>}
        {scheduled.length > 0 && <section><StageHeader label="Upcoming" dim /><MatchGrid>{scheduled.map((e) => <EspnCard key={e.id} event={e} />)}</MatchGrid></section>}
      </div>
    );
  }

  // Historical: Sofascore
  if (sid) {
    const events = await getWCKnockoutMatches(sid);

    if (events.length === 0) {
      return <Placeholder label="Knockout data not available" sub={`No knockout matches found for ${year}`} />;
    }

    // Group by round, ordered
    const ROUND_ORDER = [6, 5, 27, 28, 50, 29];
    const byRound = new Map<number, WCEvent[]>();
    for (const e of events) {
      const r = e.roundInfo?.round ?? 0;
      if (!byRound.has(r)) byRound.set(r, []);
      byRound.get(r)!.push(e);
    }
    const rounds = ROUND_ORDER.filter(r => byRound.has(r));

    return (
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {rounds.map((r) => {
          const roundEvents = byRound.get(r)!;
          const label = roundLabel(roundEvents[0]?.roundInfo);
          return (
            <section key={r}>
              <StageHeader label={label} />
              <MatchGrid>{roundEvents.map((e) => <WCCard key={e.id} event={e} />)}</MatchGrid>
            </section>
          );
        })}
      </div>
    );
  }

  return <Empty />;
}

function EspnCard({ event: e }: { event: EspnEvent }) {
  const isFt = e.status === "finished";
  const isLive = e.status === "live";
  const isNs = e.status === "scheduled";
  const hs = e.homeScore ?? 0;
  const as_ = e.awayScore ?? 0;
  const homeWon = isFt && hs > as_;
  const awayWon = isFt && as_ > hs;
  return (
    <div style={{ background: "rgba(30,27,75,0.55)", border: `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "rgba(67,56,202,0.25)"}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 12, fontWeight: 700 }}>
        {isLive ? <span style={{ color: "#22c55e" }}>● LIVE</span> : isFt ? `FT · ${espnFmtDate(e.startTimestamp)}` : espnFmtDate(e.startTimestamp)}
      </div>
      <MatchRow logo={e.homeTeam.logo} name={e.homeTeam.abbreviation || e.homeTeam.name} score={isFt || isLive ? hs : undefined} won={homeWon} dim={isFt && !homeWon} isNs={isNs} isLive={isLive} winner={homeWon} />
      <div style={{ height: 1, background: "rgba(67,56,202,0.2)", margin: "8px 0" }} />
      <MatchRow logo={e.awayTeam.logo} name={e.awayTeam.abbreviation || e.awayTeam.name} score={isFt || isLive ? as_ : undefined} won={awayWon} dim={isFt && !awayWon} isNs={isNs} isLive={isLive} winner={awayWon} />
      {isNs && <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>Scheduled</div>}
    </div>
  );
}

function WCCard({ event: e }: { event: WCEvent }) {
  const isFt = e.status.type === "finished";
  const isLive = e.status.type === "inprogress";
  const isNs = e.status.type === "notstarted";
  const hs = e.homeScore.current ?? 0;
  const as_ = e.awayScore.current ?? 0;
  const homeWon = isFt && (e.winnerCode === 1 || hs > as_);
  const awayWon = isFt && (e.winnerCode === 2 || as_ > hs);
  const sfBase = "https://api.sofascore.com/api/v1";
  return (
    <div style={{ background: "rgba(30,27,75,0.55)", border: `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "rgba(67,56,202,0.25)"}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 12, fontWeight: 700 }}>
        {isLive ? <span style={{ color: "#22c55e" }}>● {e.status.description}</span> : isFt ? `FT · ${fmtWCDate(e.startTimestamp)}` : `${fmtWCDate(e.startTimestamp)} · ${fmtWCTime(e.startTimestamp)}`}
      </div>
      <MatchRow logo={`${sfBase}/team/${e.homeTeam.id}/image`} name={e.homeTeam.nameCode || e.homeTeam.name} score={isFt || isLive ? hs : undefined} won={homeWon} dim={isFt && !homeWon} isNs={isNs} isLive={isLive} winner={homeWon} />
      <div style={{ height: 1, background: "rgba(67,56,202,0.2)", margin: "8px 0" }} />
      <MatchRow logo={`${sfBase}/team/${e.awayTeam.id}/image`} name={e.awayTeam.nameCode || e.awayTeam.name} score={isFt || isLive ? as_ : undefined} won={awayWon} dim={isFt && !awayWon} isNs={isNs} isLive={isLive} winner={awayWon} />
      {isNs && <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{fmtWCTime(e.startTimestamp)}</div>}
    </div>
  );
}

function MatchRow({ logo, name, score, won, dim, isNs, isLive, winner }: {
  logo: string; name: string; score?: number; won: boolean; dim: boolean;
  isNs: boolean; isLive: boolean; winner: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: dim ? 0.38 : 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt="" width={24} height={24} style={{ objectFit: "contain", flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: won ? 800 : 500, color: isNs ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.85)" }}>
        {name}
      </span>
      {score !== undefined && (
        <span style={{ fontSize: 16, fontWeight: 900, color: isLive ? "#22c55e" : "#fff", minWidth: 20, textAlign: "right" }}>
          {score}
        </span>
      )}
      {winner && (
        <span style={{ fontSize: 9, fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>WIN</span>
      )}
    </div>
  );
}

function StageHeader({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: dim ? "rgba(255,255,255,0.25)" : "#818CF8", letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(67,56,202,0.2)" }} />
    </div>
  );
}

function MatchGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{children}</div>;
}

function Placeholder({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ padding: "3rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(67,56,202,0.1)", border: "1px solid rgba(67,56,202,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="rgba(129,140,248,0.5)" strokeWidth={1.4}>
          <line x1={12} x2={12} y1={17} y2={21} /><line x1={8} x2={16} y1={21} y2={21} />
          <path d="M7 4H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3" />
          <path d="M17 4h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3" />
          <path d="M7 4a5 5 0 0 0 10 0H7Z" />
        </svg>
      </div>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 700, margin: 0 }}>{label}</p>
      <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, margin: 0 }}>{sub}</p>
    </div>
  );
}

function Empty() {
  return <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>No data available.</div>;
}
