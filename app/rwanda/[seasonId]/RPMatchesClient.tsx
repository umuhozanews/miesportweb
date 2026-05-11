"use client";
import { useState, useEffect, useCallback } from "react";
import type { RPEvent } from "@/lib/rwandapl";

const C = { border: "#1e1e1e", text: "#e8e8e8", muted: "#555", live: "#22c55e", blue: "#60a5fa" };

function teamImg(id: number) { return `https://api.sofascore.com/api/v1/team/${id}/image`; }
function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" });
}
function fmtTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function FeaturedCard({ event: e }: { event: RPEvent }) {
  const isLive = e.status.type === "inprogress";
  const isFt = e.status.type === "finished";
  const hs = e.homeScore.current ?? 0;
  const as_ = e.awayScore.current ?? 0;
  const homeWon = isFt && hs > as_;
  const awayWon = isFt && as_ > hs;

  return (
    <div style={{ padding: "14px 16px", background: "#111", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#3a3a3a", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
        {isLive ? <span style={{ color: C.live }}>● LIVE</span> : "Featured"}
      </div>
      {(isFt || isLive) && (
        <div style={{ fontSize: 10, color: "#3a3a3a", marginBottom: 10, fontWeight: 600 }}>
          {fmtDate(e.startTimestamp)} · {isFt ? "FT" : e.status.description}
        </div>
      )}
      {!isFt && !isLive && (
        <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 10 }}>
          {fmtDate(e.startTimestamp)} · {fmtTime(e.startTimestamp)}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {/* Home */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, opacity: isFt && !homeWon ? 0.45 : 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamImg(e.homeTeam.id)} alt="" width={34} height={34} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 12, fontWeight: homeWon ? 800 : 500, color: "#d8d8d8", lineHeight: 1.2 }}>{e.homeTeam.name}</span>
        </div>

        {/* Score */}
        <div style={{ textAlign: "center", padding: "0 8px", flexShrink: 0 }}>
          {isFt || isLive ? (
            <div style={{ fontSize: 24, fontWeight: 900, color: isLive ? C.live : "#f0f0f0", letterSpacing: -1 }}>{hs} – {as_}</div>
          ) : (
            <div style={{ fontSize: 16, fontWeight: 800, color: C.blue }}>vs</div>
          )}
          {isFt && <div style={{ fontSize: 10, color: "#444", fontWeight: 700, marginTop: 2 }}>FT</div>}
        </div>

        {/* Away */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, opacity: isFt && !awayWon ? 0.45 : 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamImg(e.awayTeam.id)} alt="" width={34} height={34} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 12, fontWeight: awayWon ? 800 : 500, color: "#d8d8d8", lineHeight: 1.2, textAlign: "right" }}>{e.awayTeam.name}</span>
        </div>
      </div>
    </div>
  );
}

export function RPMatchesClient({
  seasonId,
  initialRound,
  featured,
}: {
  seasonId: number;
  initialRound: number;
  featured: RPEvent | null;
}) {
  const [round, setRound] = useState(initialRound);
  const [events, setEvents] = useState<RPEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback((r: number) => {
    setLoading(true);
    fetch(`/api/rp/matches?seasonId=${seasonId}&round=${r}`)
      .then((res) => res.json())
      .then((d) => { setEvents(d.events ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [seasonId]);

  useEffect(() => { load(initialRound); }, [load, initialRound]);

  const prev = () => { if (round > 1) { const r = round - 1; setRound(r); load(r); } };
  const next = () => { const r = round + 1; setRound(r); load(r); };

  return (
    <div style={{ background: "#161616", borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", position: "sticky", top: 16 }}>
      {/* Featured match */}
      {featured && <FeaturedCard event={featured} />}

      {/* Panel header */}
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${C.border}`, background: "#111" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#e0e0e0", letterSpacing: 0.3, marginBottom: 10 }}>Matches</div>
        <div style={{ display: "flex", gap: 4 }}>
          <span style={{ padding: "4px 14px", borderRadius: 20, background: "#fff", color: "#111", fontSize: 11, fontWeight: 800 }}>By round</span>
        </div>
      </div>

      {/* Round navigation */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: "#121212" }}>
        <button onClick={prev} disabled={round <= 1} style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: round > 1 ? "#888" : "#2a2a2a", width: 28, height: 28, borderRadius: 6, cursor: round > 1 ? "pointer" : "default", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          ‹
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#d0d0d0" }}>Round {round}</span>
        <button onClick={next} style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#888", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          ›
        </button>
      </div>

      {/* Match list */}
      <div style={{ maxHeight: "calc(100vh - 420px)", overflowY: "auto" }}>
        {loading && (
          <div style={{ padding: "1.5rem" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 44, background: "#1e1e1e", borderRadius: 6, marginBottom: 6 }} className="skeleton" />
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: C.muted, fontSize: 13 }}>No matches in this round</div>
        )}

        {!loading && events.map((e) => {
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
              {/* Status */}
              <div style={{ textAlign: "center" }}>
                {isLive ? (
                  <span style={{ fontSize: 10, fontWeight: 900, color: C.live }}>{e.status.description}</span>
                ) : isFt ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#3a3a3a" }}>FT</span>
                ) : (
                  <div>
                    <div style={{ fontSize: 10, color: "#3a3a3a" }}>{fmtDate(e.startTimestamp)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.blue }}>{fmtTime(e.startTimestamp)}</div>
                  </div>
                )}
              </div>

              {/* Teams */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={teamImg(e.homeTeam.id)} alt="" width={14} height={14} style={{ objectFit: "contain", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: isFt && hs > as_ ? 700 : 400, color: isFt && hs < as_ ? "#3a3a3a" : C.text }}>{e.homeTeam.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={teamImg(e.awayTeam.id)} alt="" width={14} height={14} style={{ objectFit: "contain", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: isFt && as_ > hs ? 700 : 400, color: isFt && as_ < hs ? "#3a3a3a" : C.text }}>{e.awayTeam.name}</span>
                </div>
              </div>

              {/* Score */}
              <div style={{ textAlign: "center", minWidth: 28 }}>
                {isFt || isLive ? (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isLive ? C.live : C.text, lineHeight: 1.5 }}>{hs}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isLive ? C.live : C.text, lineHeight: 1.5 }}>{as_}</div>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: "#2a2a2a" }}>-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
