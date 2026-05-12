import { Suspense } from "react";
import Link from "next/link";
import {
  getLsStages,
  lsTeamImg,
  lsCompImg,
  lsTime,
  lsIsNS,
  lsIsLive,
  lsIsFinished,
  toApiSport,
  type LsStage,
  type LsEvent,
} from "@/lib/livescoreCom";
import type { Sport } from "@/lib/sofascore";

const C = {
  border: "rgba(255,255,255,0.08)",
  innerBorder: "rgba(255,255,255,0.05)",
  text: "#ffffff",
  muted: "#6b90b8",
  dimmed: "#4a6580",
  live: "#22c55e",
  ft: "#7090aa",
  blue: "#60a5fa",
  panel: "#0d1828",
  compHeader: "#0a1628",
};

function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().split("T")[0];
}

function dateLabel(d: string) {
  const today = new Date().toISOString().split("T")[0];
  if (d === today) return "Today";
  const dt = new Date(d + "T00:00:00Z");
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

/* ─── Shell: renders synchronously, no data needed ─── */
export function ScoresPage({ sport, date, basePath }: { sport: Sport; date: string; basePath: string }) {
  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const dayNum = new Date(date + "T00:00:00Z").getUTCDate();

  return (
    <div>
      {/* Date bar — instant */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        background: C.panel,
        borderRadius: 10,
        padding: "9px 14px",
        border: `1px solid ${C.border}`,
      }}>
        <span style={{ background: C.live, color: "#fff", fontSize: 10, fontWeight: 900, padding: "3px 7px", borderRadius: 4, letterSpacing: 1, flexShrink: 0 }}>LIVE</span>

        <Link href={`${basePath}?date=${prev}`} style={{ color: C.muted, textDecoration: "none", fontSize: 18, lineHeight: 1, padding: "0 6px", fontWeight: 300 }}>‹</Link>

        <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 14, color: C.text }}>
          {dateLabel(date)}
        </span>

        <Link href={`${basePath}?date=${next}`} style={{ color: C.muted, textDecoration: "none", fontSize: 18, lineHeight: 1, padding: "0 6px", fontWeight: 300 }}>›</Link>

        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: C.text, flexShrink: 0 }}>
          {dayNum}
        </div>
      </div>

      {/* Match groups — streamed in */}
      <Suspense fallback={<MatchesSkeleton />}>
        <AllSportsGroups sport={sport} date={date} />
      </Suspense>
    </div>
  );
}

/* ─── All sports: fetch from livescore.com API ─── */
async function AllSportsGroups({ sport, date }: { sport: Sport; date: string }) {
  const lsSport = toApiSport(sport);
  const stages = await getLsStages(date, lsSport);

  if (stages.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 1rem", color: C.muted }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
        <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: C.text }}>No matches scheduled</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Try another date</p>
      </div>
    );
  }

  return (
    <>
      {stages.map((stage) => (
        <LsCompetitionBlock key={stage.Sid} stage={stage} />
      ))}
    </>
  );
}

/* ─── Skeleton ─── */
function MatchesSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
          <div style={{ height: 44, background: C.compHeader, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: 3, background: "#2a2a2a" }} />
            <div style={{ width: 120, height: 12, borderRadius: 4, background: "#2a2a2a" }} />
          </div>
          {[1, 2, 3].map((j) => (
            <div key={j} style={{ height: 56, background: C.panel, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
              <div style={{ width: 36, height: 10, borderRadius: 4, background: "#222" }} />
              <div style={{ flex: 1, height: 10, borderRadius: 4, background: "#222" }} />
              <div style={{ width: 20, height: 14, borderRadius: 3, background: "#222" }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ════════════════ LIVESCORE.COM COMPONENTS ════════════════ */

function LsCompetitionBlock({ stage }: { stage: LsStage }) {
  return (
    <div style={{ marginBottom: 8, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
      {/* Competition header — links to competition page */}
      <Link href={`/livescore/tournament/${stage.CompId}/${stage.Sid}`} style={{ textDecoration: "none" }}>
        <div className="sf-comp-header" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.compHeader, borderLeft: "3px solid #1e4db7" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lsCompImg(stage.badgeUrl)}
            alt=""
            width={22}
            height={22}
            style={{ objectFit: "contain", flexShrink: 0, borderRadius: 3 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>{stage.Snm}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{stage.Cnm}</div>
          </div>
          <span style={{ color: C.muted, fontSize: 16 }}>›</span>
        </div>
      </Link>

      {/* Match rows */}
      <div style={{ background: C.panel }}>
        {(stage.Events ?? []).map((event, i) => (
          <LsMatchRow
            key={event.Eid}
            event={event}
            last={i === (stage.Events?.length ?? 1) - 1}
          />
        ))}
      </div>
    </div>
  );
}

function LsMatchRow({ event, last }: { event: LsEvent; last: boolean }) {
  const isNS = lsIsNS(event);
  const isLive = lsIsLive(event);
  const isFt = lsIsFinished(event);

  const home = event.T1?.[0];
  const away = event.T2?.[0];
  if (!home || !away) return null;

  const hs = event.Tr1 !== undefined ? Number(event.Tr1) : null;
  const as_ = event.Tr2 !== undefined ? Number(event.Tr2) : null;

  const homeWon = isFt && hs !== null && as_ !== null && hs > as_;
  const awayWon = isFt && hs !== null && as_ !== null && as_ > hs;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "52px 1fr auto",
      borderBottom: last ? "none" : `1px solid ${C.border}`,
      background: isLive ? "rgba(76,175,80,0.04)" : "transparent",
    }}>
      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${C.border}`, padding: "0 6px" }}>
        {isLive ? (
          <span style={{ fontSize: 11, fontWeight: 900, color: C.live, textAlign: "center" }}>{event.Eps}</span>
        ) : isFt ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: C.ft }}>{event.Eps}</span>
        ) : isNS ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{lsTime(event.Esd)}</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>{event.Eps}</span>
        )}
      </div>

      {/* Teams */}
      <div>
        <Link href={`/livescore/team/${home.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, padding: "8px 14px 6px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lsTeamImg(home.Img)} alt="" width={16} height={16} style={{ objectFit: "contain", flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: homeWon ? 700 : 400, color: isFt && !homeWon ? C.muted : "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {home.Nm}
          </span>
        </Link>
        <Link href={`/livescore/team/${away.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, padding: "6px 14px 8px", borderTop: `1px solid ${C.innerBorder}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lsTeamImg(away.Img)} alt="" width={16} height={16} style={{ objectFit: "contain", flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: awayWon ? 700 : 400, color: isFt && !awayWon ? C.muted : "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {away.Nm}
          </span>
        </Link>
      </div>

      {/* Scores */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", paddingRight: 16 }}>
        {isNS ? (
          <span style={{ fontSize: 12, color: C.dimmed }}>vs</span>
        ) : (
          <>
            <span style={{ fontSize: 16, fontWeight: 800, color: isLive ? C.live : homeWon ? "#ffffff" : C.muted, lineHeight: "2.1", minWidth: 16, textAlign: "center" }}>
              {hs ?? "-"}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: isLive ? C.live : awayWon ? "#ffffff" : C.muted, lineHeight: "2.1", minWidth: 16, textAlign: "center" }}>
              {as_ ?? "-"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
