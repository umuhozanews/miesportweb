"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  { href: "/#matches",  label: "Watch",     Icon: TvSvg,    watch: true  },
  { href: "/worldcup",  label: "World Cup", Icon: TrophySvg, watch: false },
] as const;


export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  return (
    <div className="lp-header-wrap">
      <motion.div
        className="lp-header-inner"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Main bar */}
        <div style={{ height: 66, display: "flex", alignItems: "center", gap: 16, padding: "0 1.25rem" }}>

          {/* Logo — bigger, more visible */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <motion.div
              whileHover={{ scale: 1.06 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{
                position: "relative",
                width: 58, height: 58,
                borderRadius: 14,
                background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)",
                border: "1.5px solid rgba(129,140,248,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 28px rgba(67,56,202,0.65), 0 0 56px rgba(67,56,202,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            >
              <Image
                src="/mie-logo.png"
                alt="MIE Sport"
                width={44}
                height={44}
                style={{ borderRadius: 10, display: "block" }}
              />
            </motion.div>
            <div className="lp-hdr-logo-text" style={{ lineHeight: 1 }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: "0.06em",
                color: "#fff",
                textTransform: "uppercase",
                textShadow: "0 0 20px rgba(129,140,248,0.5)",
              }}>
                MIE SPORT
              </div>
              <div style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#22C55E",
                marginTop: 3,
                textShadow: "0 0 10px rgba(34,197,94,0.6)",
              }}>
                Live Sports
              </div>
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
                  borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 700,
                  transition: "all 0.18s",
                  background: active ? "rgba(67,56,202,0.75)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.55)",
                  boxShadow: active ? "0 0 24px -6px rgba(67,56,202,0.7)" : "none",
                  cursor: "pointer",
                }}>
                  <Icon />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>

            {/* Live badge */}
            <div className="lp-hdr-live-badge" style={{
              borderRadius: 40,
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              padding: "5px 12px", gap: 7,
            }}>
              <span className="lp-live-dot" style={{ width: 7, height: 7, background: "#22C55E" }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "#22C55E", textTransform: "uppercase" }}>Live</span>
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setOpen(v => !v)}
              className="lp-hdr-menu-btn"
              style={{
                background: "rgba(67,56,202,0.2)", border: "1px solid rgba(67,56,202,0.3)", cursor: "pointer",
                width: 36, height: 36, borderRadius: 10,
                alignItems: "center", justifyContent: "center", color: "#fff",
                transition: "background 0.15s",
              }}
              aria-label="Toggle menu"
            >
              {open ? <XSvg /> : <MenuSvg />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              style={{ overflow: "hidden", borderTop: "1px solid rgba(67,56,202,0.2)" }}
            >
              <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                {NAV.map(({ href, label, Icon, watch }) => {
                  const active = watch
                    ? (path === "/" || path.startsWith("/watch"))
                    : (path === href || path.startsWith(href + "/"));
                  return (
                    <Link key={href} href={href} onClick={() => setOpen(false)} style={{
                      textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
                      borderRadius: 10, padding: "10px 12px", fontSize: 14, fontWeight: 700,
                      background: active ? "rgba(67,56,202,0.6)" : "transparent",
                      color: active ? "#fff" : "rgba(255,255,255,0.75)",
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}>
                      <Icon />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
