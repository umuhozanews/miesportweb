import Link from "next/link";
import {
  lsTeamImg, lsTime, lsDate,
  lsIsNS, lsIsLive, lsIsFinished, type LsEvent,
} from "@/lib/livescoreCom";
import { espnFmtDate, espnFmtTime, type EspnEvent } from "@/lib/espn";
import { TeamImg } from "@/app/livescore/TeamImg";

export const ESPN_LEAGUE: Record<string, "pl" | "wc"> = { "17": "pl", "16": "wc" };

// ── ESPN components ──────────────────────────────────────────────────────────

export function EspnMatchRow({ e, last }: { e: EspnEvent; last: boolean }) {
  const isLive = e.status === "live";
  const isFt   = e.status === "finished";
  const isNS   = e.status === "scheduled";
  const hs  = e.homeScore;
  const as_ = e.awayScore;
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "80px 1fr auto 1fr",
      alignItems: "center",
      gap: 10,
      padding: "0 14px",
      borderBottom: !last ? "1px solid #181818" : "none",
      background: isLive ? "rgba(34,197,94,0.04)" : "#1c1c1c",
      minHeight: 52,
    }}>
      <div>
        <div style={{ fontSize: 10, color: "#404040" }}>{espnFmtDate(e.startTimestamp)}</div>
        {isLive
          ? <div style={{ fontSize: 11, fontWeight: 900, color: "#22c55e" }}>LIVE</div>
          : isFt
          ? <div style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>FT</div>
          : <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{espnFmtTime(e.startTimestamp)}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
        <span style={{
          fontSize: 13,
          fontWeight: isFt && hs !== null && as_ !== null && hs > as_ ? 700 : 400,
          color: isFt && hs !== null && as_ !== null && hs < as_ ? "#484848" : "#d8d8d8",
          textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {e.homeTeam.name}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.homeTeam.logo} alt={e.homeTeam.name} width={18} height={18} style={{ borderRadius: 2, objectFit: "contain" }} />
      </div>
      <div style={{ textAlign: "center", minWidth: 52, flexShrink: 0 }}>
        {(isFt || isLive) && hs !== null && as_ !== null
          ? <span style={{ fontSize: 15, fontWeight: 900, color: isLive ? "#22c55e" : "#e8e8e8", fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>
              {hs} – {as_}
            </span>
          : <span style={{ fontSize: 12, color: "#303030", fontWeight: 600 }}>vs</span>
        }
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.awayTeam.logo} alt={e.awayTeam.name} width={18} height={18} style={{ borderRadius: 2, objectFit: "contain" }} />
        <span style={{
          fontSize: 13,
          fontWeight: isFt && hs !== null && as_ !== null && as_ > hs ? 700 : 400,
          color: isFt && hs !== null && as_ !== null && as_ < hs ? "#484848" : "#d8d8d8",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {e.awayTeam.name}
        </span>
      </div>
    </div>
  );
}

export function EspnMatchTable({ events, emptyLabel = "No fixtures" }: { events: EspnEvent[]; emptyLabel?: string }) {
  if (events.length === 0) return <Empty label={emptyLabel} />;
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {events.map((e, i) => <EspnMatchRow key={e.id} e={e} last={i === events.length - 1} />)}
    </div>
  );
}

// ── Livescore components ─────────────────────────────────────────────────────

export function CompMatchTable({ events }: { events: LsEvent[] }) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {events.map((e, i) => {
        const home = e.T1?.[0];
        const away = e.T2?.[0];
        if (!home || !away) return null;

        const isLive = lsIsLive(e);
        const isFt   = lsIsFinished(e);
        const isNS   = lsIsNS(e);
        const hs  = e.Tr1 !== undefined ? Number(e.Tr1) : null;
        const as_ = e.Tr2 !== undefined ? Number(e.Tr2) : null;

        return (
          <div key={e.Eid} style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr auto 1fr",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            borderBottom: i < events.length - 1 ? "1px solid #181818" : "none",
            background: isLive ? "rgba(34,197,94,0.04)" : "#1c1c1c",
            minHeight: 52,
          }}>
            <div>
              <div style={{ fontSize: 10, color: "#404040" }}>{lsDate(e.Esd)}</div>
              {isLive
                ? <div style={{ fontSize: 11, fontWeight: 900, color: "#22c55e" }}>{e.Eps}</div>
                : isFt
                ? <div style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>{e.Eps}</div>
                : <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{lsTime(e.Esd)}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <Link href={`/livescore/team/${home.ID}`} style={{ textDecoration: "none" }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: isFt && hs !== null && as_ !== null && hs > as_ ? 700 : 400,
                  color: isFt && hs !== null && as_ !== null && hs < as_ ? "#484848" : "#d8d8d8",
                  textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{home.Nm}</span>
              </Link>
              <TeamImg src={lsTeamImg(home.Img, home.ID)} name={home.Nm} size={18} />
            </div>
            <div style={{ textAlign: "center", minWidth: 52, flexShrink: 0 }}>
              {(isFt || isLive) && hs !== null && as_ !== null
                ? <span style={{ fontSize: 15, fontWeight: 900, color: isLive ? "#22c55e" : "#e8e8e8", fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>
                    {hs} – {as_}
                  </span>
                : <span style={{ fontSize: 12, color: "#303030", fontWeight: 600 }}>{isNS ? "vs" : e.Eps}</span>
              }
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TeamImg src={lsTeamImg(away.Img, away.ID)} name={away.Nm} size={18} />
              <Link href={`/livescore/team/${away.ID}`} style={{ textDecoration: "none" }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: isFt && hs !== null && as_ !== null && as_ > hs ? 700 : 400,
                  color: isFt && hs !== null && as_ !== null && as_ < hs ? "#484848" : "#d8d8d8",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{away.Nm}</span>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Empty({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#444" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
      <p style={{ fontWeight: 600, margin: 0, color: "#666" }}>{label}</p>
    </div>
  );
}
