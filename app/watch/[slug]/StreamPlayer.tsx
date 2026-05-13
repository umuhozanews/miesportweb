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

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── VIDEO PLAYER with red border ── */}
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

      {/* ── BACKUP STREAM SERVERS ── */}
      <div style={{
        background: "#fff",
        borderRadius: 10,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}>
        <p style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: "#dc2626",
          letterSpacing: 0.3,
        }}>
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
                opacity: i >= servers.length ? 0.4 : 1,
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
