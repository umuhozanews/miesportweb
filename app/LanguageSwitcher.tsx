"use client";
import { useEffect, useState } from "react";

const LANGS = [
  { code: "en", label: "EN", full: "English" },
  { code: "fr", label: "FR", full: "Français" },
  { code: "rw", label: "RW", full: "Kinyarwanda" },
];

function getCurrent(): string {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return m ? m[1] : "en";
}

export function LanguageSwitcher() {
  const [current, setCurrent] = useState("en");

  useEffect(() => {
    setCurrent(getCurrent());
  }, []);

  const change = (code: string) => {
    const domain = window.location.hostname;
    if (code === "en") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
    } else {
      document.cookie = `googtrans=/en/${code}; path=/`;
      document.cookie = `googtrans=/en/${code}; path=/; domain=${domain}`;
    }
    setCurrent(code);
    window.location.reload();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "3px", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
      {LANGS.map(({ code, label }) => {
        const isActive = current === code;
        return (
          <button
            key={code}
            onClick={() => change(code)}
            title={LANGS.find(l => l.code === code)?.full}
            style={{
              padding: "4px 9px",
              background: isActive ? "#1e4db7" : "transparent",
              color: isActive ? "#fff" : "#555",
              border: "none",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: 0.8,
              transition: "all 0.15s",
              lineHeight: 1,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
