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
import {
  getESPNScoreboardForDate,
  espnFmtTime,
  type EspnLeagueScores,
  type EspnEvent,
} from "@/lib/espn";
import { TeamImg, CompImg } from "./TeamImg";

const C = {
  border:       "rgba(255,255,255,0.07)",
  text:         "#e8e8e8",
  muted:        "#666",
  dimmed:       "#444",
  live:         "#22c55e",
  ft:           "#666",
  blue:         "#60a5fa",
  panel:        "#1c1c1c",
  compHeader:   "#1e1e1e",
  star:         "rgba(255,255,255,0.2)",
};

// ESPN league → { tournamentId, flag, country }
const ESPN_META: Record<string, { flag: string; country: string; tid?: string; sid?: string }> = {
  "eng.1":          { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "England",     tid: "17",  sid: "76986" },
  "esp.1":          { flag: "🇪🇸",         country: "Spain",       tid: "119", sid: "76236" },
  "ger.1":          { flag: "🇩🇪",         country: "Germany",     tid: "35",  sid: "76319" },
  "ita.1":          { flag: "🇮🇹",         country: "Italy",       tid: "23",  sid: "76465" },
  "fra.1":          { flag: "🇫🇷",         country: "France",      tid: "34",  sid: "75516" },
  "uefa.champions": { flag: "⭐",           country: "Europe",      tid: "7",   sid: "76410" },
  "uefa.europa":    { flag: "🏆",           country: "Europe" },
  "fifa.world":     { flag: "🌍",           country: "FIFA",        tid: "16" },
  "usa.1":          { flag: "🇺🇸",         country: "USA" },
};

function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().split("T")[0];
}

/* ─── Date navigation bar ─── */
function DateStrip({ date, basePath }: { date: string; basePath: string }) {
  const today = new Date().toISOString().split("T")[0];
  const prevDate = addDays(date, -1);
  const nextDate = addDays(date, 1);
  const isToday = date === today;

  const dt = new Date(date + "T00:00:00Z");
  const dayNum = dt.getUTCDate();
  const monthShort = dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const displayText = isToday
    ? "Today"
    : dt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "8px 14px", marginBottom: 12,
    }}>
      {/* LIVE → today */}
      <Link href={`${basePath}?date=${today}`} style={{ textDecoration: "none", flexShrink: 0 }}>
        <span style={{
          background: C.live, color: "#fff", fontSize: 10, fontWeight: 900,
          padding: "4px 10px", borderRadius: 5, letterSpacing: 0.8,
        }}>LIVE</span>
      </Link>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />

      {/* Prev / date / Next */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Link href={`${basePath}?date=${prevDate}`} style={{ textDecoration: "none", color: "#555", fontSize: 20, lineHeight: 1, fontWeight: 300 }}>‹</Link>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text, minWidth: 100, textAlign: "center" }}>{displayText}</span>
        <Link href={`${basePath}?date=${nextDate}`} style={{ textDecoration: "none", color: "#555", fontSize: 20, lineHeight: 1, fontWeight: 300 }}>›</Link>
      </div>

      {/* Calendar day icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 8, background: "#262626",
        border: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 7, fontWeight: 800, color: "#888", letterSpacing: 0.5, lineHeight: 1 }}>{monthShort}</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: C.text, lineHeight: 1.15 }}>{dayNum}</span>
      </div>
    </div>
  );
}

/* ─── Shell ─── */
export function ScoresPage({ sport, date, basePath }: { sport: Sport; date: string; basePath: string }) {
  return (
    <div>
      <DateStrip date={date} basePath={basePath} />
      <Suspense fallback={<MatchesSkeleton />}>
        <AllSportsGroups sport={sport} date={date} />
      </Suspense>
    </div>
  );
}

/* ─── Data fetching ─── */
async function AllSportsGroups({ sport, date }: { sport: Sport; date: string }) {
  const lsSport = toApiSport(sport);

  const [stages, espnLeagues] = await Promise.all([
    getLsStages(date, lsSport),
    sport === "football" ? getESPNScoreboardForDate(date) : Promise.resolve([]),
  ]);

  const lsLeagueNames = new Set(stages.map((s) => s.Snm.toLowerCase()));
  // Only show ESPN leagues not already covered by livescore, capped to avoid huge renders
  const espnExtra = espnLeagues
    .filter((l) => !lsLeagueNames.has(l.leagueName.toLowerCase()))
    .slice(0, 4);

  if (stages.length === 0 && espnExtra.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 1rem", color: C.muted }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📅</div>
        <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: C.text }}>No matches found</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Try a different date</p>
      </div>
    );
  }

  return (
    <>
      {espnExtra.map((league) => (
        <EspnLeagueBlock key={league.leagueId} league={league} />
      ))}
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
          <div style={{ height: 46, background: C.compHeader, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, background: "#2a2a2a" }} />
            <div style={{ width: 130, height: 11, borderRadius: 4, background: "#2a2a2a" }} />
          </div>
          {[1, 2, 3].map((j) => (
            <div key={j} style={{ height: 56, background: C.panel, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
              <div style={{ width: 36, height: 10, borderRadius: 4, background: "#2a2a2a" }} />
              <div style={{ flex: 1, height: 10, borderRadius: 4, background: "#2a2a2a" }} />
              <div style={{ width: 20, height: 14, borderRadius: 3, background: "#2a2a2a" }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ════════════════ ESPN COMPONENTS ════════════════ */

function EspnLeagueBlock({ league }: { league: EspnLeagueScores }) {
  const meta = ESPN_META[league.leagueId];
  const href = meta?.tid && meta?.sid
    ? `/livescore/tournament/${meta.tid}/${meta.sid}`
    : undefined;

  const header = (
    <div className="sf-comp-header" style={{
      display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
      background: C.compHeader,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0, width: 26, textAlign: "center", lineHeight: 1 }}>
        {meta?.flag ?? "⚽"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{league.leagueName}</div>
        {meta?.country && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{meta.country}</div>}
      </div>
      {href && <span style={{ color: C.muted, fontSize: 16, marginLeft: 4 }}>›</span>}
    </div>
  );

  return (
    <div style={{ marginBottom: 8, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
      {href
        ? <Link href={href} style={{ textDecoration: "none", display: "block" }}>{header}</Link>
        : header
      }
      <div style={{ background: C.panel }}>
        {league.events.map((event, i) => (
          <EspnMatchRow key={event.id} event={event} last={i === league.events.length - 1} />
        ))}
      </div>
    </div>
  );
}

function EspnMatchRow({ event, last }: { event: EspnEvent; last: boolean }) {
  const isLive = event.status === "live";
  const isFt   = event.status === "finished";
  const isNS   = event.status === "scheduled";
  const hs = event.homeScore;
  const as_ = event.awayScore;
  const homeWon = isFt && hs !== null && as_ !== null && hs > as_;
  const awayWon = isFt && hs !== null && as_ !== null && as_ > hs;
  const timeLabel = isLive
    ? (event.statusDetail?.includes("Halftime") || event.statusDetail?.includes("HT") ? "HT" : "LIVE")
    : isFt ? "FT"
    : espnFmtTime(event.startTimestamp);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "52px 1fr auto 32px",
      borderBottom: last ? "none" : `1px solid ${C.border}`,
      background: isLive ? "rgba(34,197,94,0.04)" : "transparent",
      minHeight: 56,
    }}>
      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${C.border}`, padding: "0 6px" }}>
        {isLive
          ? <span style={{ fontSize: 11, fontWeight: 900, color: C.live, textAlign: "center" }}>{timeLabel}</span>
          : isFt
          ? <span style={{ fontSize: 12, fontWeight: 700, color: C.ft }}>FT</span>
          : <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{timeLabel}</span>
        }
      </div>

      {/* Teams */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px 5px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.homeTeam.logo} width={16} height={16} alt="" style={{ borderRadius: 2, objectFit: "contain", flexShrink: 0 }} />
          <span style={{
            fontSize: 14, fontWeight: homeWon ? 700 : 400,
            color: isFt && !homeWon ? C.muted : C.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{event.homeTeam.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 14px 10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.awayTeam.logo} width={16} height={16} alt="" style={{ borderRadius: 2, objectFit: "contain", flexShrink: 0 }} />
          <span style={{
            fontSize: 14, fontWeight: awayWon ? 700 : 400,
            color: isFt && !awayWon ? C.muted : C.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{event.awayTeam.name}</span>
        </div>
      </div>

      {/* Scores */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", minWidth: 32, padding: "0 10px 0 0" }}>
        {isNS
          ? null
          : <>
              <span style={{ fontSize: 16, fontWeight: 800, lineHeight: "1.75", color: isLive ? C.live : homeWon ? C.text : C.dimmed }}>{hs ?? "-"}</span>
              <span style={{ fontSize: 16, fontWeight: 800, lineHeight: "1.75", color: isLive ? C.live : awayWon ? C.text : C.dimmed }}>{as_ ?? "-"}</span>
            </>
        }
      </div>

      {/* Star */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <StarIcon />
      </div>
    </div>
  );
}

/* ════════════════ LIVESCORE.COM COMPONENTS ════════════════ */

function LsCompetitionBlock({ stage }: { stage: LsStage }) {
  return (
    <div style={{ marginBottom: 8, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <Link href={`/livescore/tournament/${stage.CompId}/${stage.Sid}`} style={{ textDecoration: "none", display: "block" }}>
        <div className="sf-comp-header" style={{
          display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
          background: C.compHeader,
        }}>
          <CompImg src={lsCompImg(stage.badgeUrl)} size={24} radius={4} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{stage.Snm}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{stage.Cnm}</div>
          </div>
          <span style={{ color: C.muted, fontSize: 16, marginLeft: 4 }}>›</span>
        </div>
      </Link>
      <div style={{ background: C.panel }}>
        {(stage.Events ?? []).map((event, i) => (
          <LsMatchRow key={event.Eid} event={event} last={i === (stage.Events?.length ?? 1) - 1} />
        ))}
      </div>
    </div>
  );
}

function LsMatchRow({ event, last }: { event: LsEvent; last: boolean }) {
  const isNS   = lsIsNS(event);
  const isLive = lsIsLive(event);
  const isFt   = lsIsFinished(event);
  const home = event.T1?.[0];
  const away = event.T2?.[0];
  if (!home || !away) return null;

  const hs = event.Tr1 !== undefined ? Number(event.Tr1) : null;
  const as_ = event.Tr2 !== undefined ? Number(event.Tr2) : null;
  const homeWon = isFt && hs !== null && as_ !== null && hs > as_;
  const awayWon = isFt && hs !== null && as_ !== null && as_ > hs;

  const statusLabel = isLive
    ? (event.Eps ?? "LIVE")
    : isFt
    ? (event.Eps ?? "FT")
    : isNS
    ? lsTime(event.Esd)
    : (event.Eps ?? "—");

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "52px 1fr auto 32px",
      borderBottom: last ? "none" : `1px solid ${C.border}`,
      background: isLive ? "rgba(34,197,94,0.04)" : "transparent",
      minHeight: 56,
    }}>
      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${C.border}`, padding: "0 6px" }}>
        {isLive
          ? <span style={{ fontSize: 11, fontWeight: 900, color: C.live, textAlign: "center" }}>{statusLabel}</span>
          : isFt
          ? <span style={{ fontSize: 12, fontWeight: 700, color: C.ft }}>{statusLabel}</span>
          : isNS
          ? <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{statusLabel}</span>
          : <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>{statusLabel}</span>
        }
      </div>

      {/* Teams */}
      <div>
        <Link href={`/livescore/team/${home.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px 5px" }}>
          <TeamImg src={lsTeamImg(home.Img, home.ID)} name={home.Nm} size={16} />
          <span style={{
            fontSize: 14, fontWeight: homeWon ? 700 : 400,
            color: isFt && !homeWon ? C.muted : C.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{home.Nm}</span>
        </Link>
        <Link href={`/livescore/team/${away.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, padding: "5px 14px 10px" }}>
          <TeamImg src={lsTeamImg(away.Img, away.ID)} name={away.Nm} size={16} />
          <span style={{
            fontSize: 14, fontWeight: awayWon ? 700 : 400,
            color: isFt && !awayWon ? C.muted : C.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{away.Nm}</span>
        </Link>
      </div>

      {/* Scores */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", minWidth: 32, padding: "0 10px 0 0" }}>
        {isNS
          ? null
          : <>
              <span style={{ fontSize: 16, fontWeight: 800, lineHeight: "1.75", color: isLive ? C.live : homeWon ? C.text : C.dimmed }}>{hs ?? "-"}</span>
              <span style={{ fontSize: 16, fontWeight: 800, lineHeight: "1.75", color: isLive ? C.live : awayWon ? C.text : C.dimmed }}>{as_ ?? "-"}</span>
            </>
        }
      </div>

      {/* Star */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <StarIcon />
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
