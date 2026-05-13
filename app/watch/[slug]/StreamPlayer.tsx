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
  const labels = ["Main Server", "Server 2", "Server 3"];

  if (servers.length === 0) {
    return (
      <div style={{
        border: "2px solid rgba(220,38,38,0.3)",
        borderRadius: 10,
        background: "#050d1a",
        aspectRatio: "16 / 9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        textAlign: "center",
        padding: "2rem",
        color: "rgba(255,255,255,0.4)",
      }}>
        <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25}>
          <circle cx={12} cy={12} r={10} />
          <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "rgba(255,255,255,0.6)" }}>
            Stream Not Available Yet
          </p>
          <p style={{ fontSize: 13, margin: "0 0 18px" }}>
            Check back when the match goes live, or watch on StreamEast directly.
          </p>
          <a
            href="https://istreameast.is/schedule/soccer"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#dc2626",
              color: "#fff",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
              letterSpacing: 0.3,
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Open StreamEast
          </a>
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
