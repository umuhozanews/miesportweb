"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const RadioSvg = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={12} cy={12} r={2} />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
);
const TvSvg = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect width={20} height={15} x={2} y={7} rx={2} />
    <polyline points="17 2 12 7 7 2" />
  </svg>
);
const TrophySvg = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1={12} x2={12} y1={17} y2={21} /><line x1={8} x2={16} y1={21} y2={21} />
    <path d="M7 4H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3" />
    <path d="M17 4h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3" />
    <path d="M7 4a5 5 0 0 0 10 0H7Z" />
  </svg>
);
const MenuSvg = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <line x1={4} x2={20} y1={12} y2={12} /><line x1={4} x2={20} y1={6} y2={6} /><line x1={4} x2={20} y1={18} y2={18} />
  </svg>
);
const XSvg = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <line x1={18} x2={6} y1={6} y2={18} /><line x1={6} x2={18} y1={6} y2={18} />
  </svg>
);

const NAV = [
  { href: "/livescore", label: "Livescore", Icon: RadioSvg, watch: false },
  { href: "/",          label: "Watch",     Icon: TvSvg,    watch: true  },
  { href: "/worldcup",  label: "World Cup", Icon: TrophySvg, watch: false },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: "1px solid var(--lp-border)",
      background: "oklch(0.13 0.02 270 / 0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", height: 64, display: "flex", alignItems: "center", gap: 20, padding: "0 1.25rem" }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <Image
            src="/mie-logo.png"
            alt="MIE Sport"
            width={36}
            height={36}
            style={{ borderRadius: 8, display: "block", filter: "drop-shadow(0 0 10px oklch(0.88 0.24 155 / 40%))" }}
          />
          <div className="lp-hdr-logo-text" style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", color: "#fff" }}>MIE Sport</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--lp-primary)", marginTop: 2 }}>Live Football</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="lp-hdr-desktop-nav" style={{ marginLeft: 12 }}>
          {NAV.map(({ href, label, Icon, watch }) => {
            const active = watch
              ? (path === "/" || path.startsWith("/watch"))
              : (path === href || path.startsWith(href + "/"));
            return (
              <Link key={href} href={href} style={{
                textDecoration: "none",
                display: "flex", alignItems: "center", gap: 7,
                borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600,
                transition: "all 0.15s",
                background: active ? "var(--lp-blue)" : "transparent",
                color: active ? "#fff" : "var(--lp-muted-fg)",
                boxShadow: active ? "0 0 30px -8px oklch(0.62 0.21 260 / 50%)" : "none",
              }}>
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div className="lp-hdr-live-badge" style={{
            borderRadius: 40, background: "var(--lp-surface)",
            padding: "6px 14px", gap: 8,
          }}>
            <span className="lp-live-dot" style={{ width: 8, height: 8 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#fff" }}>LIVE NOW</span>
          </div>

          <button
            onClick={() => setOpen(v => !v)}
            className="lp-hdr-menu-btn"
            style={{
              background: "var(--lp-surface)", border: "none", cursor: "pointer",
              width: 36, height: 36, borderRadius: 10,
              alignItems: "center", justifyContent: "center", color: "#fff",
            }}
            aria-label="Toggle menu"
          >
            {open ? <XSvg /> : <MenuSvg />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      <nav
        className={`lp-hdr-mobile-nav${open ? " lp-open" : ""}`}
        style={{
          borderTop: "1px solid var(--lp-border)",
          background: "oklch(0.13 0.02 270)",
          padding: "12px 16px",
          flexDirection: "column", gap: 4,
        }}
      >
        {NAV.map(({ href, label, Icon, watch }) => {
          const active = watch
            ? (path === "/" || path.startsWith("/watch"))
            : (path === href || path.startsWith(href + "/"));
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{
              textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
              borderRadius: 10, padding: "10px 12px", fontSize: 14, fontWeight: 600,
              background: active ? "var(--lp-blue)" : "transparent",
              color: active ? "#fff" : "rgba(255,255,255,0.8)",
            }}>
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
