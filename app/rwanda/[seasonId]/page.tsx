export const dynamic = "force-dynamic";
import { getRPStandings, getRPRecentMatches, getRPNextMatches, teamImg, fmtRPDate, fmtRPTime, type RPEvent, type RPStandingRow } from "@/lib/rwandapl";

type Props = { params: Promise<{ seasonId: string }> };

export default async function RwandaOverviewPage({ params }: Props) {
  const { seasonId } = await params;
  const sid = Number(seasonId);

  const [rows, recent, next] = await Promise.all([
    getRPStandings(sid),
    getRPRecentMatches(sid),
    getRPNextMatches(sid),
  ]);

  const featured = next.length > 0 ? next.slice(0, 4) : recent.slice(0, 4);

  return (
    <div style={{ padding: "1.25rem" }}>
      {/* Recent / Upcoming matches */}
      {featured.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <SectionLabel>{next.length > 0 ? "Upcoming Matches" : "Recent Results"}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {featured.map((e) => <MatchCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* Standings preview (top 5) */}
      {rows.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <SectionLabel>Standings</SectionLabel>
            <a href={`/rwanda/${seasonId}/standings`} style={{ textDecoration: "none", fontSize: 11, color: "#f5a623", fontWeight: 700 }}>Full table →</a>
          </div>
          <MiniTable rows={rows.slice(0, 6)} />
        </section>
      )}
    </div>
  );
}

function MatchCard({ event: e }: { event: RPEvent }) {
  const isLive = e.status.type === "inprogress";
  const isFt   = e.status.type === "finished";
  const hs = e.homeScore.current ?? 0;
  const as_ = e.awayScore.current ?? 0;

  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #222", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TeamBlock id={e.homeTeam.id} name={e.homeTeam.name} align="left" bold={isFt && hs > as_} dim={isFt && hs < as_} />
        <div style={{ textAlign: "center", padding: "0 8px", flexShrink: 0 }}>
          {isFt || isLive ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: isLive ? "#22c55e" : "#f0f0f0", letterSpacing: -1 }}>{hs} – {as_}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: isLive ? "#22c55e" : "#444", marginTop: 2 }}>{isLive ? e.status.description : "FT"}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#60a5fa" }}>{fmtRPTime(e.startTimestamp)}</div>
              <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 2 }}>{fmtRPDate(e.startTimestamp)}</div>
            </>
          )}
        </div>
        <TeamBlock id={e.awayTeam.id} name={e.awayTeam.name} align="right" bold={isFt && as_ > hs} dim={isFt && as_ < hs} />
      </div>
    </div>
  );
}

function TeamBlock({ id, name, align, bold, dim }: { id: number; name: string; align: "left" | "right"; bold?: boolean; dim?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "flex-end", gap: 6, flex: 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={teamImg(id)} alt="" width={30} height={30} style={{ objectFit: "contain" }} />
      <span style={{ fontSize: 11, fontWeight: bold ? 800 : 500, color: dim ? "#3a3a3a" : "#d8d8d8", textAlign: align, lineHeight: 1.2 }}>{name}</span>
    </div>
  );
}

const MINI_COL = "22px 20px 1fr 26px 26px 26px 26px 32px";

function MiniTable({ rows }: { rows: RPStandingRow[] }) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: MINI_COL, gap: 4, padding: "7px 12px", background: "#141e30", fontSize: 9, fontWeight: 800, color: "#354060", textTransform: "uppercase", letterSpacing: 1 }}>
        <span>#</span><span />
        <span>Team</span>
        <span style={{ textAlign: "center" }}>P</span>
        <span style={{ textAlign: "center" }}>W</span>
        <span style={{ textAlign: "center" }}>D</span>
        <span style={{ textAlign: "center" }}>L</span>
        <span style={{ textAlign: "center" }}>Pts</span>
      </div>
      {rows.map((row, i) => {
        const isChampion = row.promotion?.id === 804;
        const isCaf = row.promotion?.id === 25;
        const accent = isChampion ? "#f5a623" : isCaf ? "#22c55e" : "transparent";
        return (
          <div key={row.team.id} style={{
            display: "grid", gridTemplateColumns: MINI_COL, gap: 4, padding: "8px 12px",
            alignItems: "center",
            borderBottom: i < rows.length - 1 ? "1px solid #181818" : "none",
            background: "#1c1c1c",
            borderLeft: `3px solid ${accent}`,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>{row.position}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamImg(row.team.id)} alt="" width={18} height={18} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#d0d0d0" }}>{row.team.name}</span>
            <span style={{ fontSize: 11, textAlign: "center", color: "#666" }}>{row.matches}</span>
            <span style={{ fontSize: 11, textAlign: "center", color: "#22c55e", fontWeight: 700 }}>{row.wins}</span>
            <span style={{ fontSize: 11, textAlign: "center", color: "#666" }}>{row.draws}</span>
            <span style={{ fontSize: 11, textAlign: "center", color: "#f87171" }}>{row.losses}</span>
            <span style={{ fontSize: 13, textAlign: "center", fontWeight: 900, color: "#e8e8e8" }}>{row.points}</span>
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{children}</div>;
}
