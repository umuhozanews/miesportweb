"use client";
import Link from "next/link";
import { TeamImg, CompImg } from "./TeamImg";

const BG = "#1c1c1c";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#666";
const TEXT = "#e0e0e0";

const TEAMS = [
  { name: "Manchester United", country: "England", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/360.png", league: "eng.1", id: "360" },
  { name: "Liverpool",         country: "England", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/364.png", league: "eng.1", id: "364" },
  { name: "Arsenal",           country: "England", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/359.png", league: "eng.1", id: "359" },
  { name: "Manchester City",   country: "England", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/382.png", league: "eng.1", id: "382" },
  { name: "Real Madrid",       country: "Spain",   logo: "https://a.espncdn.com/i/teamlogos/soccer/500/86.png",  league: "esp.1", id: "86"  },
  { name: "Barcelona",         country: "Spain",   logo: "https://a.espncdn.com/i/teamlogos/soccer/500/83.png",  league: "esp.1", id: "83"  },
  { name: "Bayern Munich",     country: "Germany", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/132.png", league: "ger.1", id: "132" },
  { name: "PSG",               country: "France",  logo: "https://a.espncdn.com/i/teamlogos/soccer/500/160.png", league: "fra.1", id: "160" },
];

const COMPETITIONS = [
  { name: "Premier League",    country: "England",       compId: "17",  sid: "76986", logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png" },
  { name: "La Liga",           country: "Spain",         compId: "119", sid: "76236", logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/15.png" },
  { name: "Serie A",           country: "Italy",         compId: "23",  sid: "76465", logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/12.png" },
  { name: "Bundesliga",        country: "Germany",       compId: "35",  sid: "76319", logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/10.png" },
  { name: "Ligue 1",           country: "France",        compId: "34",  sid: "75516", logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/9.png"  },
  { name: "Champions League",  country: "Europe",        compId: "7",   sid: "76458", logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/2.png"  },
  { name: "Europa League",     country: "Europe",        compId: "8",   sid: "76459", logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png" },
  { name: "FIFA World Cup",    country: "International", compId: "16",  sid: "58210", logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/4.png"  },
];

const REGIONS = ["England", "Spain", "Germany", "Italy", "France", "Netherlands", "Portugal", "Africa", "South America"];

function SectionHeader({ label, href }: { label: string; href?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 8px" }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase" }}>
        {label}
      </span>
      {href && (
        <Link href={href} style={{ textDecoration: "none", color: MUTED, fontSize: 14, fontWeight: 500, lineHeight: 1 }}>›</Link>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>

      {/* Search */}
      <form action="/livescore/search" method="get">
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 13px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input name="q" placeholder="Search team or league" style={{ background: "transparent", border: "none", outline: "none", color: TEXT, fontSize: 14, flex: 1 }} />
        </div>
      </form>

      {/* TEAMS */}
      <div style={{ background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        <SectionHeader label="Teams" href="/livescore/search" />
        {TEAMS.map((t) => (
          <Link key={t.name} href={`/livescore/team/espn/${t.league}/${t.id}`} className="sf-sidebar-item"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: `1px solid ${BORDER}` }}>
            <TeamImg src={t.logo} name={t.name} size={26} radius="50%" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, lineHeight: 1.3 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{t.country}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* COMPETITIONS */}
      <div style={{ background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        <SectionHeader label="Competitions" href="/livescore" />
        {COMPETITIONS.map((c) => (
          <Link key={c.sid} href={`/livescore/tournament/${c.compId}/${c.sid}`} className="sf-sidebar-item"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: `1px solid ${BORDER}` }}>
            <CompImg src={c.logo} size={24} radius={4} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, lineHeight: 1.3 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{c.country}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* REGION */}
      <div style={{ background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        <SectionHeader label="Region" />
        {REGIONS.map((r) => (
          <Link key={r} href={`/livescore/search?q=${encodeURIComponent(r)}`} className="sf-sidebar-item"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderTop: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>{r}</span>
            <span style={{ color: MUTED, fontSize: 14 }}>›</span>
          </Link>
        ))}
      </div>

    </div>
  );
}
