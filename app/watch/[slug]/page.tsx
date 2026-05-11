import Link from "next/link";
import Image from "next/image";
import { getProxiedHlsUrl } from "@/lib/hlsProxy";
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
  const playerSrc =
    primary?.type === "hls" ? getProxiedHlsUrl(primary.url) : primary?.url;

  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#050d1a" }}>

      {/* ── NAV ── */}
      <header style={{
        background: "#071224",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 2rem",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/mie-logo.png" alt="MIE Empire" width={40} height={40}
            style={{ borderRadius: 6, display: "block" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>MIE EMPIRE</div>
            <div style={{ color: "#5b9bd5", fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Live Football</div>
          </div>
        </Link>

        <Link href="/" style={{
          textDecoration: "none",
          display: "flex", alignItems: "center", gap: 6,
          color: "rgba(255,255,255,0.5)",
          fontSize: 13, fontWeight: 600,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Matches
        </Link>
      </header>

      {/* ── PLAYER ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 1100, width: "100%", margin: "0 auto", padding: "2rem 1.5rem", gap: 20 }}>

        {/* Match title */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              background: "#ef4444",
              color: "#fff", fontSize: 11, fontWeight: 800,
              letterSpacing: 1.5, textTransform: "uppercase",
              padding: "3px 10px", borderRadius: 4,
            }}>
              ● Live
            </span>
          </div>
          <h1 style={{ margin: 0, color: "#fff", fontSize: "clamp(1.3rem, 3vw, 2rem)", fontWeight: 900 }}>
            {title}
          </h1>
        </div>

        {/* Video player */}
        <div style={{
          width: "100%",
          borderRadius: 14,
          overflow: "hidden",
          background: "#000",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}>
          {primary ? (
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <div style={{ position: "absolute", inset: 0 }}>
                <VideoJsPlayer
                  playerId={`mie-${slug.replace(/[^a-z0-9_-]/gi, "-")}`}
                  src={playerSrc ?? primary.url}
                />
              </div>
            </div>
          ) : (
            <div style={{
              paddingTop: "56.25%",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.35)", gap: 12, textAlign: "center", padding: "2rem",
              }}>
                <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Stream not available yet</p>
                <p style={{ fontSize: 14, margin: 0 }}>Check back closer to kick-off time.</p>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        {primary && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "0.8rem 1.2rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                Streaming &nbsp;·&nbsp;
                <strong style={{ color: "#fff" }}>
                  {primary.type === "hls" ? "HD Adaptive" : primary.type?.toUpperCase()}
                </strong>
              </span>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>MIE Empire</span>
          </div>
        )}

      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "1.2rem 2rem",
        display: "flex", justifyContent: "center",
      }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} MIE Empire
        </span>
      </footer>

    </div>
  );
}
