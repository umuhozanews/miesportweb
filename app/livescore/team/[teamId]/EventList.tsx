import Link from "next/link";
import { lsTeamImg, lsCompImg, lsTime, lsDate, lsIsNS, lsIsLive, lsIsFinished, type LsEvent } from "@/lib/livescoreCom";

const C = {
  border: "rgba(255,255,255,0.08)",
  live: "#22c55e",
  blue: "#60a5fa",
  muted: "#484848",
};

export function EventList({ events, teamId }: { events: LsEvent[]; teamId: string }) {
  if (events.length === 0) {
    return <p style={{ color: "#555", fontSize: 13, padding: "1.5rem 0", textAlign: "center" }}>No events found.</p>;
  }

  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {events.map((e, i) => {
        const home = e.T1?.[0];
        const away = e.T2?.[0];
        if (!home || !away) return null;

        const isHome = home.ID === teamId;
        const opp = isHome ? away : home;
        const isNS = lsIsNS(e);
        const isLive = lsIsLive(e);
        const isFt = lsIsFinished(e);

        const hs = e.Tr1 !== undefined ? Number(e.Tr1) : null;
        const as_ = e.Tr2 !== undefined ? Number(e.Tr2) : null;
        const myScore = isHome ? hs : as_;
        const oppScore = isHome ? as_ : hs;
        const won = isFt && myScore !== null && oppScore !== null && myScore > oppScore;
        const lost = isFt && myScore !== null && oppScore !== null && myScore < oppScore;

        return (
          <div
            key={e.Eid}
            style={{
              display: "grid",
              gridTemplateColumns: "60px 24px 1fr auto auto",
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
                <span style={{ fontSize: 10, fontWeight: 900, color: C.live }}>{e.Eps}</span>
              ) : isFt ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#444" }}>{e.Eps}</span>
              ) : (
                <div>
                  <div style={{ fontSize: 9, color: "#484848" }}>{lsDate(e.Esd)}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{lsTime(e.Esd)}</div>
                </div>
              )}
            </div>

            {/* H/A */}
            <span style={{
              fontSize: 9, fontWeight: 800, color: "#3a3a3a",
              background: "#222", padding: "2px 5px", borderRadius: 3,
              letterSpacing: 0.5, textAlign: "center",
            }}>
              {isHome ? "H" : "A"}
            </span>

            {/* Opponent + competition */}
            <Link href={`/livescore/team/${opp.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lsTeamImg(opp.Img)} alt="" width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d0d0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {opp.Nm}
                </div>
                {e.Stg && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    {e.Stg.badgeUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lsCompImg(e.Stg.badgeUrl)} alt="" width={10} height={10} style={{ objectFit: "contain" }} />
                    )}
                    <span style={{ fontSize: 10, color: "#3a3a3a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.Stg.Snm}
                    </span>
                  </div>
                )}
              </div>
            </Link>

            {/* Score */}
            {(isFt || isLive) && myScore !== null && oppScore !== null ? (
              <span style={{
                fontSize: 14, fontWeight: 800,
                color: won ? "#22c55e" : lost ? "#f87171" : "#888",
                fontVariantNumeric: "tabular-nums", letterSpacing: -0.5,
                minWidth: 36, textAlign: "center",
              }}>
                {myScore}–{oppScore}
              </span>
            ) : isNS ? (
              <span style={{ fontSize: 12, color: "#3a3a3a", minWidth: 36, textAlign: "center" }}>vs</span>
            ) : null}

            {/* W/D/L */}
            {isFt && myScore !== null && oppScore !== null && (
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
