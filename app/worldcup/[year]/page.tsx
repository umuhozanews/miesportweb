export const dynamic = "force-dynamic";
import {
  getESPNWCFixturesByYear, getESPNWCStandingsByYear,
  espnFmtDate, espnFmtTime,
  type EspnEvent, type EspnGroup,
} from "@/lib/espn";
import {
  getWCRecentMatches, getWCNextMatches, getWCStandings,
  seasonId, fmtWCDate, fmtWCTime,
  type WCEvent, type WCGroup,
} from "@/lib/worldcup";

type Props = { params: Promise<{ year: string }> };

export default async function WCOverviewPage({ params }: Props) {
  const { year } = await params;
  const sid = seasonId(year);

  // 2026+: ESPN
  if (parseInt(year) >= 2026) {
    const [fixtures, standings] = await Promise.all([
      getESPNWCFixturesByYear(year),
      getESPNWCStandingsByYear(year),
    ]);
    const featuredMatches = fixtures.slice(0, 4);
    const firstGroup = standings[0] ?? null;

    if (featuredMatches.length === 0 && !firstGroup) {
      return (
        <Empty label={year === "2026" ? "Tournament begins June 11, 2026" : `No data available for ${year}`} />
      );
    }

    return (
      <div style={{ padding: "1.25rem" }}>
        {featuredMatches.length > 0 && (
          <section style={{ marginBottom: "1.5rem" }}>
            <SectionLabel>Upcoming Matches</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {featuredMatches.map((e) => <EspnMatchCard key={e.id} event={e} />)}
            </div>
          </section>
        )}
        {firstGroup && (
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <SectionLabel>Standings</SectionLabel>
              <a href={`/worldcup/${year}/standings`} style={{ textDecoration: "none", fontSize: 11, color: "#818CF8", fontWeight: 700 }}>Full view →</a>
            </div>
            <EspnGroupPreview group={firstGroup} year={year} />
          </section>
        )}
      </div>
    );
  }

  // Historical years: Sofascore
  if (sid) {
    const [recent, next, groups] = await Promise.all([
      getWCRecentMatches(sid),
      getWCNextMatches(sid),
      getWCStandings(sid),
    ]);
    const shown = next.length > 0 ? next.slice(0, 4) : recent.slice(-4).reverse();
    const firstGroup = groups[0] ?? null;

    return (
      <div style={{ padding: "1.25rem" }}>
        {shown.length > 0 && (
          <section style={{ marginBottom: "1.5rem" }}>
            <SectionLabel>{next.length > 0 ? "Upcoming Matches" : "Recent Results"}</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {shown.map((e) => <WCMatchCard key={e.id} event={e} />)}
            </div>
          </section>
        )}
        {firstGroup && (
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <SectionLabel>Standings</SectionLabel>
              <a href={`/worldcup/${year}/standings`} style={{ textDecoration: "none", fontSize: 11, color: "#818CF8", fontWeight: 700 }}>Full view →</a>
            </div>
            <WCGroupPreview group={firstGroup} year={year} />
          </section>
        )}
        {shown.length === 0 && !firstGroup && (
          <Empty label={`No data available for ${year}`} />
        )}
      </div>
    );
  }

  return <Empty label={`No data available for ${year}`} />;
}

// ── ESPN components ─────────────────────────────────────────────────────────

function EspnMatchCard({ event: e }: { event: EspnEvent }) {
  const isLive = e.status === "live";
  const isFt = e.status === "finished";
  const hs = e.homeScore ?? 0;
  const as_ = e.awayScore ?? 0;
  return (
    <div style={{ background: "rgba(30,27,75,0.55)", border: `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "rgba(67,56,202,0.25)"}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 10 }}>
        {e.groupName ? `Group ${e.groupName}` : "Match"} · {espnFmtDate(e.startTimestamp)}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TeamCard logo={e.homeTeam.logo} name={e.homeTeam.name} bold={isFt && hs > as_} dim={isFt && hs < as_} align="left" />
        <div style={{ textAlign: "center", padding: "0 10px", flexShrink: 0 }}>
          {isFt || isLive
            ? <><div style={{ fontSize: 20, fontWeight: 900, color: isLive ? "#22c55e" : "#fff", letterSpacing: -1 }}>{hs} – {as_}</div><div style={{ fontSize: 10, fontWeight: 700, color: isLive ? "#22c55e" : "rgba(255,255,255,0.3)", marginTop: 2 }}>{isLive ? "LIVE" : "FT"}</div></>
            : <><div style={{ fontSize: 14, fontWeight: 800, color: "#818CF8" }}>{espnFmtTime(e.startTimestamp)}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{espnFmtDate(e.startTimestamp)}</div></>
          }
        </div>
        <TeamCard logo={e.awayTeam.logo} name={e.awayTeam.name} bold={isFt && as_ > hs} dim={isFt && as_ < hs} align="right" />
      </div>
    </div>
  );
}

function EspnGroupPreview({ group, year }: { group: EspnGroup; year: string }) {
  const COL = "24px 22px 1fr 28px 28px 28px 28px 36px";
  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(67,56,202,0.25)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "rgba(67,56,202,0.18)" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>{group.name}</span>
        <a href={`/worldcup/${year}/standings`} style={{ textDecoration: "none", fontSize: 10, color: "#818CF8", fontWeight: 700 }}>All groups →</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "6px 12px", background: "rgba(15,15,35,0.5)", fontSize: 9, fontWeight: 800, color: "rgba(129,140,248,0.4)", textTransform: "uppercase" }}>
        <span>#</span><span /><span>Team</span>
        <span style={{ textAlign: "center" }}>P</span><span style={{ textAlign: "center" }}>W</span>
        <span style={{ textAlign: "center" }}>D</span><span style={{ textAlign: "center" }}>L</span>
        <span style={{ textAlign: "center" }}>Pts</span>
      </div>
      {group.rows.map((row, i) => {
        const pos = row.position > 0 ? row.position : i + 1;
        const isThrough = row.noteText
          ? row.noteText.toLowerCase().includes("advance") || row.noteText.toLowerCase().includes("qualify")
          : pos <= 2;
        return (
          <div key={row.team.id} style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "8px 12px", alignItems: "center", borderBottom: i < group.rows.length - 1 ? "1px solid rgba(67,56,202,0.12)" : "none", background: "rgba(15,15,35,0.4)", borderLeft: isThrough ? "3px solid #22c55e" : "3px solid transparent" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.28)" }}>{pos}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.team.logo} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{row.team.name}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "rgba(255,255,255,0.38)" }}>{row.played}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "rgba(255,255,255,0.38)" }}>{row.draws}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
            <span style={{ fontSize: 13, textAlign: "center", fontWeight: 900, color: "#fff" }}>{row.points}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Sofascore components ────────────────────────────────────────────────────

function WCMatchCard({ event: e }: { event: WCEvent }) {
  const isLive = e.status.type === "inprogress";
  const isFt = e.status.type === "finished";
  const hs = e.homeScore.current ?? 0;
  const as_ = e.awayScore.current ?? 0;
  const sfBase = "https://api.sofascore.com/api/v1";

  return (
    <div style={{ background: "rgba(30,27,75,0.55)", border: `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "rgba(67,56,202,0.25)"}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 10 }}>
        {e.groupName ? `Group ${e.groupName}` : (e.roundInfo?.name ?? "Match")} · {fmtWCDate(e.startTimestamp)}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <WCTeamCard id={e.homeTeam.id} name={e.homeTeam.name} bold={isFt && hs > as_} dim={isFt && hs < as_} align="left" base={sfBase} />
        <div style={{ textAlign: "center", padding: "0 10px", flexShrink: 0 }}>
          {isFt || isLive
            ? <><div style={{ fontSize: 20, fontWeight: 900, color: isLive ? "#22c55e" : "#fff", letterSpacing: -1 }}>{hs} – {as_}</div><div style={{ fontSize: 10, fontWeight: 700, color: isLive ? "#22c55e" : "rgba(255,255,255,0.3)", marginTop: 2 }}>{isLive ? e.status.description : "FT"}</div></>
            : <><div style={{ fontSize: 14, fontWeight: 800, color: "#818CF8" }}>{fmtWCTime(e.startTimestamp)}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{fmtWCDate(e.startTimestamp)}</div></>
          }
        </div>
        <WCTeamCard id={e.awayTeam.id} name={e.awayTeam.name} bold={isFt && as_ > hs} dim={isFt && as_ < hs} align="right" base={sfBase} />
      </div>
    </div>
  );
}

function WCGroupPreview({ group, year }: { group: WCGroup; year: string }) {
  const COL = "24px 22px 1fr 28px 28px 28px 28px 36px";
  const sfBase = "https://api.sofascore.com/api/v1";
  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(67,56,202,0.25)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "rgba(67,56,202,0.18)" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>{group.name}</span>
        <a href={`/worldcup/${year}/standings`} style={{ textDecoration: "none", fontSize: 10, color: "#818CF8", fontWeight: 700 }}>All groups →</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "6px 12px", background: "rgba(15,15,35,0.5)", fontSize: 9, fontWeight: 800, color: "rgba(129,140,248,0.4)", textTransform: "uppercase" }}>
        <span>#</span><span /><span>Team</span>
        <span style={{ textAlign: "center" }}>P</span><span style={{ textAlign: "center" }}>W</span>
        <span style={{ textAlign: "center" }}>D</span><span style={{ textAlign: "center" }}>L</span>
        <span style={{ textAlign: "center" }}>Pts</span>
      </div>
      {group.rows.map((row, i) => {
        const isThrough = row.descriptions
          ? row.descriptions.some(d => d.type === "qualified" || d.text.toLowerCase().includes("advance"))
          : row.position <= 2;
        return (
          <div key={row.team.id} style={{ display: "grid", gridTemplateColumns: COL, gap: 4, padding: "8px 12px", alignItems: "center", borderBottom: i < group.rows.length - 1 ? "1px solid rgba(67,56,202,0.12)" : "none", background: "rgba(15,15,35,0.4)", borderLeft: isThrough ? "3px solid #22c55e" : "3px solid transparent" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.28)" }}>{row.position}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${sfBase}/team/${row.team.id}/image`} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{row.team.name}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "rgba(255,255,255,0.38)" }}>{row.matches}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "rgba(255,255,255,0.38)" }}>{row.draws}</span>
            <span style={{ fontSize: 12, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
            <span style={{ fontSize: 13, textAlign: "center", fontWeight: 900, color: "#fff" }}>{row.points}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Shared helpers ──────────────────────────────────────────────────────────

function TeamCard({ logo, name, align, bold, dim }: { logo: string; name: string; align: "left" | "right"; bold?: boolean; dim?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "flex-end", gap: 6, flex: 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt="" width={32} height={32} style={{ objectFit: "contain" }} />
      <span style={{ fontSize: 12, fontWeight: bold ? 800 : 500, color: dim ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.85)", textAlign: align, lineHeight: 1.2 }}>{name}</span>
    </div>
  );
}

function WCTeamCard({ id, name, align, bold, dim, base }: { id: number; name: string; align: "left" | "right"; bold?: boolean; dim?: boolean; base: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "flex-end", gap: 6, flex: 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${base}/team/${id}/image`} alt="" width={32} height={32} style={{ objectFit: "contain" }} />
      <span style={{ fontSize: 12, fontWeight: bold ? 800 : 500, color: dim ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.85)", textAlign: align, lineHeight: 1.2 }}>{name}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{children}</div>;
}
function Empty({ label }: { label: string }) {
  return (
    <div style={{ padding: "3rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(67,56,202,0.1)", border: "1px solid rgba(67,56,202,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(129,140,248,0.5)" strokeWidth={1.4}><circle cx={12} cy={12} r={10} /><path strokeLinecap="round" d="M12 8v4m0 4h.01" /></svg>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 700, margin: 0 }}>{label}</p>
    </div>
  );
}
