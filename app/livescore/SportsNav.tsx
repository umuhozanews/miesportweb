"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SportsNav() {
  const path = usePathname();
  const active = path === "/livescore" || path === "/livescore/";
  return (
    <div style={{ display: "flex", gap: 8, padding: "10px 0" }}>
      <Link
        href="/livescore"
        style={{
          textDecoration: "none",
          padding: "6px 18px",
          borderRadius: 20,
          fontSize: 14,
          fontWeight: 600,
          background: active ? "#ffffff" : "transparent",
          color: active ? "#111" : "rgba(255,255,255,0.45)",
          border: active ? "none" : "1px solid rgba(255,255,255,0.12)",
          transition: "all 0.12s",
        }}
      >
        Football
      </Link>
    </div>
  );
}
