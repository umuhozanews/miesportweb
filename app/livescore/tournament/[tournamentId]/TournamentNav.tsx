"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TournamentNav({ tournamentId, seasonId }: { tournamentId: string; seasonId: string }) {
  const path = usePathname();
  const base = `/livescore/tournament/${tournamentId}/${seasonId}`;
  const tabs = [
    { href: base, label: "Fixtures" },
    { href: `${base}/results`, label: "Results" },
    { href: `${base}/standings`, label: "Standings" },
    { href: `${base}/stats`, label: "Stats" },
  ];
  return (
    <div style={{ display: "flex", padding: "0 1rem" }}>
      {tabs.map((t) => {
        const active = t.href === base ? path === base : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className="sf-tab"
            style={{
              textDecoration: "none",
              padding: "11px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: active ? "#f0f0f0" : "#555",
              borderBottom: active ? "2px solid #60a5fa" : "2px solid transparent",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
