export const dynamic = "force-dynamic";
import { getESPNWCFixtures, getESPNWCResults, espnFmtDate, type EspnEvent } from "@/lib/espn";

type Props = { params: Promise<{ year: string }> };

export default async function WCKnockoutPage({ params }: Props) {
  const { year } = await params;

  if (year !== "2026") return <Empty />;

  const [fixtures, results] = await Promise.all([
    getESPNWCFixtures(),
    getESPNWCResults(),
  ]);

  // Knockout matches have no groupName; group stage matches have groupName like "A", "B"...
  const all = [...results, ...fixtures];
  const knockout = all.filter((e) => !e.groupName);

  if (knockout.length === 0) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#444" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
        <p style={{ fontSize: 13, color: "#555" }}>Knockout stage hasn&apos;t started yet.</p>
        <p style={{ fontSize: 11, color: "#333", marginTop: 6 }}>Starts after the group stage in July 2026.</p>
      </div>
    );
  }

  const played = knockout.filter((e) => e.status === "finished" || e.status === "live");
  const scheduled = knockout.filter((e) => e.status === "scheduled");

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {played.length > 0 && (
        <section>
          <StageHeader label="Results" />
          <div style={{ display: "grid", gridTemplateColumns: played.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
            {played.map((e) => <KnockoutCard key={e.id} event={e} />)}
          </div>
        </section>
      )}
      {scheduled.length > 0 && (
        <section>
          <StageHeader label="Upcoming" dim />
          <div style={{ display: "grid", gridTemplateColumns: scheduled.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
            {scheduled.map((e) => <KnockoutCard key={e.id} event={e} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function StageHeader({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: dim ? "#3a3a3a" : "#f5a623", letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
    </div>
  );
}

function KnockoutCard({ event: e }: { event: EspnEvent }) {
  const isFt = e.status === "finished";
  const isLive = e.status === "live";
  const isNs = e.status === "scheduled";
  const hs = e.homeScore ?? 0;
  const as_ = e.awayScore ?? 0;
  const homeWon = isFt && hs > as_;
  const awayWon = isFt && as_ > hs;

  return (
    <div style={{
      background: "#1a1a1a",
      border: `1px solid ${isLive ? "rgba(34,197,94,0.25)" : "#222"}`,
      borderRadius: 10,
      padding: "14px 16px",
    }}>
      <div style={{ fontSize: 10, color: "#3a3a3a", marginBottom: 12, fontWeight: 700 }}>
        {isLive
          ? <span style={{ color: "#22c55e" }}>● LIVE</span>
          : isFt ? `FT · ${espnFmtDate(e.startTimestamp)}`
          : espnFmtDate(e.startTimestamp)
        }
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, opacity: isFt && !homeWon ? 0.4 : 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.homeTeam.logo} alt="" width={24} height={24} style={{ objectFit: "contain", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: homeWon ? 800 : 500, color: isNs ? "#aaa" : "#d8d8d8" }}>
          {e.homeTeam.abbreviation || e.homeTeam.name}
        </span>
        <span style={{ fontSize: 16, fontWeight: 900, color: isLive ? "#22c55e" : "#f0f0f0", minWidth: 20, textAlign: "right" }}>
          {(isFt || isLive) ? hs : ""}
        </span>
        {homeWon && <WinBadge />}
      </div>

      <div style={{ height: 1, background: "#222", marginBottom: 8 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: isFt && !awayWon ? 0.4 : 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.awayTeam.logo} alt="" width={24} height={24} style={{ objectFit: "contain", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: awayWon ? 800 : 500, color: isNs ? "#aaa" : "#d8d8d8" }}>
          {e.awayTeam.abbreviation || e.awayTeam.name}
        </span>
        <span style={{ fontSize: 16, fontWeight: 900, color: isLive ? "#22c55e" : "#f0f0f0", minWidth: 20, textAlign: "right" }}>
          {(isFt || isLive) ? as_ : ""}
        </span>
        {awayWon && <WinBadge />}
      </div>

      {isNs && (
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "#3a3a3a", fontWeight: 600 }}>Scheduled</div>
      )}
    </div>
  );
}

function WinBadge() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color: "#22c55e",
      background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
      padding: "2px 6px", borderRadius: 4, flexShrink: 0, letterSpacing: 0.5,
    }}>WIN</span>
  );
}

function Empty() {
  return <div style={{ padding: "3rem", textAlign: "center", color: "#444", fontSize: 13 }}>No knockout data available.</div>;
}
