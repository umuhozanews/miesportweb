export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  getLsStageFixtures, lsTeamImg, lsTime, lsDate,
  lsIsNS, lsIsLive, lsIsFinished, type LsEvent,
} from "@/lib/livescoreCom";
import {
  getTournamentFixtures, getTournamentResults, teamImg as sfTeamImg, fmtDate, fmtTime,
  type SfEvent,
} from "@/lib/sofascore";
import { TeamImg } from "@/app/livescore/TeamImg";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

const SF_UIDS: Record<string, number> = { "17": 17, "16": 16 };

// ─── Sofascore event list ─────────────────────────────────────────────────────

function SfMatchRow({ e, last }: { e: SfEvent; last: boolean }) {
  const isLive = e.status.type === "inprogress";
  const isFt = e.status.type === "finished";
  const isNS = e.status.type === "notstarted";
  const hs = e.homeScore?.current ?? null;
  const as_ = e.awayScore?.current ?? null;
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "80px 1fr auto 1fr auto",
      alignItems: "center",
      gap: 10,
      padding: "0 14px",
      borderBottom: !last ? "1px solid #181818" : "none",
      background: isLive ? "rgba(34,197,94,0.04)" : "#1c1c1c",
      minHeight: 52,
    }}>
      {/* Date + time */}
      <div>
        <div style={{ fontSize: 10, color: "#404040" }}>{fmtDate(e.startTimestamp)}</div>
        {isLive
          ? <div style={{ fontSize: 11, fontWeight: 900, color: "#22c55e" }}>LIVE</div>
          : isFt
          ? <div style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>FT</div>
          : <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{fmtTime(e.startTimestamp)}</div>}
      </div>
      {/* Home */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 13, fontWeight: isFt && hs !== null && as_ !== null && hs > as_ ? 700 : 400, color: isFt && hs !== null && as_ !== null && hs < as_ ? "#484848" : "#d8d8d8", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {e.homeTeam.name}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sfTeamImg(e.homeTeam.id)} alt={e.homeTeam.name} width={18} height={18} style={{ borderRadius: 2, objectFit: "contain" }} />
      </div>
      {/* Score */}
      <div style={{ textAlign: "center", minWidth: 52, flexShrink: 0 }}>
        {(isFt || isLive) && hs !== null && as_ !== null
          ? <span style={{ fontSize: 15, fontWeight: 900, color: isLive ? "#22c55e" : "#e8e8e8", fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>{hs} – {as_}</span>
          : isNS
          ? <span style={{ fontSize: 12, color: "#303030", fontWeight: 600 }}>vs</span>
          : <span style={{ fontSize: 12, color: "#303030" }}>{e.status.description}</span>}
      </div>
      {/* Away */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sfTeamImg(e.awayTeam.id)} alt={e.awayTeam.name} width={18} height={18} style={{ borderRadius: 2, objectFit: "contain" }} />
        <span style={{ fontSize: 13, fontWeight: isFt && hs !== null && as_ !== null && as_ > hs ? 700 : 400, color: isFt && hs !== null && as_ !== null && as_ < hs ? "#484848" : "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {e.awayTeam.name}
        </span>
      </div>
      {/* Round */}
      {e.roundInfo?.round && (
        <span style={{ fontSize: 10, color: "#3a3a3a", flexShrink: 0, fontWeight: 700 }}>R{e.roundInfo.round}</span>
      )}
    </div>
  );
}

function SfMatchTable({ events }: { events: SfEvent[] }) {
  if (events.length === 0) return <Empty label="No upcoming fixtures" />;
  return (
    <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
      {events.map((e, i) => <SfMatchRow key={e.id} e={e} last={i === events.length - 1} />)}
    </div>
  );
}

// ─── Livescore event list (kept for non-SF tournaments) ───────────────────────

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
            <div>
              <div style={{ fontSize: 10, color: "#404040" }}>{lsDate(e.Esd)}</div>
              {isLive
                ? <div style={{ fontSize: 11, fontWeight: 900, color: "#22c55e" }}>{e.Eps}</div>
                : isFt
                ? <div style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>{e.Eps}</div>
                : <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{lsTime(e.Esd)}</div>}
            </div>
            <Link href={`/livescore/team/${home.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 13, fontWeight: isFt && hs !== null && as_ !== null && hs > as_ ? 700 : 400, color: isFt && hs !== null && as_ !== null && hs < as_ ? "#484848" : "#d8d8d8", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {home.Nm}
              </span>
              <TeamImg src={lsTeamImg(home.Img, home.ID)} name={home.Nm} size={18} />
            </Link>
            <div style={{ textAlign: "center", minWidth: 52, flexShrink: 0 }}>
              {(isFt || isLive) && hs !== null && as_ !== null
                ? <span style={{ fontSize: 15, fontWeight: 900, color: isLive ? "#22c55e" : "#e8e8e8", fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>{hs} – {as_}</span>
                : isNS
                ? <span style={{ fontSize: 12, color: "#303030", fontWeight: 600 }}>vs</span>
                : <span style={{ fontSize: 12, color: "#303030" }}>{e.Eps}</span>}
            </div>
            <Link href={`/livescore/team/${away.ID}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <TeamImg src={lsTeamImg(away.Img, away.ID)} name={away.Nm} size={18} />
              <span style={{ fontSize: 13, fontWeight: isFt && hs !== null && as_ !== null && as_ > hs ? 700 : 400, color: isFt && hs !== null && as_ !== null && as_ < hs ? "#484848" : "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {away.Nm}
              </span>
            </Link>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TournamentFixturesPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;

  const sfUid = SF_UIDS[tournamentId];
  if (sfUid) {
    const events = await getTournamentFixtures(sfUid, Number(seasonId));
    // If no upcoming fixtures, show last results instead
    if (events.length === 0) {
      const results = await getTournamentResults(sfUid, Number(seasonId));
      return <SfMatchTable events={results.slice(0, 20)} />;
    }
    return <SfMatchTable events={events} />;
  }

  const fixtures = await getLsStageFixtures(seasonId);
  if (fixtures.length === 0) return <Empty label="No upcoming fixtures" />;
  return <CompMatchTable events={fixtures} />;
}
