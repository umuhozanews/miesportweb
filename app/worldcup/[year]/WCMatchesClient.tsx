"use client";
import { useState, useEffect, useCallback } from "react";
import { type WCEvent, wcRoundNavLabel } from "@/lib/worldcup-client";

const C = { border: "rgba(255,255,255,0.08)", text: "#ffffff", muted: "#6b90b8", live: "#22c55e", blue: "#60a5fa" };

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" });
}
function fmtTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}
function teamImg(id: number) { return `https://api.sofascore.com/api/v1/team/${id}/image`; }

function groupEvents(events: WCEvent[]): Map<string, WCEvent[]> {
  const map = new Map<string, WCEvent[]>();
  for (const e of events) {
    const g = e.groupName ?? e.tournament?.name ?? "Matches";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(e);
  }
  return map;
}

function groupLabel(name: string): string {
  const m = name.match(/Group ([A-Z])/i);
  return m ? `Group ${m[1].toUpperCase()}` : name;
}

export function WCMatchesClient({
  seasonId,
  year,
  rounds,
}: {
  seasonId: number;
  year: string;
  rounds: number[];
}) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [events, setEvents] = useState<WCEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevSid, setPrevSid] = useState(seasonId);

  if (seasonId !== prevSid) {
    setPrevSid(seasonId);
    setRoundIdx(0);
  }

  const currentRound = rounds[roundIdx] ?? 1;

  const load = useCallback((round: number) => {
    setLoading(true);
    fetch(`/api/wc/matches?seasonId=${seasonId}&round=${round}`)
      .then((res) => res.json())
      .then((d) => { setEvents(d.events ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [seasonId]);

  useEffect(() => {
    load(currentRound);
  }, [load, currentRound]);

  const prev = () => {
    if (roundIdx > 0) {
      const newIdx = roundIdx - 1;
      setRoundIdx(newIdx);
      load(rounds[newIdx]);
    }
  };

  const next = () => {
    if (roundIdx < rounds.length - 1) {
      const newIdx = roundIdx + 1;
      setRoundIdx(newIdx);
      load(rounds[newIdx]);
    }
  };

  const grouped = groupEvents(events);
  const isFirst = roundIdx === 0;
  const isLast = roundIdx === rounds.length - 1;

  return (
    <div style={{ background: "#0d1828", borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", position: "sticky", top: 16 }}>
      {/* Panel header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, background: "#0a1628", borderLeft: "3px solid #1e4db7" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", letterSpacing: 0.3 }}>
          FIFA World Cup {year}
        </div>
      </div>

      {/* Round navigation */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: "#0b1830", gap: 8 }}>
        <button
          onClick={prev}
          disabled={isFirst}
          style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, color: isFirst ? "rgba(255,255,255,0.2)" : "#ffffff", width: 30, height: 30, borderRadius: 6, cursor: isFirst ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          ‹
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
          {wcRoundNavLabel(currentRound)}
        </span>
        <button
          onClick={next}
          disabled={isLast}
          style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, color: isLast ? "rgba(255,255,255,0.2)" : "#ffffff", width: 30, height: 30, borderRadius: 6, cursor: isLast ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          ›
        </button>
      </div>

      {/* Match list */}
      <div style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
        {loading && (
          <div style={{ padding: "1.5rem" }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ height: 44, background: "#1e1e1e", borderRadius: 6, marginBottom: 6 }} className="skeleton" />
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: C.muted, fontSize: 13 }}>
            No matches scheduled for this round yet
          </div>
        )}

        {!loading && grouped.size > 0 && [...grouped.entries()].map(([grpName, grpEvents]) => (
          <div key={grpName}>
            <div style={{ padding: "8px 14px 4px", fontSize: 11, fontWeight: 800, color: "#4a7ab5", letterSpacing: 1.2, textTransform: "uppercase" }}>
              {groupLabel(grpName)}
            </div>
            {grpEvents.map((e) => {
              const isLive = e.status.type === "inprogress";
              const isFt   = e.status.type === "finished";
              const hs = e.homeScore.current ?? 0;
              const as_ = e.awayScore.current ?? 0;

              return (
                <div key={e.id} style={{
                  display: "grid",
                  gridTemplateColumns: "52px 1fr auto",
                  alignItems: "center",
                  padding: "8px 14px",
                  borderBottom: `1px solid ${C.border}`,
                  background: isLive ? "rgba(34,197,94,0.04)" : "transparent",
                }}>
                  {/* Date/time */}
                  <div style={{ textAlign: "center" }}>
                    {isLive ? (
                      <span style={{ fontSize: 11, fontWeight: 900, color: C.live }}>{e.status.description}</span>
                    ) : isFt ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>FT</span>
                    ) : (
                      <div>
                        <div style={{ fontSize: 10, color: C.muted }}>{fmtDate(e.startTimestamp)}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{fmtTime(e.startTimestamp)}</div>
                      </div>
                    )}
                  </div>

                  {/* Teams */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={teamImg(e.homeTeam.id)} alt="" width={15} height={15} style={{ objectFit: "contain", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: isFt && hs > as_ ? 700 : 400, color: isFt && hs < as_ ? "#3a5070" : "#ffffff" }}>{e.homeTeam.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={teamImg(e.awayTeam.id)} alt="" width={15} height={15} style={{ objectFit: "contain", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: isFt && as_ > hs ? 700 : 400, color: isFt && as_ < hs ? "#3a5070" : "#ffffff" }}>{e.awayTeam.name}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: "center", minWidth: 28 }}>
                    {isFt || isLive ? (
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: isLive ? C.live : "#ffffff", lineHeight: 1.5 }}>{hs}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: isLive ? C.live : "#ffffff", lineHeight: 1.5 }}>{as_}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: C.muted }}>-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
