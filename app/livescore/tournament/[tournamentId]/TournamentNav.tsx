"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TournamentNav({ tournamentId, seasonId }: { tournamentId: string; seasonId: string }) {
  const path = usePathname();
  const base = `/livescore/tournament/${tournamentId}/${seasonId}`;

  const tabs = [
    { href: base,                         label: "Overview",   match: (p: string) => p === base },
    { href: `${base}/fixtures`,           label: "Fixtures",   match: (p: string) => p.startsWith(`${base}/fixtures`) },
    { href: `${base}/results`,            label: "Results",    match: (p: string) => p.startsWith(`${base}/results`) },
    { href: `${base}/standings`,          label: "Standings",  match: (p: string) => p.startsWith(`${base}/standings`) },
    { href: `${base}/stats`,              label: "Stats",      match: (p: string) => p === `${base}/stats` },
    { href: `${base}/stats/teams`,        label: "Team Stats", match: (p: string) => p.startsWith(`${base}/stats/teams`) },
  ];

  return (
    <div style={{ display: "flex", overflowX: "auto", padding: "0 1rem", scrollbarWidth: "none" }}>
      {tabs.map((t) => {
        const active = t.match(path);
        return (
          <Link key={t.href} href={t.href} className="sf-tab" style={{
            textDecoration: "none",
            padding: "11px 14px",
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
            color: active ? "#f0f0f0" : "#555",
            borderBottom: active ? "2px solid #60a5fa" : "2px solid transparent",
          }}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
