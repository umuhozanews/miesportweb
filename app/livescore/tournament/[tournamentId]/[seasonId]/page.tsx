export const dynamic = "force-dynamic";
import Link from "next/link";
import { getLsStageFixtures, lsTeamImg, lsTime, lsDate, lsIsNS, lsIsLive, lsIsFinished, type LsEvent } from "@/lib/livescoreCom";
import { TeamImg } from "@/app/livescore/TeamImg";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

export default async function TournamentFixturesPage({ params }: Props) {
  const { seasonId } = await params;
  const fixtures = await getLsStageFixtures(seasonId);
  if (fixtures.length === 0) return <Empty label="No upcoming fixtures" />;
  return <CompMatchTable events={fixtures} />;
}

export function CompMatchTable({ events }: { events: LsEvent[] }) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {events.map((e, i) => {
        const home = e.T1?.[0];
        const away = e.T2?.[0];
        if (!home || !away) return null;

        const isLive = lsIsLive(e);
        const isFt = lsIsFinished(e);
        const isNS = lsIsNS(e);
        const hs = e.Tr1 !== undefined ? Number(e.Tr1) : null;
        const as_ = e.Tr2 !== undefined ? Number(e.Tr2) : null;

        return (
          <div
            key={e.Eid}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr auto 1fr auto",
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
              <div style={{ fontSize: 10, color: "#404040" }}>{lsDate(e.Esd)}</div>
              {isLive ? (
                <div style={{ fontSize: 11, fontWeight: 900, color: "#22c55e" }}>{e.Eps}</div>
              ) : isFt ? (
                <div style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>{e.Eps}</div>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{lsTime(e.Esd)}</div>
              )}
            </div>

            {/* Home */}
            <Link href={`/livescore/team/${home.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 13, fontWeight: isFt && hs !== null && as_ !== null && hs > as_ ? 700 : 400, color: isFt && hs !== null && as_ !== null && hs < as_ ? "#484848" : "#d8d8d8", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {home.Nm}
              </span>
              <TeamImg src={lsTeamImg(home.Img, home.ID)} name={home.Nm} size={18} />
            </Link>

            {/* Score */}
            <div style={{ textAlign: "center", minWidth: 52, flexShrink: 0 }}>
              {(isFt || isLive) && hs !== null && as_ !== null ? (
                <span style={{ fontSize: 15, fontWeight: 900, color: isLive ? "#22c55e" : "#e8e8e8", fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>
                  {hs} – {as_}
                </span>
              ) : isNS ? (
                <span style={{ fontSize: 12, color: "#303030", fontWeight: 600 }}>vs</span>
              ) : (
                <span style={{ fontSize: 12, color: "#303030" }}>{e.Eps}</span>
              )}
            </div>

            {/* Away */}
            <Link href={`/livescore/team/${away.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <TeamImg src={lsTeamImg(away.Img, away.ID)} name={away.Nm} size={18} />
              <span style={{ fontSize: 13, fontWeight: isFt && hs !== null && as_ !== null && as_ > hs ? 700 : 400, color: isFt && hs !== null && as_ !== null && as_ < hs ? "#484848" : "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {away.Nm}
              </span>
            </Link>

            {/* Round */}
            {e.ErnInf && (
              <span style={{ fontSize: 10, color: "#3a3a3a", flexShrink: 0, fontWeight: 700 }}>{e.ErnInf}</span>
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
