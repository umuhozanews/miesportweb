"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function WCTabNav({ year }: { year: string }) {
  const path = usePathname();
  const base = `/worldcup/${year}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/standings`, label: "Standings" },
    { href: `${base}/knockout`, label: "Knockout" },
    { href: `${base}/stats`, label: "Stats" },
  ];
  return (
    <div style={{ display: "flex", padding: "0 1rem" }}>
      {tabs.map((t) => {
        const active = t.href === base ? path === base : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className="sf-tab" style={{
            textDecoration: "none",
            padding: "12px 18px",
            fontSize: 14,
            fontWeight: 700,
            color: active ? "#f0f0f0" : "#555",
            borderBottom: active ? "2px solid #f5a623" : "2px solid transparent",
          }}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
