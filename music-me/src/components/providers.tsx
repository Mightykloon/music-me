"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { PlayerBar } from "@/components/player/player-bar";

const themeMap: Record<string, Record<string, string>> = {
  dark: { "--background": "#0a0a0a", "--foreground": "#ededed", "--muted": "#1a1a2e", "--muted-foreground": "#a1a1aa", "--border": "#27272a", "--primary": "#8b5cf6", "--ring": "#8b5cf6", "--secondary": "#6d28d9", "--accent": "#a78bfa" },
  midnight: { "--background": "#0f172a", "--foreground": "#e2e8f0", "--muted": "#1e293b", "--muted-foreground": "#94a3b8", "--border": "#1e3a5f", "--primary": "#6366f1", "--ring": "#6366f1", "--secondary": "#6366f1", "--accent": "#6366f1" },
  amoled: { "--background": "#000000", "--foreground": "#ffffff", "--muted": "#111111", "--muted-foreground": "#888888", "--border": "#1a1a1a", "--primary": "#8b5cf6", "--ring": "#8b5cf6", "--secondary": "#8b5cf6", "--accent": "#8b5cf6" },
  "tokyo-night": { "--background": "#1a1b26", "--foreground": "#c0caf5", "--muted": "#24283b", "--muted-foreground": "#565f89", "--border": "#292e42", "--primary": "#7aa2f7", "--ring": "#7aa2f7", "--secondary": "#7aa2f7", "--accent": "#7aa2f7" },
  catppuccin: { "--background": "#1e1e2e", "--foreground": "#cdd6f4", "--muted": "#313244", "--muted-foreground": "#a6adc8", "--border": "#45475a", "--primary": "#cba6f7", "--ring": "#cba6f7", "--secondary": "#cba6f7", "--accent": "#cba6f7" },
  dracula: { "--background": "#282a36", "--foreground": "#f8f8f2", "--muted": "#44475a", "--muted-foreground": "#6272a4", "--border": "#44475a", "--primary": "#bd93f9", "--ring": "#bd93f9", "--secondary": "#bd93f9", "--accent": "#bd93f9" },
  nord: { "--background": "#2e3440", "--foreground": "#eceff4", "--muted": "#3b4252", "--muted-foreground": "#81a1c1", "--border": "#434c5e", "--primary": "#88c0d0", "--ring": "#88c0d0", "--secondary": "#88c0d0", "--accent": "#88c0d0" },
  "rose-pine": { "--background": "#191724", "--foreground": "#e0def4", "--muted": "#1f1d2e", "--muted-foreground": "#908caa", "--border": "#26233a", "--primary": "#c4a7e7", "--ring": "#c4a7e7", "--secondary": "#c4a7e7", "--accent": "#c4a7e7" },
  gruvbox: { "--background": "#1d2021", "--foreground": "#ebdbb2", "--muted": "#282828", "--muted-foreground": "#928374", "--border": "#3c3836", "--primary": "#fe8019", "--ring": "#fe8019", "--secondary": "#fe8019", "--accent": "#fe8019" },
  synthwave: { "--background": "#13111c", "--foreground": "#f0e6ff", "--muted": "#1a1726", "--muted-foreground": "#848bbd", "--border": "#241b2f", "--primary": "#ff7edb", "--ring": "#ff7edb", "--secondary": "#ff7edb", "--accent": "#ff7edb" },
  cyber: { "--background": "#0a0e14", "--foreground": "#e0ffe0", "--muted": "#131820", "--muted-foreground": "#607080", "--border": "#1a2030", "--primary": "#39ff14", "--ring": "#39ff14", "--secondary": "#39ff14", "--accent": "#39ff14" },
  sunset: { "--background": "#1a1016", "--foreground": "#fde8d0", "--muted": "#261520", "--muted-foreground": "#b09080", "--border": "#3d1f2e", "--primary": "#f97316", "--ring": "#f97316", "--secondary": "#f97316", "--accent": "#f97316" },
  ocean: { "--background": "#0a1628", "--foreground": "#d0f0ff", "--muted": "#0f2035", "--muted-foreground": "#5090b0", "--border": "#1a3050", "--primary": "#22d3ee", "--ring": "#22d3ee", "--secondary": "#22d3ee", "--accent": "#22d3ee" },
  forest: { "--background": "#0d1a0d", "--foreground": "#d0ffd0", "--muted": "#142014", "--muted-foreground": "#608060", "--border": "#1e3520", "--primary": "#4ade80", "--ring": "#4ade80", "--secondary": "#4ade80", "--accent": "#4ade80" },
  lavender: { "--background": "#18141e", "--foreground": "#f0e8ff", "--muted": "#221d2a", "--muted-foreground": "#9088a0", "--border": "#302840", "--primary": "#d8b4fe", "--ring": "#d8b4fe", "--secondary": "#d8b4fe", "--accent": "#d8b4fe" },
};

function ThemeLoader() {
  useEffect(() => {
    const saved = localStorage.getItem("music-me-theme");
    if (saved && themeMap[saved]) {
      const root = document.documentElement;
      for (const [prop, value] of Object.entries(themeMap[saved])) {
        root.style.setProperty(prop, value);
      }
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeLoader />
      {children}
      <PlayerBar />
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
