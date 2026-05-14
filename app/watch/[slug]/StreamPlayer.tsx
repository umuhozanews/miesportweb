"use client";

import { useState, useEffect, useRef } from "react";

export function StreamPlayer({
  slug,
  matchTitle,
  initialServers,
}: {
  slug: string;
  matchTitle: string;
  initialServers?: string[];
}) {
  const [servers, setServers] = useState<string[] | null>(
    initialServers && initialServers.length > 0 ? initialServers : null,
  );
  const [active, setActive] = useState(0);
  const [prevSlug, setPrevSlug] = useState(slug);

  if (slug !== prevSlug) {
    setPrevSlug(slug);
    setServers(null);
    setActive(0);
  }

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialServers && initialServers.length > 0) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetch(`/api/stream-servers?slug=${encodeURIComponent(slug)}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (!ctrl.signal.aborted) setServers(d.servers ?? []);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setServers([]);
      });

    return () => {
      ctrl.abort();
    };
  }, [slug, initialServers]);

  const loading = servers === null;
  const empty = !loading && servers.length === 0;
  const rawUrl = servers?.[active] ?? null;
  const isHls = rawUrl
    ? rawUrl.startsWith("/api/hls/") || /\.m3u8(\?|$)/i.test(rawUrl)
    : false;
  const currentUrl = rawUrl
    ? isHls
      ? `/embed/hls?url=${encodeURIComponent(rawUrl)}`
      : rawUrl
    : null;

  const videoBorder = empty
    ? "2px solid rgba(255,255,255,0.06)"
    : loading
    ? "2px solid rgba(0,102,255,0.45)"
    : "2px solid rgba(255,23,68,0.45)";

  const videoGlow = loading
    ? "0 0 40px rgba(0,102,255,0.18)"
    : empty
    ? "none"
    : "0 0 40px rgba(255,23,68,0.18)";

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── SERVER BAR ── */}
      <div className="sp-server-bar">
        {loading ? (
          <div className="sp-status-row">
            <span className="sp-dot-blue" />
            <span className="sp-status-text">Finding streams…</span>
          </div>
        ) : empty ? (
          <div className="sp-status-row">
            <span className="sp-dot-red" />
            <span className="sp-status-text">No streams found — check back when the match kicks off</span>
          </div>
        ) : (
          <>
            <div className="sp-status-row">
              <span className="sp-dot-green" />
              <span className="sp-status-text sp-status-text-green">
                {servers.length} Stream{servers.length > 1 ? "s" : ""} Available
              </span>
            </div>
            <div className="sp-buttons-row">
              {servers.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`sp-btn ${active === i ? "sp-btn-active" : "sp-btn-idle"}`}
                >
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {url.includes("soccertvhd.com") ? "SoccerTV HD" : url.startsWith("/api/hls/") ? "HLS Stream" : `Server ${i + 1}`}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── VIDEO AREA ── */}
      <div className="sp-video-wrap" style={{ border: videoBorder, boxShadow: videoGlow }}>
        {loading && <LoadingOverlay />}
        {empty && <NoStreamOverlay />}
        {currentUrl && (
          <iframe
            key={`${slug}-${active}`}
            src={currentUrl}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
            referrerPolicy="no-referrer-when-downgrade"
            title={matchTitle}
          />
        )}
      </div>

      {/* ── HINT ── */}
      {!loading && !empty && (
        <div className="sp-hint">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={12} cy={12} r={10} />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          <span>Popup &amp; redirect ads are blocked. If the stream is black, try another server above.</span>
        </div>
      )}
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #050d1a 0%, #060f0a 100%)",
      gap: 20,
    }}>
      <svg width={48} height={48} viewBox="0 0 44 44"
        style={{ animation: "spin 0.85s linear infinite", transformOrigin: "center" }}>
        <circle cx={22} cy={22} r={18} fill="none" stroke="rgba(0,102,255,0.12)" strokeWidth={4} />
        <path d="M40 22a18 18 0 0 0-18-18" fill="none" stroke="url(#spin-grad)" strokeWidth={4} strokeLinecap="round" />
        <defs>
          <linearGradient id="spin-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0066ff" />
            <stop offset="100%" stopColor="#00c6ff" />
          </linearGradient>
        </defs>
      </svg>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>
        Connecting to stream…
      </p>
    </div>
  );
}

function NoStreamOverlay() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #050d1a 0%, #060f0a 100%)",
      gap: 14,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: "50%",
        background: "rgba(255,23,68,0.08)",
        border: "1px solid rgba(255,23,68,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,23,68,0.6)" strokeWidth={1.5}>
          <circle cx={12} cy={12} r={10} />
          <path strokeLinecap="round" d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
        </svg>
      </div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 800, margin: 0 }}>
        Stream not available yet
      </p>
      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, margin: 0, textAlign: "center", maxWidth: 260 }}>
        This match may not have started. Check back once it kicks off.
      </p>
    </div>
  );
}
