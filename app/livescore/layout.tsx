import Link from "next/link";
import { SportsNav } from "./SportsNav";
import { Sidebar } from "./Sidebar";
import { LiveRefresher } from "./LiveRefresher";
import { LanguageSwitcher } from "@/app/LanguageSwitcher";

export default function LivescoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--t-primary)", fontFamily: "system-ui, sans-serif" }}>
      <LiveRefresher />

      {/* Header — brand navy */}
      <header style={{ background: "var(--brand-navy)", borderBottom: "1px solid #0f2040", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(0,0,0,0.5)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem", height: 62, display: "flex", alignItems: "center", gap: 24 }}>

          {/* Brand */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mie-logo.png" alt="MIE" width={52} height={52} style={{ borderRadius: 10, objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(59,130,246,0.5))" }} />
            <div>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: 0.3, display: "block", lineHeight: 1 }}>MIE Sport</span>
              <span style={{ color: "var(--brand-glow)", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>LIVE FOOTBALL</span>
            </div>
          </Link>

          <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />

          {/* Nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Link href="/livescore" style={{
              color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none",
              padding: "7px 18px", borderRadius: 8,
              background: "var(--brand-blue)", border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 2px 12px rgba(30,77,183,0.5)",
            }}>
              Scores
            </Link>
            <Link href="/worldcup" style={{
              color: "#ffffff", fontWeight: 700, fontSize: 14, textDecoration: "none",
              padding: "7px 18px", borderRadius: 8,
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
            }}>
              🏆 World Cup
            </Link>
            <Link href="/rwanda" style={{
              color: "#ffffff", fontWeight: 700, fontSize: 14, textDecoration: "none",
              padding: "7px 18px", borderRadius: 8,
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
            }}>
              🇷🇼 Rwanda PL
            </Link>
          </nav>

          {/* Right side */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Watch Live */}
            <Link href="/" style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "#c62828", color: "#fff", textDecoration: "none",
              padding: "9px 18px", borderRadius: 8, fontWeight: 800, fontSize: 13,
              letterSpacing: 0.5, flexShrink: 0, boxShadow: "0 2px 8px rgba(198,40,40,0.4)",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
              WATCH LIVE
            </Link>
          </div>
        </div>
      </header>

      {/* Sport tabs */}
      <div style={{ background: "#0a1628", borderBottom: "1px solid #0f2040" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
          <SportsNav />
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "1.25rem 1.5rem", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
        <aside style={{ width: 252, flexShrink: 0 }}>
          <Sidebar />
        </aside>
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      <footer style={{ borderTop: "1px solid #0f2040", padding: "1.1rem", textAlign: "center", marginTop: "0.5rem", background: "var(--brand-navy)" }}>
        <span style={{ fontSize: 12, color: "#354060" }}>
          © 2026 MIE Empire · Special thanks to{" "}
          <a href="https://www.atomiq.rw/" target="_blank" rel="noopener noreferrer" style={{ color: "#f5a623", fontWeight: 700, textDecoration: "none" }}>ATOMIQ</a>
        </span>
      </footer>
    </div>
  );
}
