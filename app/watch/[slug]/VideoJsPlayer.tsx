"use client";

import { createElement, useEffect, useState } from "react";

const VIDEO_JS_CSS = "https://1aaaa.b-cdn.net/8.10.0/video-js.css";
const VIDEO_JS_SCRIPT = "https://2aaaaa.b-cdn.net/8.10.0/video.min.js";

type VjsError = { code: number; message: string } | null;

type VideoJsPlayerInstance = {
  dispose: () => void;
  error: () => VjsError;
  on: (event: string, cb: () => void) => void;
};

type VideoJsWindow = Window & {
  videojs?: (
    id: string,
    options: object,
  ) => VideoJsPlayerInstance;
};

let videoJsLoader: Promise<void> | null = null;

export function VideoJsPlayer({
  playerId,
  src,
}: {
  playerId: string;
  src: string;
}) {
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    let player: VideoJsPlayerInstance | null = null;
    let cancelled = false;

    loadVideoJs().then(() => {
      if (cancelled) return;

      const videojs = (window as VideoJsWindow).videojs;
      if (!videojs) return;

      player = videojs(playerId, {
        autoplay: true,
        muted: false,
        fluid: true,
        errorDisplay: false,
      });

      player.on("error", () => {
        setStreamError("No live match on right now. These channels only broadcast top-tier matches (Champions League, World Cup, etc). Try again when a major match is on.");
      });
    });

    return () => {
      cancelled = true;
      player?.dispose();
    };
  }, [playerId, src]);

  if (streamError) {
    return (
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#050d1a",
        color: "rgba(255,255,255,0.35)",
        gap: 14, textAlign: "center", padding: "2rem",
      }}>
        <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25}>
          <circle cx={12} cy={12} r={10} />
          <path strokeLinecap="round" d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
        </svg>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "rgba(255,255,255,0.6)" }}>Stream Offline</p>
          <p style={{ fontSize: 13, margin: 0 }}>{streamError}</p>
        </div>
      </div>
    );
  }

  return createElement(
    "video-js",
    {
      id: playerId,
      className: "video-js vjs-default-skin vjs-big-play-centered h-full w-full",
      controls: true,
      preload: "auto",
      "data-setup": "{}",
    },
    createElement("source", {
      src,
      type: "application/x-mpegURL",
    }),
  );
}

function loadVideoJs() {
  if (videoJsLoader) {
    return videoJsLoader;
  }

  videoJsLoader = new Promise<void>((resolve, reject) => {
    if ((window as VideoJsWindow).videojs) {
      resolve();
      return;
    }

    if (!document.querySelector(`link[href="${VIDEO_JS_CSS}"]`)) {
      const link = document.createElement("link");
      link.href = VIDEO_JS_CSS;
      link.rel = "stylesheet";
      document.head.append(link);
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${VIDEO_JS_SCRIPT}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = VIDEO_JS_SCRIPT;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(), { once: true });
    document.body.append(script);
  });

  return videoJsLoader;
}
