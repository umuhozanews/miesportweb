export const dynamic = "force-dynamic";
import Link from "next/link";
import { getTournamentFixtures, teamImg, fmtDate, fmtTime, type SfEvent } from "@/lib/sofascore";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

export default async function TournamentFixturesPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;
  const fixtures = await getTournamentFixtures(Number(tournamentId), Number(seasonId));
  if (fixtures.length === 0) return <Empty label="No upcoming fixtures" />;
  return <MatchTable events={fixtures} />;
}

export function MatchTable({ events }: { events: SfEvent[] }) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {events.map((e, i) => {
        const isLive = e.status.type === "inprogress";
        const isFt = e.status.type === "finished";
        const hs = e.homeScore.current ?? 0;
        const as_ = e.awayScore.current ?? 0;

        return (
          <div
            key={e.id}
            className="sf-row"
            style={{
              display: "grid",
              gridTemplateColumns: "72px 1fr auto 1fr auto",
              alignItems: "center",
              gap: 10,
              padding: "0 14px",
              borderBottom: i < events.length - 1 ? "1px solid #181818" : "none",
              background: isLive ? "rgba(34,197,94,0.04)" : "#1c1c1c",
              minHeight: 52,
            }}
          >
            {/* Date + time */}
            <div>
              <div style={{ fontSize: 10, color: "#404040" }}>{fmtDate(e.startTimestamp)}</div>
              {isLive ? (
                <div style={{ fontSize: 11, fontWeight: 900, color: "#22c55e" }}>{e.status.description}</div>
              ) : isFt ? (
                <div style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>FT</div>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{fmtTime(e.startTimestamp)}</div>
              )}
            </div>

            {/* Home */}
            <Link href={`/livescore/team/${e.homeTeam.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 13, fontWeight: isFt && hs > as_ ? 700 : 400, color: isFt && hs < as_ ? "#484848" : "#d8d8d8", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.homeTeam.name}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamImg(e.homeTeam.id)} alt="" width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
            </Link>

            {/* Score */}
            <div style={{ textAlign: "center", minWidth: 52, flexShrink: 0 }}>
              {isFt || isLive ? (
                <span style={{ fontSize: 15, fontWeight: 900, color: isLive ? "#22c55e" : "#e8e8e8", fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>
                  {hs} – {as_}
                </span>
              ) : (
                <span style={{ fontSize: 12, color: "#303030", fontWeight: 600 }}>vs</span>
              )}
            </div>

            {/* Away */}
            <Link href={`/livescore/team/${e.awayTeam.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamImg(e.awayTeam.id)} alt="" width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: isFt && as_ > hs ? 700 : 400, color: isFt && as_ < hs ? "#484848" : "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.awayTeam.name}
              </span>
            </Link>

            {/* Round */}
            {e.roundInfo?.round && (
              <span style={{ fontSize: 10, color: "#3a3a3a", flexShrink: 0, fontWeight: 700 }}>R{e.roundInfo.round}</span>
            )}
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
