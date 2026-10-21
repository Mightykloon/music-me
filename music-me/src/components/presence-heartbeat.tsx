"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { HEARTBEAT_MS } from "@/lib/presence-config";

/**
 * Tells the server this signed-in user is around: once on load, then every
 * couple of minutes while the tab is visible. Hidden tabs stay quiet, so
 * someone who walked away drops off the online list.
 */
export function PresenceHeartbeat() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    const beat = () => {
      if (document.visibilityState === "visible") fetch("/api/presence", { method: "POST", keepalive: true }).catch(() => {});
    };
    beat();
    const t = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [status]);

  return null;
}
