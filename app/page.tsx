export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  getCachedStvHomeMatches,
  type ScrapedMatch,
} from "@/lib/soccerTvHd";

function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function normToSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStvSlug(match: ScrapedMatch): string {
  const parts = match.name.split(/\s+vs\.?\s+/i);
  const home = normToSlug(parts[0]?.trim() ?? "home");
  const away = normToSlug(parts[1]?.trim() ?? "away");
  const base = `stv-${home}-vs-${away}`;
  return match.slug ? `${base}--${match.slug}` : base;
}

export default async function Home() {
  const stvResult = await getCachedStvHomeMatches();

  const now = new Date();
  const stvRaw: ScrapedMatch[] = stvResult.matches;
  const stvMatches = stvRaw
    .filter((m) => new Date(m.endIso) > now)
    .map((m) => ({ match: m, slug: getStvSlug(m) }))
    .filter(({ slug }) => /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/.test(slug));

  const stvCount = stvMatches.length;

  return (
    <>
      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div className="lp-hero-orb-tr" />
        <div className="lp-hero-orb-bl" />
        <div className="lp-hero-inner">
          {stvCount > 0 && (
            <div className="lp-hero-badge">
              <span className="lp-live-dot" style={{ width: 8, height: 8 }} />
              <span className="lp-hero-badge-text">{stvCount} match{stvCount > 1 ? "es" : ""} live right now</span>
            </div>
          )}
          <h1 className="lp-hero-heading lp-font-display">
            Every match.<br />
            <span style={{ color: "#22C55E" }}>Live</span>{" "}
            &amp;{" "}
            <span style={{ color: "#818CF8" }}>free.</span>
          </h1>
          <p className="lp-hero-sub">
            Real-time scores, free HD streams and full World Cup coverage — all in one fast, clean place.
          </p>
          <div className="lp-hero-ctas">
            <Link href="/" className="lp-cta-primary">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Watch Live
            </Link>
            <Link href="/livescore" className="lp-cta-secondary">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={12} cy={12} r={2} /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49" /></svg>
              Open Livescore
            </Link>
          </div>
        </div>
      </section>

      {/* ── QUICK NAV ── */}
      <div className="lp-quicknav">
        <div className="lp-quicknav-grid">
          <DestCard href="/livescore" accent="green"
            icon={<svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><circle cx={12} cy={12} r={2} /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" /></svg>}
            label="LIVESCORE" title="Real-time scores"
            desc="Every goal, card and substitution from every major league — updated live." />
          <DestCard href="/" accent="indigo"
            icon={<svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><rect width={20} height={15} x={2} y={7} rx={2} /><polyline points="17 2 12 7 7 2" /></svg>}
            label="WATCH" title="Free live streams"
            desc="HD streams for top fixtures. Pick your match and tap play — no signup." />
          <DestCard href="/worldcup" accent="green"
            icon={<svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><line x1={12} x2={12} y1={17} y2={21} /><line x1={8} x2={16} y1={21} y2={21} /><path d="M7 4H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3" /><path d="M17 4h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3" /><path d="M7 4a5 5 0 0 0 10 0H7Z" /></svg>}
            label="WORLD CUP" title="Full tournament hub"
            desc="Fixtures, group standings, knockouts and live streams in one place." />
        </div>
      </div>

      {/* ── MATCHES ── */}
      <div className="lp-matches-section">
        <div className="lp-matches-heading">
          <div>
            <div className="lp-section-eyebrow">
              {stvCount > 0
                ? <><span className="lp-live-dot" style={{ width: 8, height: 8 }} /><span className="lp-section-eyebrow-text">LIVE NOW</span></>
                : <span className="lp-section-eyebrow-text" style={{ color: "var(--lp-blue)" }}>TODAY</span>
              }
            </div>
            <h2 className="lp-section-title lp-font-display">
              {stvCount > 0 ? "Streaming matches" : "Matches"}
            </h2>
          </div>
          <Link href="/livescore" style={{
            fontSize: 13, fontWeight: 700, color: "var(--lp-muted-fg)",
            textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
            whiteSpace: "nowrap",
          }}>
            All scores →
          </Link>
        </div>

        {stvCount > 0 ? (
          <section>
            <div className="mc-sticky-bar">
              <span className="dot-live-red" />
              <span className="mc-sticky-label">Streaming Now</span>
              <span className="mc-sticky-pill">{stvCount} match{stvCount > 1 ? "es" : ""}</span>
            </div>
            <div className="mc-list">
              {stvMatches.map(({ match, slug }) => (
                <STVMatchCard key={match.id} match={match} watchSlug={slug} />
              ))}
            </div>
          </section>
        ) : (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "4rem 1rem", gap: 18, textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(67,56,202,0.08)",
              border: "1px solid rgba(67,56,202,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="rgba(129,140,248,0.4)" strokeWidth={1.5}>
                <circle cx={12} cy={12} r={10} /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 700, margin: 0 }}>No live matches right now</p>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, margin: 0 }}>Check back when matches kick off — this page updates automatically.</p>
            <Link href="/livescore" className="lp-cta-primary" style={{ marginTop: 4 }}>
              View Today&apos;s Schedule →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function DestCard({ href, icon, label, title, desc, accent }: {
  href: string; icon: React.ReactNode; label: string;
  title: string; desc: string; accent: "green" | "blue" | "indigo";
}) {
  const accentColor = accent === "green" ? "#22C55E" : "#818CF8";
  return (
    <Link href={href} className={`lp-dest-card lp-dest-card-${accent === "indigo" ? "blue" : accent}`}>
      <div style={{ color: accentColor }}>{icon}</div>
      <div style={{ marginTop: 20, fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: accentColor }}>{label}</div>
      <h3 style={{ marginTop: 6, fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "0.01em", color: "#fff", textTransform: "uppercase" }}>{title}</h3>
      <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "var(--lp-muted-fg)" }}>{desc}</p>
      <div style={{ marginTop: 20, fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
        Open <span>→</span>
      </div>
    </Link>
  );
}

function STVMatchCard({ match, watchSlug }: { match: ScrapedMatch; watchSlug: string }) {
  const nameParts = match.name.split(/\s+vs\.?\s+/i);
  const home = nameParts[0]?.trim() ?? match.name;
  const away = nameParts[1]?.trim() ?? "";
  const isLive = new Date() >= new Date(match.startIso) && new Date() <= new Date(match.endIso);
  const startTime = new Date(match.startIso);
  const timeLabel = isLive
    ? "LIVE"
    : startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const homeInit = teamInitials(home);
  const awayInit = teamInitials(away);

  return (
    <div className={`mc-card${isLive ? " mc-card-live" : ""}`}>
      <div className="mc-top">
        <span className="mc-competition">Soccer TV HD</span>
        {isLive ? (
          <span className="mc-live-pill">
            <span className="dot-b" />LIVE
          </span>
        ) : (
          <span className="mc-status-pill">{timeLabel}</span>
        )}
      </div>
      <div className="mc-center">
        <div className="mc-team">
          <div className="mc-avatar mc-avatar-home">{homeInit}</div>
          <div className="mc-team-name">{home}</div>
        </div>
        <div className="mc-score">
          <div className="mc-score-vs">VS</div>
        </div>
        <div className="mc-team">
          <div className="mc-avatar mc-avatar-away">{awayInit}</div>
          <div className="mc-team-name">{away}</div>
        </div>
      </div>
      <Link href={`/watch/${watchSlug}`} className="mc-watch-btn">
        <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        Watch Now
      </Link>
    </div>
  );
}
