"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SPORTS = [
  { href: "/livescore", label: "Football" },
  { href: "/livescore/basketball", label: "Basketball" },
  { href: "/livescore/volleyball", label: "Volleyball" },
];

export function SportsNav() {
  const path = usePathname();
  return (
    <div style={{ display: "flex", gap: 6, padding: "10px 0" }}>
      {SPORTS.map((s) => {
        const active = s.href === "/livescore"
          ? path === "/livescore" || path === "/livescore/"
          : path.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            style={{
              textDecoration: "none",
              padding: "5px 18px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              background: active ? "#fff" : "transparent",
              color: active ? "#111" : "#666",
              border: active ? "none" : "1px solid #2a2a2a",
            }}
          >
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}
