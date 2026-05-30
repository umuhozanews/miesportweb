import Link from "next/link";
import { StreamPlayer } from "./StreamPlayer";
import { getCachedGacondoStream } from "@/GACONDO";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{3,120}[a-z0-9]$/;

function toTitle(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const ABBREVS_PAGE: [RegExp, string][] = [
  [/\bmanchester-united\b/g, "man-utd"],
  [/\bmanchester-city\b/g, "man-city"],
  [/\bparis-saint-germain\b/g, "psg"],
  [/\bpsg\b/g, "paris-saint-germain"],
  [/\batletico-madrid\b/g, "atletico"],
  [/\binternazionale\b/g, "inter"],
  [/\btottenham-hotspur\b/g, "tottenham"],
  [/\bnewcastle-united\b/g, "newcastle"],
  [/\bwest-ham-united\b/g, "west-ham"],
  [/\bwolverhampton\b/g, "wolves"],
  [/\bborussia-dortmund\b/g, "dortmund"],
  [/\brb-leipzig\b/g, "leipzig"],
  [/\bbayer-leverkusen\b/g, "leverkusen"],
  [/\bolympique-marseille\b/g, "marseille"],
  [/\bolympique-lyonnais\b/g, "lyon"],
];

function buildPageGacondoSlugs(teamsPart: string): string[] {
  const variants = new Set([teamsPart]);
  for (const [from, to] of ABBREVS_PAGE) {
    const v = teamsPart.replace(from, to);
    if (v !== teamsPart) variants.add(v);
  }
  return [...variants];
}

// Pre-resolve stream URLs server-side so the player has something to show instantly.
// The relay page URL is derived directly from the slug — no HTTP fetch needed.
// GACONDO runs in parallel to find additional embed alternatives.
async function resolveInitialServers(slug: string): Promise<string[]> {
  if (!slug.startsWith("stv-")) return [];
  const inner = slug.slice(4);
  const sepIdx = inner.indexOf("--");
  if (sepIdx === -1) return [];
  const pageSlug = inner.slice(sepIdx + 2);
  const teamsPart = inner.slice(0, sepIdx);

  const seen = new Set<string>();
  const servers: string[] = [];
  const add = (url: string) => { if (url && !seen.has(url)) { seen.add(url); servers.push(url); } };

  // The relay page URL is built from the slug — no scraping, no blocking.
  // This is the same URL soccertvhd puts in each Elfsight match button.
  if (pageSlug) add(`https://www.soccertvhd.com/${pageSlug}/`);

  // GACONDO: try to find embed URLs from 10 other aggregator sites.
  // Short timeout — this is a page render, not a background job.
  const gacondoSlugs = teamsPart.includes("-vs-") ? buildPageGacondoSlugs(teamsPart) : [];
  if (gacondoSlugs.length > 0) {
    try {
      const result = await Promise.race([
        getCachedGacondoStream(gacondoSlugs),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2_000)),
      ]);
      for (const s of result.streams) {
        if (s.type === "embed") add(s.url);
      }
      const ref = result.requestHeaders.referer;
      for (const s of result.streams) {
        if (s.type === "hls") add(getProxiedHlsUrl(s.url, "http://localhost", ref));
      }
    } catch { /* timeout or GACONDO miss — relay URL above is still in the list */ }
  }

  return servers;
}

export default async function WatchPage({ params }: PageProps) {
  const { slug } = await params;

  if (!SAFE_SLUG_RE.test(slug)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", color: "#fff" }}>
        <p>Invalid match link.</p>
      </div>
    );
  }

  let homeTeam = "";
  let awayTeam = "";
  let matchTitle = "Live Match";

  if (slug.startsWith("stv-")) {
    const inner = slug.slice(4);
    const sepIdx = inner.indexOf("--");
    const teamsPart = sepIdx !== -1 ? inner.slice(0, sepIdx) : inner;
    const vsIdx = teamsPart.indexOf("-vs-");
    homeTeam = vsIdx !== -1 ? toTitle(teamsPart.slice(0, vsIdx)) : "";
    awayTeam = vsIdx !== -1 ? toTitle(teamsPart.slice(vsIdx + 4)) : "";
    if (homeTeam && awayTeam) matchTitle = `${homeTeam} vs ${awayTeam}`;
  }

  const initialServers = await resolveInitialServers(slug);

  return (
    <div className="ge-watch-shell">
      {/* Radial floodlight glow — pure atmosphere, no content */}
      <div className="ge-floodlight" aria-hidden="true" />

      <main style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 1280,
        width: "100%",
        margin: "0 auto",
        padding: "clamp(1.25rem, 4vw, 2rem) 20px clamp(2rem, 5vw, 4rem)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>

        {/* ── Hero: match identity ─────────────────────────────────── */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0, flex: 1 }}>

            {/* LIVE chip + sport label */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="ge-live-chip">
                <span className="ge-live-dot" />
                Live
              </span>
              <span style={{
                fontFamily: "var(--font-hanken), 'Hanken Grotesk', sans-serif",
                fontSize: 13,
                color: "var(--ge-on-surface-muted)",
                fontWeight: 600,
              }}>
                Football · HD
              </span>
            </div>

            {/* Match title — Anton, uppercase, stadium-sized */}
            <h1 className="ge-match-title">
              {homeTeam && awayTeam ? (
                <>
                  {homeTeam}{" "}
                  <span style={{ color: "var(--ge-primary)" }}>vs</span>{" "}
                  {awayTeam}
                </>
              ) : matchTitle}
            </h1>
          </div>

          {/* Back — ghost pill */}
          <Link href="/" className="ge-back-btn">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        {/* ── Stream player ─────────────────────────────────────────── */}
        <StreamPlayer slug={slug} matchTitle={matchTitle} initialServers={initialServers} />

        {/* ── AD SLOT — below player ──────────────────────────────────────────────
            To activate: replace this div with your ad network tag (e.g. Google AdSense
            <ins class="adsbygoogle" ...> or a custom banner). The slot is 728×90 on
            desktop and collapses to 320×50 on mobile via the ad-slot-leaderboard class.
            ──────────────────────────────────────────────────────────────────────── */}
        <div
          className="ad-slot-leaderboard"
          data-ad-slot="watch-below-player"
          aria-hidden="true"
        />

        <p style={{
          fontFamily: "var(--font-hanken), 'Hanken Grotesk', sans-serif",
          fontSize: 12,
          color: "var(--ge-on-surface-muted)",
          opacity: 0.65,
          margin: 0,
        }}>
          If a stream fails, switch to another server above.
        </p>

      </main>
    </div>
  );
}
