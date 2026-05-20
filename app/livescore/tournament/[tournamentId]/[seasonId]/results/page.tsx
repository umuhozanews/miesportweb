export const dynamic = "force-dynamic";
import { getLsStageResults } from "@/lib/livescoreCom";
import { getTournamentResults, type SfEvent, teamImg as sfTeamImg, fmtDate, fmtTime } from "@/lib/sofascore";
import { CompMatchTable, Empty } from "../page";

type Props = { params: Promise<{ tournamentId: string; seasonId: string }> };

const SF_UIDS: Record<string, number> = { "17": 17, "16": 16 };

function SfResultRow({ e, last }: { e: SfEvent; last: boolean }) {
  const isFt = e.status.type === "finished";
  const isLive = e.status.type === "inprogress";
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
      <div>
        <div style={{ fontSize: 10, color: "#404040" }}>{fmtDate(e.startTimestamp)}</div>
        {isLive
          ? <div style={{ fontSize: 11, fontWeight: 900, color: "#22c55e" }}>LIVE</div>
          : <div style={{ fontSize: 11, fontWeight: 700, color: "#3a3a3a" }}>{isFt ? "FT" : e.status.description}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 13, fontWeight: hs !== null && as_ !== null && hs > as_ ? 700 : 400, color: hs !== null && as_ !== null && hs < as_ ? "#484848" : "#d8d8d8", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {e.homeTeam.name}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sfTeamImg(e.homeTeam.id)} alt={e.homeTeam.name} width={18} height={18} style={{ borderRadius: 2, objectFit: "contain" }} />
      </div>
      <div style={{ textAlign: "center", minWidth: 52, flexShrink: 0 }}>
        {hs !== null && as_ !== null
          ? <span style={{ fontSize: 15, fontWeight: 900, color: isLive ? "#22c55e" : "#e8e8e8", fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>{hs} – {as_}</span>
          : <span style={{ fontSize: 12, color: "#303030" }}>—</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sfTeamImg(e.awayTeam.id)} alt={e.awayTeam.name} width={18} height={18} style={{ borderRadius: 2, objectFit: "contain" }} />
        <span style={{ fontSize: 13, fontWeight: hs !== null && as_ !== null && as_ > hs ? 700 : 400, color: hs !== null && as_ !== null && as_ < hs ? "#484848" : "#d8d8d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {e.awayTeam.name}
        </span>
      </div>
      {e.roundInfo?.round && (
        <span style={{ fontSize: 10, color: "#3a3a3a", flexShrink: 0, fontWeight: 700 }}>R{e.roundInfo.round}</span>
      )}
    </div>
  );
}

export default async function TournamentResultsPage({ params }: Props) {
  const { tournamentId, seasonId } = await params;

  const sfUid = SF_UIDS[tournamentId];
  if (sfUid) {
    const events = await getTournamentResults(sfUid, Number(seasonId));
    if (events.length === 0) return <Empty label="No results yet" />;
    return (
      <div style={{ borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
        {events.map((e, i) => <SfResultRow key={e.id} e={e} last={i === events.length - 1} />)}
      </div>
    );
  }

  const results = await getLsStageResults(seasonId);
  if (results.length === 0) return <Empty label="No results yet" />;
  return <CompMatchTable events={results} />;
}
