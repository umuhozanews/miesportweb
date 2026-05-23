"use client";
import { useState, useEffect, useRef } from "react";

const WC_DATE = new Date("2026-06-11T16:00:00Z");

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      d:    Math.floor(diff / 86400000),
      h:    Math.floor((diff % 86400000) / 3600000),
      m:    Math.floor((diff % 3600000) / 60000),
      s:    Math.floor((diff % 60000) / 1000),
      done: diff === 0,
    };
  };
  const [cd, setCd] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setCd(calc()), 1000);
    return () => clearInterval(t);
  });
  return cd;
}

function Digit({ value, label }: { value: number; label: string }) {
  const [anim, setAnim] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setAnim(true);
      const t = setTimeout(() => setAnim(false), 320);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 30 }}>
      <div
        className={`ticker-digit-val${anim ? " digit-flip" : ""}`}
        style={{
          fontWeight: 900,
          color: "#fff",
          lineHeight: 1,
          letterSpacing: -1,
          fontVariantNumeric: "tabular-nums",
          fontFamily: "var(--font-display, monospace)",
          textShadow: "0 0 18px rgba(251,146,60,0.55)",
        }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div className="ticker-digit-label">{label}</div>
    </div>
  );
}

function Sep() {
  return (
    <span className="ticker-sep" style={{ fontWeight: 900, color: "#f97316", opacity: 0.7, alignSelf: "flex-start", marginTop: 1, lineHeight: 1 }}>
      :
    </span>
  );
}

const TICKER_ITEMS: { text: string; ad?: boolean }[] = [
  { text: "📢  USHAKA KWAMAMAZA?  HAMAGARA:  0787413998", ad: true },
  { text: "🏆  FIFA WORLD CUP 2026  — June 11 to July 19" },
  { text: "⚽  48 teams  ·  104 matches  ·  3 host nations" },
  { text: "📢  USHAKA KWAMAMAZA?  HAMAGARA:  0787413998", ad: true },
  { text: "🇺🇸  USA  ·  🇨🇦  Canada  ·  🇲🇽  Mexico" },
  { text: "🏟️  16 host cities across North America" },
  { text: "📢  USHAKA KWAMAMAZA?  HAMAGARA:  0787413998", ad: true },
  { text: "🌍  The biggest World Cup in football history" },
  { text: "🔴  Watch every goal LIVE on MIE SPORT" },
  { text: "📢  USHAKA KWAMAMAZA?  HAMAGARA:  0787413998", ad: true },
  { text: "⭐  Argentina  ·  Brazil  ·  France  ·  England  ·  Spain" },
  { text: "🎯  Group stage · Round of 32 · Knockouts · Final" },
  { text: "📢  USHAKA KWAMAMAZA?  HAMAGARA:  0787413998", ad: true },
  { text: "📺  Free HD streams — no login needed" },
  { text: "🏅  Who will lift the trophy on July 19?" },
];

export function TickerBar() {
  const { d, h, m, s, done } = useCountdown(WC_DATE);

  const tickerNodes = TICKER_ITEMS.map((item, i) => (
    <span key={i}>
      <span style={{
        fontWeight: item.ad ? 900 : 700,
        color: item.ad ? "#fb923c" : "rgba(255,255,255,0.38)",
        letterSpacing: item.ad ? 1 : 0.3,
      }}>
        {item.text}
      </span>
      <span style={{ color: "rgba(255,255,255,0.12)", padding: "0 18px" }}>·</span>
    </span>
  ));

  return (
    <div style={{
      width: "100%",
      background: "linear-gradient(90deg, #0a0a0f 0%, #1a0a00 40%, #2d0f00 55%, #1a0a00 70%, #0a0a0f 100%)",
      borderBottom: "1px solid rgba(251,146,60,0.18)",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 100% at 50% 50%, rgba(234,88,12,0.12) 0%, transparent 70%)",
      }} />

      <div className="ticker-bar-inner">

        {/* Row 1: brand left, countdown right */}
        <div className="ticker-bar-top">

          {/* WC logo + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, minWidth: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://a.espncdn.com/i/leaguelogos/soccer/500/4.png"
              alt="WC"
              width={26} height={26}
              style={{ objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(251,146,60,0.5))", flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, color: "#f97316", letterSpacing: 2, textTransform: "uppercase", lineHeight: 1.2 }}>
                {done ? "LIVE NOW" : "Countdown to"}
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                FIFA World Cup 2026
              </div>
            </div>
          </div>

          {/* Flip-digit countdown */}
          <div className="ticker-bar-countdown">
            <Digit value={d} label="Days" />
            <Sep />
            <Digit value={h} label="Hrs" />
            <Sep />
            <Digit value={m} label="Mins" />
            <Sep />
            <Digit value={s} label="Secs" />
          </div>

        </div>

        {/* Row 2: scrolling ticker — always full width of its container */}
        <div className="ticker-bar-scroll">
          <div className="ticker-track" style={{ fontSize: 11 }}>
            <span>{tickerNodes}</span>
            <span aria-hidden="true">{tickerNodes}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
