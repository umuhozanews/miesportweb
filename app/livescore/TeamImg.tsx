"use client";
import { useState } from "react";

/** Team logo with automatic letter-badge fallback when the image is missing. */
export function TeamImg({
  src,
  name,
  size,
  radius,
}: {
  src: string;
  name: string;
  size: number;
  radius?: number | string;
}) {
  const [failed, setFailed] = useState(!src);

  const initial = (name || "?")
    .replace(/^(FC|AC|AS|CF|RC|CD|SD|UD|SC|SL|BK|IFK|AFC|FK)\s+/i, "")
    .charAt(0)
    .toUpperCase();

  if (failed) {
    return (
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: radius ?? (size <= 18 ? "50%" : 5),
          background: "#152035",
          border: "1px solid #1e3050",
          color: "#3a6090",
          fontSize: Math.max(8, Math.round(size * 0.48)),
          fontWeight: 900,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          letterSpacing: -0.5,
          userSelect: "none",
        }}
      >
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      style={{ objectFit: "contain", flexShrink: 0, borderRadius: radius }}
      onError={() => setFailed(true)}
    />
  );
}

/** Competition / league badge with fallback football icon. */
export function CompImg({
  src,
  size,
  radius = 3,
}: {
  src: string;
  size: number;
  radius?: number;
}) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: "#1a2a3f",
          border: "1px solid #1e3050",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: Math.max(8, Math.round(size * 0.6)),
        }}
      >
        ⚽
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      style={{ objectFit: "contain", flexShrink: 0, borderRadius: radius }}
      onError={() => setFailed(true)}
    />
  );
}
