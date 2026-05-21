export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  getESPNNBAStandings, getESPNNBAScoreboard,
  espnFmtTime,
  type NbaConference, type EspnEvent,
} from "@/lib/espn";

type Props = { searchParams: Promise<{ tab?: string; date?: string }> };

export default async function NBAPage({ searchParams }: Props) {
  const { tab = "scores", date } = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const activeDate = date ?? today;

  const TABS = [
    { id: "scores",    label: "Scores" },
    { id: "fixtures",  label: "Fixtures" },
    { id: "results",   label: "Results" },
    { id: "standings", label: "Standings" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        {TABS.map((t) => (
          <Link key={t.id} href={`?tab=${t.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
            <span style={{
              display: "block", padding: "5px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#111" : "rgba(255,255,255,0.5)",
              border: tab === t.id ? "none" : "1px solid rgba(255,255,255,0.12)",
            }}>
              {t.label}
            </span>
          </Link>
        ))}
      </div>

      {tab === "scores"    && <NBAScores   date={activeDate} mode="all" />}
      {tab === "fixtures"  && <NBAScores   date={activeDate} mode="scheduled" />}
      {tab === "results"   && <NBAScores   date={activeDate} mode="finished" />}
      {tab === "standings" && <NBAStandings />}
    </div>
  );
}

async function NBAScores({ date, mode }: { date: string; mode: "all" | "scheduled" | "finished" }) {
  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const allEvents = await getESPNNBAScoreboard(date);
  const events = mode === "all"
    ? allEvents
    : allEvents.filter((e) => mode === "finished" ? e.status === "finished" : e.status !== "finished");

  return (
    <div>
      {/* Date nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, background: "#0d1828", borderRadius: 10, padding: "9px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href={`?tab=${mode === "finished" ? "results" : mode === "scheduled" ? "fixtures" : "scores"}&date=${prev}`} style={{ color: "#6b90b8", textDecoration: "none", fontSize: 18, lineHeight: 1, padding: "0 6px", fontWeight: 300 }}>‹</Link>
        <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 14, color: "#fff" }}>{dateLabel(date)}</span>
        <Link href={`?tab=${mode === "finished" ? "results" : mode === "scheduled" ? "fixtures" : "scores"}&date=${next}`} style={{ color: "#6b90b8", textDecoration: "none", fontSize: 18, lineHeight: 1, padding: "0 6px", fontWeight: 300 }}>›</Link>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#5a7090" }}>
          <p style={{ fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
            {mode === "finished" ? "No results" : mode === "scheduled" ? "No fixtures" : "No games scheduled"}
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>Try another date</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {events.map((e) => <NBAMatchRow key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}

function NBAMatchRow({ event: e }: { event: EspnEvent }) {
  const isLive = e.status === "live";
  const isFt   = e.status === "finished";
  const isNS   = e.status === "scheduled";
  const hs  = e.homeScore;
  const as_ = e.awayScore;
  const homeWon = isFt && hs !== null && as_ !== null && hs > as_;
  const awayWon = isFt && hs !== null && as_ !== null && as_ > hs;

  return (
    <div style={{ background: "#0d1828", border: `1px solid ${isLive ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", alignItems: "stretch" }}>
        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "0 8px" }}>
          {isLive
            ? <span style={{ fontSize: 11, fontWeight: 900, color: "#22c55e", textAlign: "center" }}>
                {e.statusDetail?.includes("Half") ? "HT" : "LIVE"}
              </span>
            : isFt
            ? <span style={{ fontSize: 11, fontWeight: 700, color: "#4a6580" }}>FT</span>
            : <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>{espnFmtTime(e.startTimestamp)}</span>
          }
        </div>

        {/* Teams */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px 6px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.homeTeam.logo} width={16} height={16} alt="" style={{ borderRadius: 2, objectFit: "contain" }} />
            <span style={{ fontSize: 14, fontWeight: homeWon ? 700 : 400, color: isFt && !homeWon ? "#4a6580" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {e.homeTeam.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 14px 8px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.awayTeam.logo} width={16} height={16} alt="" style={{ borderRadius: 2, objectFit: "contain" }} />
            <span style={{ fontSize: 14, fontWeight: awayWon ? 700 : 400, color: isFt && !awayWon ? "#4a6580" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {e.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Scores */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", paddingRight: 16 }}>
          {isNS ? (
            <span style={{ fontSize: 12, color: "#4a6580" }}>vs</span>
          ) : (
            <>
              <span style={{ fontSize: 16, fontWeight: 800, color: isLive ? "#22c55e" : homeWon ? "#fff" : "#4a6580", lineHeight: "2.1", minWidth: 24, textAlign: "center" }}>{hs ?? "-"}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: isLive ? "#22c55e" : awayWon ? "#fff" : "#4a6580", lineHeight: "2.1", minWidth: 24, textAlign: "center" }}>{as_ ?? "-"}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

async function NBAStandings() {
  const conferences = await getESPNNBAStandings();

  if (conferences.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#5a7090" }}>
        <p style={{ fontWeight: 700, color: "#fff", margin: 0 }}>Standings not available</p>
      </div>
    );
  }

  const COL = "32px 26px 1fr 36px 36px 36px 36px 48px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {conferences.map((conf) => (
        <div key={conf.name}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#4a6580", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            {conf.name}
          </div>
          <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px", background: "#0a1628", fontSize: 9, fontWeight: 800, color: "#2e4060", textTransform: "uppercase", letterSpacing: 1 }}>
              <span>#</span><span /><span>Team</span>
              <span style={{ textAlign: "center" }}>W</span>
              <span style={{ textAlign: "center" }}>L</span>
              <span style={{ textAlign: "center" }}>PCT</span>
              <span style={{ textAlign: "center" }}>GB</span>
              <span style={{ textAlign: "center" }}>Pts</span>
            </div>
            {conf.rows.map((row, i) => {
              const pct = row.played > 0 ? (row.wins / row.played).toFixed(3).replace("0.", ".") : ".000";
              const pos = row.position > 0 ? row.position : i + 1;
              const isPlayoffs = pos <= 8;
              return (
                <div key={row.team.id} style={{
                  display: "grid", gridTemplateColumns: COL, gap: 4, padding: "9px 14px", alignItems: "center",
                  borderBottom: i < conf.rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  borderLeft: isPlayoffs ? "3px solid #22c55e" : "3px solid transparent",
                  background: "#0d1828",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2e4060" }}>{pos}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.team.logo} alt="" width={22} height={22} style={{ objectFit: "contain" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#d8d8d8" }}>{row.team.name}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
                  <span style={{ fontSize: 12, textAlign: "center", color: "#6b90b8" }}>{pct}</span>
                  <span style={{ fontSize: 11, textAlign: "center", color: "#3a5070" }}>—</span>
                  <span style={{ fontSize: 13, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p style={{ fontSize: 10, color: "#2a3a50", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
        Top 8 per conference qualify for playoffs
      </p>
    </div>
  );
}

function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().split("T")[0];
}

function dateLabel(d: string) {
  const today = new Date().toISOString().split("T")[0];
  if (d === today) return "Today · NBA";
  const dt = new Date(d + "T00:00:00Z");
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }) + " · NBA";
}
