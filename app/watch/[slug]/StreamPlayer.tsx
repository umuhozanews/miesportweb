"use client";

import { useState } from "react";

const SPORTSURGE_URL = "https://www.soccertvhd.com/sportsurge-sport-surge-live-streaming/";

export function StreamPlayer({
  servers,
  matchTitle,
}: {
  servers: string[];
  matchTitle: string;
}) {
  const [active, setActive] = useState(0);

  const allServers = servers.length > 0 ? servers : [SPORTSURGE_URL];
  const labels = allServers.map((_, i) =>
    servers.length === 0
      ? i === 0 ? "SoccerTV HD" : `Server ${i + 1}`
      : i === 0 ? "Stream 1" : `Stream ${i + 1}`
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── SERVER BUTTONS ── */}
      <div style={{
        background: "#0d1523",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: servers.length > 0 ? "#22c55e" : "#f59e0b",
            boxShadow: servers.length > 0 ? "0 0 6px #22c55e" : "0 0 6px #f59e0b",
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 1.2, textTransform: "uppercase" }}>
            {servers.length > 0 ? `${servers.length} Stream${servers.length > 1 ? "s" : ""} Available` : "Backup Stream"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {labels.map((label, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                background: active === i ? "#dc2626" : "rgba(255,255,255,0.06)",
                color: active === i ? "#fff" : "rgba(255,255,255,0.7)",
                border: `1px solid ${active === i ? "#dc2626" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 7,
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
                letterSpacing: 0.2,
              }}
            >
              <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              {label}
            </button>
          ))}
          {/* Always show SoccerTV as extra fallback when we have real servers */}
          {servers.length > 0 && (
            <button
              onClick={() => setActive(allServers.length)}
              style={{
                background: active === allServers.length ? "#1d4ed8" : "rgba(255,255,255,0.06)",
                color: active === allServers.length ? "#fff" : "rgba(255,255,255,0.5)",
                border: `1px solid ${active === allServers.length ? "#1d4ed8" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 7,
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              SoccerTV
            </button>
          )}
        </div>
      </div>

      {/* ── VIDEO PLAYER (auto-plays on load) ── */}
      <div style={{
        border: `2px solid ${servers.length > 0 ? "#dc2626" : "#1d4ed8"}`,
        borderRadius: 10,
        overflow: "hidden",
        background: "#000",
        boxShadow: `0 0 40px ${servers.length > 0 ? "rgba(220,38,38,0.25)" : "rgba(29,78,216,0.2)"}`,
        aspectRatio: "16 / 9",
        width: "100%",
      }}>
        <iframe
          key={active}
          src={active < allServers.length ? allServers[active] : SPORTSURGE_URL}
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
          title={matchTitle}
        />
      </div>

      {/* ── HINT BAR ── */}
      <div style={{
        fontSize: 12,
        color: "rgba(255,255,255,0.3)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
      }}>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx={12} cy={12} r={10} />
          <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
        <span>If a stream is black or frozen, click another stream button above.</span>
      </div>

    </div>
  );
}
