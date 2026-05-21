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
  border: "rgba(255,255,255,0.08)",
  innerBorder: "rgba(255,255,255,0.04)",
  text: "#ffffff",
  muted: "#6b90b8",
  dimmed: "#4a6580",
  live: "#22c55e",
  ft: "#7090aa",
  blue: "#60a5fa",
  panel: "#0d1828",
  compHeader: "#0a1628",
};

// ESPN league → { tournamentId, flag, country }
const ESPN_META: Record<string, { flag: string; country: string; tid?: string; sid?: string }> = {
  "eng.1":          { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "England",     tid: "17",  sid: "76986" },
  "esp.1":          { flag: "🇪🇸", country: "Spain",       tid: "119", sid: "76236" },
  "ger.1":          { flag: "🇩🇪", country: "Germany",     tid: "35",  sid: "76319" },
  "ita.1":          { flag: "🇮🇹", country: "Italy",       tid: "23",  sid: "76465" },
  "fra.1":          { flag: "🇫🇷", country: "France",      tid: "34",  sid: "75516" },
  "uefa.champions": { flag: "⭐", country: "Europe",      tid: "7",   sid: "76410" },
  "uefa.europa":    { flag: "🏆", country: "Europe" },
  "fifa.world":     { flag: "🌍", country: "FIFA",         tid: "16" },
  "usa.1":          { flag: "🇺🇸", country: "USA" },
};

function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().split("T")[0];
}

/* ─── Multi-day date strip (livescore.com style) ─── */
function DateStrip({ date, basePath }: { date: string; basePath: string }) {
  const today = new Date().toISOString().split("T")[0];
  const days: string[] = [];
  for (let i = -3; i <= 3; i++) days.push(addDays(today, i));

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      background: C.panel,
      borderRadius: 10,
      padding: "8px 10px",
      border: `1px solid ${C.border}`,
      marginBottom: 12,
      overflowX: "auto",
      scrollbarWidth: "none",
    }}>
      {/* LIVE badge */}
      <span style={{
        background: C.live, color: "#fff", fontSize: 10, fontWeight: 900,
        padding: "3px 8px", borderRadius: 5, letterSpacing: 1,
        flexShrink: 0, marginRight: 6,
      }}>
        LIVE
      </span>

      {days.map((d) => {
        const dt = new Date(d + "T00:00:00Z");
        const isToday = d === today;
        const isActive = d === date;
        const dayName = dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase().slice(0, 3);
        const dayNum = dt.getUTCDate();
        return (
          <Link key={d} href={`${basePath}?date=${d}`} style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "5px 10px", borderRadius: 8, minWidth: 42,
              background: isActive ? "#4338CA" : isToday && !isActive ? "rgba(67,56,202,0.18)" : "transparent",
              border: isToday && !isActive ? "1px solid rgba(67,56,202,0.35)" : "1px solid transparent",
              transition: "background 0.15s",
            }}>
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                color: isActive ? "rgba(255,255,255,0.75)" : "#3a5070",
              }}>{dayName}</span>
              <span style={{
                fontSize: 16, fontWeight: isActive || isToday ? 800 : 600, lineHeight: 1.3,
                color: isActive ? "#fff" : isToday ? C.blue : C.muted,
              }}>{dayNum}</span>
            </div>
          </Link>
        );
      })}
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

/* ─── All sports: ESPN (primary) + livescore.com (extra leagues) ─── */
async function AllSportsGroups({ sport, date }: { sport: Sport; date: string }) {
  const lsSport = toApiSport(sport);

  const [stages, espnLeagues] = await Promise.all([
    getLsStages(date, lsSport),
    sport === "football" ? getESPNScoreboardForDate(date) : Promise.resolve([]),
  ]);

  const lsLeagueNames = new Set(stages.map((s) => s.Snm.toLowerCase()));
  const espnExtra = espnLeagues.filter(
    (l) => !lsLeagueNames.has(l.leagueName.toLowerCase()),
  );

  if (stages.length === 0 && espnExtra.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 1rem", color: C.muted }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
        <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: C.text }}>No matches today</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Try another date</p>
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
          <div style={{ height: 44, background: C.compHeader, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: 3, background: "#1a2a3a" }} />
            <div style={{ width: 120, height: 11, borderRadius: 4, background: "#1a2a3a" }} />
          </div>
          {[1, 2, 3].map((j) => (
            <div key={j} style={{ height: 54, background: C.panel, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
              <div style={{ width: 40, height: 10, borderRadius: 4, background: "#1a2a3a" }} />
              <div style={{ flex: 1, height: 10, borderRadius: 4, background: "#1a2a3a" }} />
              <div style={{ width: 24, height: 14, borderRadius: 3, background: "#1a2a3a" }} />
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
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      background: C.compHeader, borderLeft: "3px solid #4338CA",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, width: 22, textAlign: "center", lineHeight: 1 }}>
        {meta?.flag ?? "⚽"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{league.leagueName}</div>
        {meta?.country && <div style={{ fontSize: 11, color: C.muted }}>{meta.country}</div>}
      </div>
      {href && <span style={{ color: C.muted, fontSize: 16 }}>›</span>}
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
  const isFt = event.status === "finished";
  const isNS = event.status === "scheduled";
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
      display: "grid", gridTemplateColumns: "52px 1fr auto",
      borderBottom: last ? "none" : `1px solid ${C.border}`,
      background: isLive ? "rgba(34,197,94,0.04)" : "transparent",
      minHeight: 54,
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
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px 5px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.homeTeam.logo} width={16} height={16} alt="" style={{ borderRadius: 2, objectFit: "contain", flexShrink: 0 }} />
          <span style={{
            fontSize: 14, fontWeight: homeWon ? 700 : 400,
            color: isFt && !homeWon ? C.muted : C.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{event.homeTeam.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 14px 9px" }}>
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
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minWidth: 38, paddingRight: 14 }}>
        {isNS
          ? <span style={{ fontSize: 12, color: C.dimmed }}>—</span>
          : <>
              <span style={{ fontSize: 16, fontWeight: 800, lineHeight: "1.7", color: isLive ? C.live : homeWon ? C.text : C.dimmed }}>{hs ?? "-"}</span>
              <span style={{ fontSize: 16, fontWeight: 800, lineHeight: "1.7", color: isLive ? C.live : awayWon ? C.text : C.dimmed }}>{as_ ?? "-"}</span>
            </>
        }
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
          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
          background: C.compHeader, borderLeft: "3px solid #1e4db7",
        }}>
          <CompImg src={lsCompImg(stage.badgeUrl)} size={22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{stage.Snm}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{stage.Cnm}</div>
          </div>
          <span style={{ color: C.muted, fontSize: 16 }}>›</span>
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
      display: "grid", gridTemplateColumns: "52px 1fr auto",
      borderBottom: last ? "none" : `1px solid ${C.border}`,
      background: isLive ? "rgba(34,197,94,0.04)" : "transparent",
      minHeight: 54,
    }}>
      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${C.border}`, padding: "0 6px" }}>
        {isLive
          ? <span style={{ fontSize: 11, fontWeight: 900, color: C.live, textAlign: "center" }}>{event.Eps}</span>
          : isFt
          ? <span style={{ fontSize: 12, fontWeight: 700, color: C.ft }}>{event.Eps ?? "FT"}</span>
          : isNS
          ? <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{lsTime(event.Esd)}</span>
          : <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>{event.Eps}</span>
        }
      </div>

      {/* Teams */}
      <div>
        <Link href={`/livescore/team/${home.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, padding: "9px 14px 5px" }}>
          <TeamImg src={lsTeamImg(home.Img, home.ID)} name={home.Nm} size={16} />
          <span style={{
            fontSize: 14, fontWeight: homeWon ? 700 : 400,
            color: isFt && !homeWon ? C.muted : C.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{home.Nm}</span>
        </Link>
        <Link href={`/livescore/team/${away.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, padding: "5px 14px 9px" }}>
          <TeamImg src={lsTeamImg(away.Img, away.ID)} name={away.Nm} size={16} />
          <span style={{
            fontSize: 14, fontWeight: awayWon ? 700 : 400,
            color: isFt && !awayWon ? C.muted : C.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{away.Nm}</span>
        </Link>
      </div>

      {/* Scores */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minWidth: 38, paddingRight: 14 }}>
        {isNS
          ? <span style={{ fontSize: 12, color: C.dimmed }}>—</span>
          : <>
              <span style={{ fontSize: 16, fontWeight: 800, lineHeight: "1.7", color: isLive ? C.live : homeWon ? C.text : C.dimmed }}>{hs ?? "-"}</span>
              <span style={{ fontSize: 16, fontWeight: 800, lineHeight: "1.7", color: isLive ? C.live : awayWon ? C.text : C.dimmed }}>{as_ ?? "-"}</span>
            </>
        }
      </div>
    </div>
  );
}
