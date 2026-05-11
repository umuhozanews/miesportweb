import Link from "next/link";

const C = { border: "rgba(255,255,255,0.08)", text: "#ffffff", muted: "#5a7090", label: "#3a5070", panel: "#0f1a2e" };

const POPULAR_TEAMS = [
  { id: 35, name: "Manchester United", country: "England" },
  { id: 44, name: "Liverpool", country: "England" },
  { id: 42, name: "Arsenal", country: "England" },
  { id: 17, name: "Manchester City", country: "England" },
  { id: 2829, name: "Real Madrid", country: "Spain" },
];

const POPULAR_COMPETITIONS = [
  { id: 17, name: "Premier League", country: "England" },
  { id: 8, name: "La Liga", country: "Spain" },
  { id: 23, name: "Serie A", country: "Italy" },
  { id: 35, name: "Bundesliga", country: "Germany" },
  { id: 7, name: "Champions League", country: "Europe" },
];

function teamImg(id: number) { return `https://api.sofascore.com/api/v1/team/${id}/image`; }
function tournamentImg(id: number) { return `https://api.sofascore.com/api/v1/unique-tournament/${id}/image`; }

export function Sidebar() {
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
            placeholder="Search"
            style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, flex: 1 }}
          />
        </div>
      </form>

      {/* Teams */}
      <div style={{ background: C.panel, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px 8px" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.label, letterSpacing: 1.5, textTransform: "uppercase" }}>Teams</span>
          <Link href="/livescore/search?q=" style={{ color: C.muted, fontSize: 13, textDecoration: "none" }}>›</Link>
        </div>
        {POPULAR_TEAMS.map((t) => (
          <Link
            key={t.id}
            href={`/livescore/team/${t.id}`}
            className="sf-sidebar-item"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "8px 13px", borderTop: `1px solid ${C.border}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamImg(t.id)} alt="" width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{t.country}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Competitions */}
      <div style={{ background: C.panel, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px 8px" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.label, letterSpacing: 1.5, textTransform: "uppercase" }}>Competitions</span>
          <span style={{ color: C.muted, fontSize: 13 }}>›</span>
        </div>

        {/* Rwanda PL — dedicated section link */}
        <Link
          href="/rwanda"
          className="sf-sidebar-item"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "8px 13px", borderTop: `1px solid ${C.border}`, background: "rgba(105,147,205,0.06)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tournamentImg(10608)} alt="" width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6993cd", lineHeight: 1.2 }}>Rwanda Premier League</div>
            <div style={{ fontSize: 11, color: C.muted }}>Rwanda 🇷🇼</div>
          </div>
        </Link>

        {POPULAR_COMPETITIONS.map((c) => (
          <Link
            key={c.id}
            href={`/livescore/tournament/${c.id}`}
            className="sf-sidebar-item"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "8px 13px", borderTop: `1px solid ${C.border}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tournamentImg(c.id)} alt="" width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{c.country}</div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
