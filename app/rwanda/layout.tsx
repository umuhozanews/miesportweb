import Link from "next/link";
import { LanguageSwitcher } from "@/app/LanguageSwitcher";
import { LiveRefresher } from "@/app/livescore/LiveRefresher";

export const metadata = { title: "Rwanda Premier League — MIE Sport", description: "Rwanda National League standings, results and stats" };

export default function RwandaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--t-primary)", fontFamily: "system-ui, sans-serif" }}>
      <LiveRefresher />

      {/* Top bar — brand navy */}
      <div style={{ background: "var(--brand-navy)", borderBottom: "1px solid #0f2040", padding: "0 1.5rem", height: 50, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>

        {/* Logo + brand */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mie-logo.png" alt="MIE" width={36} height={36} style={{ borderRadius: 8, objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(59,130,246,0.5))" }} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: 0.3 }}>MIE Sport</span>
        </Link>

        <span className="topbar-breadcrumb" style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>›</span>
        <Link className="topbar-breadcrumb" href="/livescore" style={{ textDecoration: "none", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Football</Link>
        <span className="topbar-breadcrumb" style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>›</span>
        <span className="topbar-breadcrumb" style={{ color: "#ffffff", fontSize: 13, fontWeight: 700 }}>🇷🇼 Rwanda PL</span>

        <div className="topbar-right" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <LanguageSwitcher />
          <Link href="/livescore" style={{ textDecoration: "none", color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600 }}>← Scores</Link>
          <Link href="/" style={{ textDecoration: "none", color: "#c62828", fontSize: 12, fontWeight: 700 }}>● Watch</Link>
        </div>
      </div>

      {children}

      <footer style={{ borderTop: "1px solid #0f2040", padding: "1.1rem", textAlign: "center", marginTop: "0.5rem", background: "var(--brand-navy)" }}>
        <span style={{ fontSize: 12, color: "#354060" }}>
          © 2026 MIE Empire · Special thanks to{" "}
          <a href="https://www.atomiq.rw/" target="_blank" rel="noopener noreferrer" style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>ATOMIQ</a>
        </span>
      </footer>
    </div>
  );
}
