"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BballLeagueNav({ base }: { base: string }) {
  const path = usePathname();
  const tabs = [
    { href: base,                 label: "Overview" },
    { href: `${base}/fixtures`,   label: "Fixtures" },
    { href: `${base}/results`,    label: "Results" },
    { href: `${base}/standings`,  label: "Standings" },
  ];
  return (
    <div style={{ display: "flex", overflowX: "auto", padding: "0 1rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      {tabs.map((t) => {
        const active = t.href === base ? path === base : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} style={{
            textDecoration: "none", padding: "12px 16px", fontSize: 14, fontWeight: 600,
            whiteSpace: "nowrap", color: active ? "#fff" : "rgba(255,255,255,0.4)",
            borderBottom: active ? "2px solid #60a5fa" : "2px solid transparent",
          }}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
