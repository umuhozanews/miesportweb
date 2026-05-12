import Link from "next/link";
import { getLsStages, lsCompImg, lsTeamImg } from "@/lib/livescoreCom";
import { TeamImg, CompImg } from "./TeamImg";

const C = { border: "rgba(255,255,255,0.08)", text: "#ffffff", muted: "#5a7090", label: "#3a5070", panel: "#0f1a2e" };

export async function Sidebar() {
  const today = new Date().toISOString().split("T")[0];
  const stages = await getLsStages(today, "soccer");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

      {/* Search */}
      <form action="/livescore/search" method="get">
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 13px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            name="q"
            placeholder="Search teams, leagues…"
            style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, flex: 1 }}
          />
        </div>
      </form>

      {/* Today's Competitions */}
      {stages.length > 0 && (
        <div style={{ background: C.panel, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "10px 13px 8px" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.label, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Today&apos;s Competitions
            </span>
          </div>
          {stages.slice(0, 10).map((stage) => (
            <Link
              key={stage.Sid}
              href={`/livescore/tournament/${stage.CompId}/${stage.Sid}`}
              className="sf-sidebar-item"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "8px 13px", borderTop: `1px solid ${C.border}` }}
            >
              <CompImg src={lsCompImg(stage.badgeUrl)} size={22} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{stage.Snm}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{stage.Cnm}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted, fontWeight: 700 }}>{stage.Events?.length ?? 0}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Quick team links from today's top matches */}
      {stages.length > 0 && (() => {
        const topTeams = stages.slice(0, 3).flatMap((s) =>
          (s.Events ?? []).slice(0, 1).flatMap((e) => [e.T1?.[0], e.T2?.[0]].filter(Boolean))
        ).slice(0, 6);

        if (topTeams.length === 0) return null;

        return (
          <div style={{ background: C.panel, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "10px 13px 8px" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.label, letterSpacing: 1.5, textTransform: "uppercase" }}>
                Teams Playing Today
              </span>
            </div>
            {topTeams.map((t) => t && (
              <Link
                key={t.ID}
                href={`/livescore/team/${t.ID}`}
                className="sf-sidebar-item"
                style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "8px 13px", borderTop: `1px solid ${C.border}` }}
              >
                <TeamImg src={lsTeamImg(t.Img, t.ID)} name={t.Nm} size={22} />
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.Nm}</div>
              </Link>
            ))}
          </div>
        );
      })()}

      {/* Rwanda PL quick link */}
      <Link
        href="/rwanda"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 13px",
          background: "rgba(105,147,205,0.08)",
          border: `1px solid ${C.border}`,
          borderRadius: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>🇷🇼</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6993cd" }}>Rwanda Premier League</div>
          <div style={{ fontSize: 11, color: C.muted }}>Live standings &amp; results</div>
        </div>
        <span style={{ marginLeft: "auto", color: C.muted, fontSize: 16 }}>›</span>
      </Link>

    </div>
  );
}
