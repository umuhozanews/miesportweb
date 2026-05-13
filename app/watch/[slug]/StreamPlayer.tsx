"use client";

import { useState } from "react";

export function StreamPlayer({
  servers,
  matchTitle,
}: {
  servers: string[];
  matchTitle: string;
}) {
  const [active, setActive] = useState(0);
  const labels = servers.map((_, i) => (i === 0 ? "Main Server" : `Server ${i + 1}`));

  if (servers.length === 0) {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{
          border: "2px solid rgba(220,38,38,0.3)",
          borderRadius: 10,
          background: "#050d1a",
          aspectRatio: "16 / 9",
          overflow: "hidden",
          width: "100%",
        }}>
          <iframe
            src="https://www.soccertvhd.com/sportsurge-sport-surge-live-streaming/"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
            title={matchTitle}
          />
        </div>
        <div style={{
          background: "#111",
          borderRadius: 8,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Showing SoccerTV backup stream — main servers loading
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href="https://www.soccertvhd.com/sportsurge-sport-surge-live-streaming/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#1d4ed8", color: "#fff", borderRadius: 6,
                padding: "7px 14px", fontSize: 13, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              SoccerTV HD
            </a>
            <a
              href="https://istreameast.is/schedule/soccer"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#dc2626", color: "#fff", borderRadius: 6,
                padding: "7px 14px", fontSize: 13, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              StreamEast
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── VIDEO PLAYER ── */}
      <div style={{
        border: "2px solid #dc2626",
        borderRadius: 10,
        overflow: "hidden",
        background: "#000",
        boxShadow: "0 0 40px rgba(220,38,38,0.25)",
        aspectRatio: "16 / 9",
        width: "100%",
      }}>
        <iframe
          key={active}
          src={servers[active]}
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
          title={matchTitle}
        />
      </div>

      {/* ── SERVER SELECTOR ── */}
      <div style={{
        background: "#fff",
        borderRadius: 10,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#dc2626", letterSpacing: 0.3 }}>
          Backup Stream Servers
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {labels.map((label, i) => (
            <button
              key={i}
              onClick={() => i < servers.length && setActive(i)}
              style={{
                background: active === i ? "#dc2626" : "#fff",
                color: active === i ? "#fff" : "#111",
                border: `1px solid ${active === i ? "#dc2626" : "#d1d5db"}`,
                borderRadius: 6,
                padding: "9px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: i < servers.length ? "pointer" : "default",
                opacity: i >= servers.length ? 0.35 : 1,
                transition: "all 0.15s",
                minWidth: 110,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
