"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LiveRefresher() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
