import Link from "next/link";
import Image from "next/image";
import { scrapeSoccerTvHdStream } from "@/lib/soccerTvHd";
import { VideoJsPlayer } from "./VideoJsPlayer";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function WatchPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await scrapeSoccerTvHdStream(slug);
  const primary = data.primary;

  // Prefer HLS, then DASH, then iframe embed
  const hlsSrc = primary?.type === "hls" ? primary.url : null;
  const embedSrc = !hlsSrc && primary?.type === "embed" ? primary.url : null;
  const isLive = !!(hlsSrc ?? embedSrc);

  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const CHANNEL_NAMES: Record<string, string> = {
    "streameast-stream-east-live-streaming": "StreamEast",
    "score808-score808-live": "Score808",
    "hesgoal-hes-goal-live-streaming": "HesGoal",
    "sportsurge-sport-surge-live-streaming": "SportSurge",
  };
  const channelName = CHANNEL_NAMES[slug] ?? title;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#050d1a" }}>

      {/* ── NAV ── */}
      <header style={{
        background: "#071224",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 2rem",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/mie-logo.png" alt="MIE Empire" width={38} height={38}
            style={{ borderRadius: 6, display: "block" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: 1 }}>MIE EMPIRE</div>
            <div style={{ color: "#5b9bd5", fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Live Football</div>
          </div>
        </Link>

        <Link href="/" style={{
          textDecoration: "none",
          display: "flex", alignItems: "center", gap: 6,
          color: "rgba(255,255,255,0.45)",
          fontSize: 13, fontWeight: 600,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Channels
        </Link>
      </header>

      {/* ── PLAYER ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 1100, width: "100%", margin: "0 auto", padding: "1.75rem 1.5rem", gap: 18 }}>

        {/* Channel title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              {isLive ? (
                <>
                  <span className="dot-live" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#22c55e", letterSpacing: 1.5, textTransform: "uppercase" }}>Live Stream</span>
                </>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase" }}>Stream Channel</span>
              )}
            </div>
            <h1 style={{ margin: 0, color: "#fff", fontSize: "clamp(1.1rem, 3vw, 1.75rem)", fontWeight: 900 }}>
              {channelName}
            </h1>
          </div>
        </div>

        {/* Video player */}
        <div style={{
          width: "100%",
          borderRadius: 14,
          overflow: "hidden",
          background: "#000",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}>
          <div style={{ position: "relative", paddingTop: "56.25%" }}>
            <div style={{ position: "absolute", inset: 0 }}>
              {hlsSrc ? (
                <VideoJsPlayer
                  playerId={`mie-${slug.replace(/[^a-z0-9_-]/gi, "-")}`}
                  src={hlsSrc}
                  sourceUrl={data.sourceUrl}
                />
              ) : embedSrc ? (
                <iframe
                  src={embedSrc}
                  style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={channelName}
                />
              ) : (
                <OfflineState />
              )}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10,
          padding: "0.75rem 1.1rem",
          flexWrap: "wrap",
          gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: isLive ? "#22c55e" : "#ef4444",
              display: "inline-block",
              animation: isLive ? "pulse-dot 1.6s ease-in-out infinite" : "none",
            }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              {isLive
                ? <><strong style={{ color: "#fff" }}>HD Stream</strong> &nbsp;·&nbsp; Active</>
                : <>Stream <strong style={{ color: "#ef4444" }}>Offline</strong> &nbsp;·&nbsp; No match found</>
              }
            </span>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>MIE Empire</span>
        </div>

        {/* Watch on StreamEast — always visible */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          border: "1px solid rgba(59,130,246,0.3)",
          borderRadius: 12,
          padding: "1.1rem 1.4rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#60a5fa", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 }}>
              Live Stream Available
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
              Watch this match live on <strong style={{ color: "#fff" }}>StreamEast</strong> — free, no account needed
            </div>
          </div>
          <a
            href="https://streameastv1.com/schedule/soccer"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#1d4ed8",
              color: "#fff",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
              letterSpacing: 0.3,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch on StreamEast
          </a>
        </div>

        {/* Other channels */}
        <OtherChannels current={slug} />
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "1.1rem 2rem",
        display: "flex", justifyContent: "center",
      }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          © {new Date().getFullYear()} MIE Empire
        </span>
      </footer>

    </div>
  );
}

function OfflineState() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#050d1a",
      color: "rgba(255,255,255,0.3)",
      gap: 18, textAlign: "center", padding: "2rem",
    }}>
      <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25}>
        <circle cx={12} cy={12} r={10} />
        <path strokeLinecap="round" d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
      </svg>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "rgba(255,255,255,0.6)" }}>Embedded Stream Unavailable</p>
        <p style={{ fontSize: 13, margin: "0 0 20px", maxWidth: 300 }}>
          Use StreamEast to watch this match for free — click below to open their live soccer page.
        </p>
        <a
          href="https://streameastv1.com/schedule/soccer"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#1d4ed8",
            color: "#fff",
            borderRadius: 8,
            padding: "11px 24px",
            fontSize: 14,
            fontWeight: 800,
            textDecoration: "none",
            letterSpacing: 0.3,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Watch on StreamEast
        </a>
      </div>
    </div>
  );
}

const ALL_CHANNELS = [
  { name: "StreamEast",  slug: "streameast-stream-east-live-streaming" },
  { name: "Score808",    slug: "score808-score808-live" },
  { name: "HesGoal",     slug: "hesgoal-hes-goal-live-streaming" },
  { name: "SportSurge",  slug: "sportsurge-sport-surge-live-streaming" },
];

function OtherChannels({ current }: { current: string }) {
  const others = ALL_CHANNELS.filter((c) => c.slug !== current);
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
        Try Another Channel
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {others.map((ch) => (
          <Link key={ch.slug} href={`/watch/${ch.slug}`} style={{
            textDecoration: "none",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.65)",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            {ch.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
