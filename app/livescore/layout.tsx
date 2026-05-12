import Link from "next/link";
import { SportsNav } from "./SportsNav";
import { Sidebar } from "./Sidebar";
import { LiveRefresher } from "./LiveRefresher";
import { LanguageSwitcher } from "@/app/LanguageSwitcher";

export default function LivescoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--t-primary)", fontFamily: "system-ui, sans-serif" }}>
      <LiveRefresher />

      {/* ── Header ── */}
      <header style={{ background: "var(--brand-navy)", borderBottom: "1px solid #0f2040", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(0,0,0,0.5)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem", height: 56, display: "flex", alignItems: "center", gap: 16 }}>

          {/* Brand */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mie-logo.png" alt="MIE" width={40} height={40} style={{ borderRadius: 8, objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(59,130,246,0.4))" }} />
            <div>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: 0.3, display: "block", lineHeight: 1 }}>MIE Sport</span>
              <span style={{ color: "var(--brand-glow)", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>LIVE FOOTBALL</span>
            </div>
          </Link>

          <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} className="ls-nav-links" />

          {/* Desktop nav */}
          <nav className="ls-nav-links">
            <Link href="/livescore" style={{
              color: "#fff", fontWeight: 800, fontSize: 13, textDecoration: "none",
              padding: "6px 14px", borderRadius: 7,
              background: "var(--brand-blue)", border: "1px solid rgba(255,255,255,0.18)",
            }}>Scores</Link>
            <Link href="/worldcup" style={{
              color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
              padding: "6px 14px", borderRadius: 7,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            }}>🏆 World Cup</Link>
            <Link href="/rwanda" style={{
              color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
              padding: "6px 14px", borderRadius: 7,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            }}>🇷🇼 Rwanda PL</Link>
          </nav>

          {/* Right */}
          <div className="ls-header-right">
            <span className="ls-lang-switch"><LanguageSwitcher /></span>
            <Link href="/" style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#c62828", color: "#fff", textDecoration: "none",
              padding: "8px 14px", borderRadius: 7, fontWeight: 800, fontSize: 12,
              letterSpacing: 0.4, flexShrink: 0,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
              WATCH
            </Link>
          </div>
        </div>
      </header>

      {/* Sport tabs */}
      <div style={{ background: "#0a1628", borderBottom: "1px solid #0f2040", overflowX: "auto" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem" }}>
          <SportsNav />
        </div>
      </div>

      {/* Body */}
      <div className="ls-body">
        <aside className="ls-sidebar">
          <Sidebar />
        </aside>
        <main className="ls-main">
          {children}
        </main>
      </div>

      <footer style={{ borderTop: "1px solid #0f2040", padding: "1rem", textAlign: "center", background: "var(--brand-navy)" }}>
        <span style={{ fontSize: 12, color: "#354060" }}>
          © 2026 MIE Empire · Special thanks to{" "}
          <a href="https://www.atomiq.rw/" target="_blank" rel="noopener noreferrer" style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>ATOMIQ</a>
        </span>
      </footer>
    </div>
  );
}
