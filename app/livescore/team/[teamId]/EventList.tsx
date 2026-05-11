import Link from "next/link";
import { teamImg, fmtDate, fmtTime, statusLabel, type SfEvent } from "@/lib/sofascore";

export function EventList({ events, teamId }: { events: SfEvent[]; teamId: number }) {
  if (events.length === 0) {
    return <p style={{ color: "#555", fontSize: 13, padding: "1.5rem 0", textAlign: "center" }}>No events found.</p>;
  }

  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {events.map((e, i) => {
        const isHome = e.homeTeam.id === teamId;
        const opp = isHome ? e.awayTeam : e.homeTeam;
        const isLive = e.status.type === "inprogress";
        const isFt = e.status.type === "finished";
        const isNs = e.status.type === "notstarted";
        const hs = e.homeScore.current ?? 0;
        const as_ = e.awayScore.current ?? 0;
        const myScore = isHome ? hs : as_;
        const oppScore = isHome ? as_ : hs;
        const won = isFt && myScore > oppScore;
        const lost = isFt && myScore < oppScore;

        return (
          <div
            key={e.id}
            className="sf-row"
            style={{
              display: "grid",
              gridTemplateColumns: "52px 28px 1fr auto auto",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderBottom: i < events.length - 1 ? "1px solid #181818" : "none",
              background: isLive ? "rgba(34,197,94,0.04)" : "#1c1c1c",
            }}
          >
            {/* Date/Status */}
            <div style={{ textAlign: "center" }}>
              {isLive ? (
                <span style={{ fontSize: 10, fontWeight: 900, color: "#22c55e" }}>{statusLabel(e.status)}</span>
              ) : isFt ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#444" }}>FT</span>
              ) : (
                <div>
                  <div style={{ fontSize: 10, color: "#484848" }}>{fmtDate(e.startTimestamp)}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>{fmtTime(e.startTimestamp)}</div>
                </div>
              )}
            </div>

            {/* H/A */}
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              color: "#3a3a3a",
              background: "#222",
              padding: "2px 5px",
              borderRadius: 3,
              letterSpacing: 0.5,
              textAlign: "center",
            }}>
              {isHome ? "H" : "A"}
            </span>

            {/* Opponent */}
            <Link href={`/livescore/team/${opp.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamImg(opp.id)} alt="" width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "#d0d0d0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {opp.name}
              </span>
            </Link>

            {/* Score */}
            {(isFt || isLive) && (
              <span style={{
                fontSize: 14,
                fontWeight: 800,
                color: won ? "#22c55e" : lost ? "#f87171" : "#888",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: -0.5,
                minWidth: 36,
                textAlign: "center",
              }}>
                {myScore}–{oppScore}
              </span>
            )}
            {isNs && <span style={{ fontSize: 12, color: "#3a3a3a", minWidth: 36, textAlign: "center" }}>vs</span>}

            {/* W/D/L */}
            {isFt && (
              <span className={`wdl ${won ? "wdl-w" : lost ? "wdl-l" : "wdl-d"}`}>
                {won ? "W" : lost ? "L" : "D"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
