"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { PlayerBar } from "@/components/player/player-bar";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";

// The site theme (dark/light + accent) is applied before first paint by
// THEME_INIT_SCRIPT in the root layout; see src/lib/theme.ts.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <PlayerBar />
      <PresenceHeartbeat />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--muted)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </SessionProvider>
  );
}
