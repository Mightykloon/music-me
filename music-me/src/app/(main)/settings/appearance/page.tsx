"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeOption {
  value: string;
  label: string;
  description: string;
  colors: { bg: string; muted: string; primary: string; border: string; fg: string; mutedFg: string };
}

const themes: ThemeOption[] = [
  { value: "dark", label: "Dark", description: "Default dark theme", colors: { bg: "#0a0a0a", muted: "#1a1a2e", primary: "#8b5cf6", border: "#27272a", fg: "#ededed", mutedFg: "#a1a1aa" } },
  { value: "midnight", label: "Midnight", description: "Deep blue night", colors: { bg: "#0f172a", muted: "#1e293b", primary: "#6366f1", border: "#1e3a5f", fg: "#e2e8f0", mutedFg: "#94a3b8" } },
  { value: "amoled", label: "AMOLED", description: "Pure black", colors: { bg: "#000000", muted: "#111111", primary: "#8b5cf6", border: "#1a1a1a", fg: "#ffffff", mutedFg: "#888888" } },
  { value: "tokyo-night", label: "Tokyo Night", description: "Neon cityscape", colors: { bg: "#1a1b26", muted: "#24283b", primary: "#7aa2f7", border: "#292e42", fg: "#c0caf5", mutedFg: "#565f89" } },
  { value: "catppuccin", label: "Catppuccin", description: "Warm pastel mocha", colors: { bg: "#1e1e2e", muted: "#313244", primary: "#cba6f7", border: "#45475a", fg: "#cdd6f4", mutedFg: "#a6adc8" } },
  { value: "dracula", label: "Dracula", description: "Classic dark purple", colors: { bg: "#282a36", muted: "#44475a", primary: "#bd93f9", border: "#44475a", fg: "#f8f8f2", mutedFg: "#6272a4" } },
  { value: "nord", label: "Nord", description: "Arctic cool blues", colors: { bg: "#2e3440", muted: "#3b4252", primary: "#88c0d0", border: "#434c5e", fg: "#eceff4", mutedFg: "#81a1c1" } },
  { value: "rose-pine", label: "Rose Pine", description: "Elegant rose tones", colors: { bg: "#191724", muted: "#1f1d2e", primary: "#c4a7e7", border: "#26233a", fg: "#e0def4", mutedFg: "#908caa" } },
  { value: "gruvbox", label: "Gruvbox", description: "Retro warm tones", colors: { bg: "#1d2021", muted: "#282828", primary: "#fe8019", border: "#3c3836", fg: "#ebdbb2", mutedFg: "#928374" } },
  { value: "synthwave", label: "Synthwave", description: "80s retro neon", colors: { bg: "#13111c", muted: "#1a1726", primary: "#ff7edb", border: "#241b2f", fg: "#f0e6ff", mutedFg: "#848bbd" } },
  { value: "cyber", label: "Cyber", description: "Cyberpunk green", colors: { bg: "#0a0e14", muted: "#131820", primary: "#39ff14", border: "#1a2030", fg: "#e0ffe0", mutedFg: "#607080" } },
  { value: "sunset", label: "Sunset", description: "Warm dusk gradient", colors: { bg: "#1a1016", muted: "#261520", primary: "#f97316", border: "#3d1f2e", fg: "#fde8d0", mutedFg: "#b09080" } },
  { value: "ocean", label: "Ocean", description: "Deep sea blues", colors: { bg: "#0a1628", muted: "#0f2035", primary: "#22d3ee", border: "#1a3050", fg: "#d0f0ff", mutedFg: "#5090b0" } },
  { value: "forest", label: "Forest", description: "Natural dark greens", colors: { bg: "#0d1a0d", muted: "#142014", primary: "#4ade80", border: "#1e3520", fg: "#d0ffd0", mutedFg: "#608060" } },
  { value: "lavender", label: "Lavender", description: "Soft purple haze", colors: { bg: "#18141e", muted: "#221d2a", primary: "#d8b4fe", border: "#302840", fg: "#f0e8ff", mutedFg: "#9088a0" } },
];

export default function AppearanceSettingsPage() {
  const [activeTheme, setActiveTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("music-me-theme") ?? "dark";
    }
    return "dark";
  });

  const applyTheme = (theme: ThemeOption) => {
    setActiveTheme(theme.value);
    localStorage.setItem("music-me-theme", theme.value);
    const root = document.documentElement;
    root.style.setProperty("--background", theme.colors.bg);
    root.style.setProperty("--foreground", theme.colors.fg);
    root.style.setProperty("--muted", theme.colors.muted);
    root.style.setProperty("--muted-foreground", theme.colors.mutedFg);
    root.style.setProperty("--border", theme.colors.border);
    root.style.setProperty("--primary", theme.colors.primary);
    root.style.setProperty("--ring", theme.colors.primary);
    root.style.setProperty("--secondary", theme.colors.primary);
    root.style.setProperty("--accent", theme.colors.primary);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">Appearance</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize the look of your remixd experience.</p>
      </div>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Theme</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {themes.map((theme) => (
            <button key={theme.value} onClick={() => applyTheme(theme)} className={cn("relative p-3 rounded-xl border transition-all duration-200 text-left group", activeTheme === theme.value ? "border-primary ring-1 ring-primary/30" : "border-border/50 hover:border-border")}>
              <div className="w-full h-16 rounded-lg mb-2.5 overflow-hidden border border-black/20 relative" style={{ backgroundColor: theme.colors.bg }}>
                <div className="absolute top-1.5 left-1.5 right-1.5 h-2 rounded-sm" style={{ backgroundColor: theme.colors.muted }} />
                <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                  <div className="w-6 h-2 rounded-sm" style={{ backgroundColor: theme.colors.primary }} />
                  <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: theme.colors.border }} />
                </div>
                <div className="absolute top-5 left-1.5 right-1.5 space-y-1">
                  <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: theme.colors.fg, opacity: 0.6 }} />
                  <div className="h-1 rounded-full w-1/2" style={{ backgroundColor: theme.colors.mutedFg, opacity: 0.4 }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{theme.label}</p>
                  <p className="text-[10px] text-muted-foreground">{theme.description}</p>
                </div>
                {activeTheme === theme.value && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-primary-foreground" /></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Default Feed View</h2>
        <div className="flex gap-2">
          {["Stream", "Grid", "Radio", "Magazine"].map((mode) => (
            <button key={mode} className="px-3 py-1.5 rounded-lg border border-border/50 text-xs hover:border-primary/50 transition-colors">{mode}</button>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Compact Mode</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-primary" />
          <span className="text-sm text-muted-foreground">Use compact spacing for feed posts</span>
        </label>
      </section>
    </div>
  );
}
