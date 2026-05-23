export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  BBALL_LEAGUES,
  getESPNBballScoreboard,
  espnFmtDate,
  type EspnEvent,
} from "@/lib/espn";

type Props = { params: Promise<{ league: string }>; searchParams: Promise<{ date?: string }> };

function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().split("T")[0];
}

function BballResultRow({ event: e }: { event: EspnEvent }) {
  const hs = e.homeScore ?? 0;
  const as_ = e.awayScore ?? 0;
  const homeWon = hs > as_;
  const awayWon = as_ > hs;
  return (
    <div style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, overflow: "hidden", marginBottom: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", alignItems: "stretch" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "6px 4px", flexDirection: "column" }}>
          <span style={{ fontSize: 9, color: "#484848" }}>{espnFmtDate(e.startTimestamp)}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#555" }}>FT</span>
        </div>
        <div>
          {[{ team: e.homeTeam, won: homeWon }, { team: e.awayTeam, won: awayWon }].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: i === 0 ? "7px 12px 5px" : "5px 12px 7px", borderTop: i === 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.team.logo} width={16} height={16} alt="" style={{ objectFit: "contain", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: row.won ? 700 : 400, color: row.won ? "#fff" : "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.team.name}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "6px 14px 6px 4px" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: homeWon ? "#fff" : "rgba(255,255,255,0.3)", lineHeight: "2", textAlign: "right" }}>{hs}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: awayWon ? "#fff" : "rgba(255,255,255,0.3)", lineHeight: "2", textAlign: "right" }}>{as_}</span>
        </div>
      </div>
    </div>
  );
}

export default async function BballResultsPage({ params, searchParams }: Props) {
  const { league } = await params;
  const { date } = await searchParams;
  const info = BBALL_LEAGUES[league];
  if (!info) return <div style={{ padding: "3rem", textAlign: "center", color: "#555" }}>League not found.</div>;

  const today = new Date().toISOString().split("T")[0];
  const activeDate = date ?? today;
  const prev = addDays(activeDate, -1);
  const next = addDays(activeDate, 1);

  const allEvents = await getESPNBballScoreboard(info.espnId, activeDate);
  const results = allEvents.filter((e) => e.status === "finished");

  const dateLabel = activeDate === today
    ? "Today"
    : new Date(activeDate + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, background: "#1c1c1c", borderRadius: 8, padding: "9px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href={`?date=${prev}`} style={{ color: "#6b90b8", textDecoration: "none", fontSize: 18, padding: "0 6px", fontWeight: 300 }}>‹</Link>
        <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 14, color: "#fff" }}>{dateLabel} · {info.name}</span>
        <Link href={`?date=${next}`} style={{ color: "#6b90b8", textDecoration: "none", fontSize: 18, padding: "0 6px", fontWeight: 300 }}>›</Link>
      </div>
      {results.length === 0
        ? <p style={{ color: "#555", fontSize: 13, textAlign: "center", padding: "3rem 0" }}>No results on this date.</p>
        : results.map((e) => <BballResultRow key={e.id} event={e} />)
      }
    </div>
  );
}
