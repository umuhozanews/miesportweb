"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LiveRefresher() {
  const router = useRouter();
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (id !== null) return;
      id = setInterval(() => router.refresh(), 30_000);
    }
    function stop() {
      if (id === null) return;
      clearInterval(id);
      id = null;
    }

    function onVisibility() {
      document.hidden ? stop() : start();
    }

    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [router]);
  return null;
}
