export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  BBALL_LEAGUES,
  getESPNBballScoreboard,
  espnFmtTime,
  type EspnEvent,
} from "@/lib/espn";

type Props = { params: Promise<{ league: string }>; searchParams: Promise<{ date?: string }> };

function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().split("T")[0];
}

function BballMatchRow({ event: e }: { event: EspnEvent }) {
  const isLive = e.status === "live";
  return (
    <div style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, overflow: "hidden", marginBottom: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", alignItems: "stretch" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "6px 4px" }}>
          {isLive
            ? <span style={{ fontSize: 10, fontWeight: 900, color: "#22c55e" }}>LIVE</span>
            : <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>{espnFmtTime(e.startTimestamp)}</span>
          }
        </div>
        <div>
          {[e.homeTeam, e.awayTeam].map((team, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: i === 0 ? "7px 12px 5px" : "5px 12px 7px", borderTop: i === 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={team.logo} width={16} height={16} alt="" style={{ objectFit: "contain", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 14px", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
          {isLive ? <span style={{ fontSize: 11, fontWeight: 900, color: "#22c55e" }}>{e.statusDetail}</span> : "vs"}
        </div>
      </div>
    </div>
  );
}

export default async function BballFixturesPage({ params, searchParams }: Props) {
  const { league } = await params;
  const { date } = await searchParams;
  const info = BBALL_LEAGUES[league];
  if (!info) return <div style={{ padding: "3rem", textAlign: "center", color: "#555" }}>League not found.</div>;

  const today = new Date().toISOString().split("T")[0];
  const activeDate = date ?? today;
  const prev = addDays(activeDate, -1);
  const next = addDays(activeDate, 1);

  const allEvents = await getESPNBballScoreboard(info.espnId, activeDate);
  const fixtures = allEvents.filter((e) => e.status !== "finished");

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
      {fixtures.length === 0
        ? <p style={{ color: "#555", fontSize: 13, textAlign: "center", padding: "3rem 0" }}>No fixtures on this date.</p>
        : fixtures.map((e) => <BballMatchRow key={e.id} event={e} />)
      }
    </div>
  );
}
