"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Overview", path: "" },
  { label: "Standings", path: "/standings" },
  { label: "Stats", path: "/stats" },
];

export function RPTabNav({ seasonId }: { seasonId: string }) {
  const pathname = usePathname();
  const base = `/rwanda/${seasonId}`;

  return (
    <div style={{ display: "flex", gap: 0, padding: "0 4px" }}>
      {TABS.map(({ label, path }) => {
        const href = `${base}${path}`;
        const isActive = path === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link key={label} href={href} style={{ textDecoration: "none" }}>
            <div style={{
              padding: "12px 18px",
              fontSize: 13,
              fontWeight: 700,
              color: isActive ? "#f0f0f0" : "#555",
              borderBottom: isActive ? "2px solid #f5a623" : "2px solid transparent",
              transition: "all 0.15s",
              cursor: "pointer",
            }}>
              {label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
