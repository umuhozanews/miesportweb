"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function EspnTeamNav({ base }: { base: string }) {
  const path = usePathname();
  const tabs = [
    { href: base,                label: "Overview", exact: true  },
    { href: `${base}/fixtures`,  label: "Fixtures",  exact: false },
    { href: `${base}/results`,   label: "Results",   exact: false },
    { href: `${base}/tables`,    label: "Tables",    exact: false },
  ];
  return (
    <div style={{ display: "flex", overflowX: "auto", padding: "0 1rem", scrollbarWidth: "none" }}>
      {tabs.map((t) => {
        const active = t.exact ? path === base : path.startsWith(t.href);
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
