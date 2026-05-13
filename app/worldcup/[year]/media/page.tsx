export const dynamic = "force-dynamic";

import {
  seasonId,
  getWCRecentMatches,
  getWCNextMatches,
  getWCTopPlayers,
  teamImg,
  playerImg,
  sofascoreEventUrl,
  knockoutStageName,
  isKnockout,
  fmtWCDateLong,
  fmtWCTime,
  type WCEvent,
  type WCTopPlayer,
} from "@/lib/worldcup";

type Props = { params: Promise<{ year: string }> };

export default async function WCMediaPage({ params }: Props) {
  const { year } = await params;
  const sid = seasonId(year);

  if (!sid) {
    return <Empty label={`No data available for ${year}`} />;
  }

  const [recent, upcoming, { goals, rating }] = await Promise.all([
    getWCRecentMatches(sid),
    getWCNextMatches(sid),
    getWCTopPlayers(sid),
  ]);

  const finished = recent.filter((e) => e.status.type === "finished");
  // Knockouts first (more notable), then group stage
  const knockouts = finished.filter((e) => isKnockout(e.roundInfo));
  const groups = finished.filter((e) => !isKnockout(e.roundInfo));
  const featured = [...knockouts, ...groups].slice(0, 20);
  const nextUp = upcoming.slice(0, 8);

  const hasContent = featured.length > 0 || nextUp.length > 0 || goals.length > 0;

  if (!hasContent) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📺</div>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 18 }}>
          Media and highlights will appear here once matches begin.
        </p>
        <a
          href={`https://www.sofascore.com/football/tournament/world/world-championship/16`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#f5a623", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
        >
          View on Sofascore →
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── UPCOMING (shown before tournament starts) ── */}
      {nextUp.length > 0 && finished.length === 0 && (
        <section>
          <SectionLabel>Upcoming Fixtures</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {nextUp.map((e) => <UpcomingCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* ── MATCH HIGHLIGHTS ── */}
      {featured.length > 0 && (
        <section>
          <SectionLabel>Match Highlights</SectionLabel>
          <p style={{ fontSize: 11, color: "#3a3a3a", margin: "4px 0 10px", fontWeight: 600 }}>
            Click any match to watch highlights on Sofascore
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {featured.map((e) => <MatchHighlightCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* ── TOP SCORERS ── */}
      {goals.length > 0 && (
        <section>
          <SectionLabel>Top Scorers</SectionLabel>
          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden", marginTop: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "24px 24px 1fr 36px", gap: 8, padding: "8px 14px", background: "#141e30", fontSize: 9, fontWeight: 800, color: "#354060", textTransform: "uppercase", letterSpacing: 1 }}>
              <span>#</span><span />
              <span>Player</span>
              <span style={{ textAlign: "center" }}>Goals</span>
            </div>
            {goals.slice(0, 10).map((p, i) => (
              <PlayerRow key={p.player.id} player={p} rank={i + 1} statKey="goals" total={Math.min(goals.length, 10)} i={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── TOP RATED ── */}
      {rating.length > 0 && (
        <section>
          <SectionLabel>Best Performers</SectionLabel>
          <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden", marginTop: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "24px 24px 1fr 46px", gap: 8, padding: "8px 14px", background: "#141e30", fontSize: 9, fontWeight: 800, color: "#354060", textTransform: "uppercase", letterSpacing: 1 }}>
              <span>#</span><span />
              <span>Player</span>
              <span style={{ textAlign: "center" }}>Rating</span>
            </div>
            {rating.slice(0, 8).map((p, i) => (
              <PlayerRow key={p.player.id} player={p} rank={i + 1} statKey="rating" total={Math.min(rating.length, 8)} i={i} decimal />
            ))}
          </div>
        </section>
      )}

      {/* ── SOFASCORE LINK ── */}
      <a
        href={`https://www.sofascore.com/football/tournament/world/world-championship/16#id:${sid},tab:media`}
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
          letterSpacing: 0.3,
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        Watch all highlights on Sofascore
      </a>

    </div>
  );
}

/* ── Components ── */

function MatchHighlightCard({ event: e }: { event: WCEvent }) {
  const isFt = e.status.type === "finished";
  const hs = e.homeScore.current ?? 0;
  const as_ = e.awayScore.current ?? 0;
  const stage = knockoutStageName(e.roundInfo);
  const url = sofascoreEventUrl(e);
  const hasHighlights = e.hasGlobalHighlights === true;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block" }}
    >
      <div style={{
        background: "#1a1a1a",
        border: `1px solid ${stage ? "rgba(245,166,35,0.2)" : "#222"}`,
        borderLeft: stage ? "3px solid #f5a623" : "3px solid #222",
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "background 0.15s",
      }}>
        {/* Teams + score */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {stage && (
            <div style={{ fontSize: 9, fontWeight: 800, color: "#f5a623", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              {stage}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Home */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamImg(e.homeTeam.id)} alt="" width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: isFt && hs > as_ ? 800 : 500, color: isFt && hs < as_ ? "#3a3a3a" : "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.homeTeam.name}
              </span>
            </div>

            {/* Score */}
            <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", fontVariantNumeric: "tabular-nums", flexShrink: 0, letterSpacing: -0.5 }}>
              {hs} – {as_}
            </div>

            {/* Away */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 13, fontWeight: isFt && as_ > hs ? 800 : 500, color: isFt && as_ < hs ? "#3a3a3a" : "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                {e.awayTeam.name}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamImg(e.awayTeam.id)} alt="" width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 5 }}>{fmtWCDateLong(e.startTimestamp)}</div>
        </div>

        {/* Watch icon */}
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: hasHighlights ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${hasHighlights ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.08)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill={hasHighlights ? "#f5a623" : "#444"}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </a>
  );
}

function UpcomingCard({ event: e }: { event: WCEvent }) {
  return (
    <div style={{
      background: "#1a1a1a",
      border: "1px solid #222",
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{ minWidth: 52, textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{fmtWCTime(e.startTimestamp)}</div>
        <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 2 }}>{fmtWCDateLong(e.startTimestamp)}</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamImg(e.homeTeam.id)} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#d8d8d8" }}>{e.homeTeam.name}</span>
        <span style={{ fontSize: 11, color: "#444", margin: "0 4px" }}>vs</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#d8d8d8" }}>{e.awayTeam.name}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamImg(e.awayTeam.id)} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
      </div>
      {e.groupName && (
        <span style={{ fontSize: 10, fontWeight: 700, color: "#4a7ab5", letterSpacing: 0.5 }}>
          {e.groupName}
        </span>
      )}
    </div>
  );
}

function PlayerRow({
  player: p, rank, statKey, total, i, decimal,
}: {
  player: WCTopPlayer; rank: number; statKey: "goals" | "rating";
  total: number; i: number; decimal?: boolean;
}) {
  const val = p.statistics[statKey];
  const display = decimal && val != null ? Number(val).toFixed(2) : String(val ?? "—");

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "24px 24px 1fr 46px", gap: 8,
      padding: "9px 14px", alignItems: "center",
      borderBottom: i < total - 1 ? "1px solid #181818" : "none",
      background: "#1c1c1c",
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a", textAlign: "center" }}>{rank}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={playerImg(p.player.id)} alt="" width={22} height={22} style={{ objectFit: "contain", borderRadius: "50%" }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.player.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamImg(p.team.id)} alt="" width={11} height={11} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 10, color: "#484848" }}>{p.team.name}</span>
        </div>
      </div>
      <span style={{ fontSize: 17, fontWeight: 900, color: "#e8e8e8", fontVariantNumeric: "tabular-nums", textAlign: "center" }}>
        {display}
      </span>
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

function Empty({ label }: { label: string }) {
  return <div style={{ padding: "3rem", textAlign: "center", color: "#444", fontSize: 13 }}>{label}</div>;
}
