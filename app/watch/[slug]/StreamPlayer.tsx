"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function StreamPlayer({ slug, matchTitle }: { slug: string; matchTitle: string }) {
  const [servers, setServers] = useState<string[] | null>(null);
  const [active, setActive] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const userPickedRef = useRef(false);
  const prevSlugRef = useRef(slug);

  // Reset when slug changes
  if (prevSlugRef.current !== slug) {
    prevSlugRef.current = slug;
    setServers(null);
    setActive(0);
    userPickedRef.current = false;
  }

  useEffect(() => {
    const ctrl = new AbortController();
    setServers(null);
    userPickedRef.current = false;

    fetch(`/api/stream-servers?slug=${encodeURIComponent(slug)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (!ctrl.signal.aborted) setServers(d.servers ?? []);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setServers([]);
      });

    return () => ctrl.abort();
  }, [slug]);

  const loading = servers === null;
  const empty = !loading && servers.length === 0;
  const rawUrl = servers?.[active] ?? null;

  // Route HLS streams through the embed player
  const isHls = rawUrl
    ? rawUrl.startsWith("/api/hls/") || /\.m3u8(\?|$)/i.test(rawUrl)
    : false;
  const frameUrl = rawUrl
    ? isHls
      ? `/embed/hls?url=${encodeURIComponent(rawUrl)}`
      : rawUrl
    : null;

  const borderColor = empty
    ? "rgba(255,255,255,0.06)"
    : loading
    ? "rgba(67,56,202,0.45)"
    : "rgba(255,23,68,0.55)";
  const glowColor = loading
    ? "0 0 40px rgba(67,56,202,0.18)"
    : empty
    ? "none"
    : "0 0 40px rgba(255,23,68,0.18)";

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── SERVER BAR ── */}
      <motion.div
        className="sp-server-bar"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className="sp-status-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="sp-dot-blue" />
              <span className="sp-status-text">Finding streams…</span>
            </motion.div>
          ) : empty ? (
            <motion.div
              key="empty"
              className="sp-status-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="sp-dot-red" />
              <span className="sp-status-text">No streams found — check back when the match kicks off</span>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div className="sp-status-row">
                <span className="sp-dot-green" />
                <span className="sp-status-text sp-status-text-green">
                  {servers.length} STREAM{servers.length > 1 ? "S" : ""} AVAILABLE
                </span>
              </div>
              <div className="sp-buttons-row">
                {servers.map((_, i) => (
                  <motion.button
                    key={i}
                    className={`sp-btn ${active === i ? "sp-btn-active" : "sp-btn-idle"}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      userPickedRef.current = true;
                      setActive(i);
                      setIframeKey((k) => k + 1);
                    }}
                  >
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {i === 0 ? "Stream 1" : `Server ${i + 1}`}
                  </motion.button>
                ))}
                {rawUrl && (
                  <motion.a
                    href={rawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sp-btn sp-btn-idle"
                    style={{ textDecoration: "none" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Tab
                  </motion.a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── VIDEO AREA ── */}
      <motion.div
        className="sp-video-wrap"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ border: `2px solid ${borderColor}`, boxShadow: glowColor }}
      >
        {loading && <LoadingOverlay />}
        {empty && <NoStreamOverlay />}
        {frameUrl && (
          <iframe
            key={`${slug}-${active}-${iframeKey}`}
            src={frameUrl}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
            title={matchTitle}
          />
        )}
      </motion.div>

      {/* ── HINT ── */}
      {!loading && !empty && (
        <motion.div
          className="sp-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={12} cy={12} r={10} />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          <span>If the player shows an error, try another server or click <strong>Open Tab</strong>.</span>
        </motion.div>
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
      background: "linear-gradient(135deg, #0F0F23 0%, #1E1B4B 100%)",
      gap: 20,
    }}>
      <svg width={48} height={48} viewBox="0 0 44 44"
        style={{ animation: "spin 0.85s linear infinite", transformOrigin: "center" }}>
        <circle cx={22} cy={22} r={18} fill="none" stroke="rgba(67,56,202,0.15)" strokeWidth={4} />
        <path d="M40 22a18 18 0 0 0-18-18" fill="none" stroke="url(#sp-spin-grad)" strokeWidth={4} strokeLinecap="round" />
        <defs>
          <linearGradient id="sp-spin-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4338CA" />
            <stop offset="100%" stopColor="#818CF8" />
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
      background: "linear-gradient(135deg, #0F0F23 0%, #1E1B4B 100%)",
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
