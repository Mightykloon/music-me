"use client";

import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  METRO_ACCENTS,
  DEFAULT_ACCENT,
  DEFAULT_THEME,
  applyTheme,
  readTheme,
  type MetroAccent,
  type MetroTheme,
} from "@/lib/theme";

// The live theme is the data-theme / data-accent on <html>; watch it directly.
const subscribe = (onChange: () => void) => {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-accent"] });
  return () => obs.disconnect();
};
const snapshot = () => {
  const { theme, accent } = readTheme();
  return `${theme}|${accent}`;
};
const serverSnapshot = () => `${DEFAULT_THEME}|${DEFAULT_ACCENT}`;

// Modelled on Windows Phone's Settings → Theme: a background (dark or light)
// and one of 20 accent colours, applied across the whole site instantly.
export default function AppearanceSettingsPage() {
  const [theme, accent] = useSyncExternalStore(subscribe, snapshot, serverSnapshot).split("|") as [
    MetroTheme,
    MetroAccent,
  ];

  const choose = (t: MetroTheme, a: MetroAccent) => applyTheme(t, a);

  return (
    <div className="space-y-10">
      <div>
        <p className="metro-app-title text-muted-foreground">settings</p>
        <h1 className="metro-header text-5xl mt-1">theme</h1>
      </div>

      <section className="space-y-3">
        <h2 className="metro-header text-2xl text-muted-foreground">background</h2>
        <div className="flex gap-3" role="radiogroup" aria-label="Background">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={theme === t}
              onClick={() => choose(t, accent)}
              className={cn(
                "w-28 text-left border-2 transition-colors",
                theme === t ? "border-primary" : "border-border hover:border-muted-foreground"
              )}
            >
              <div className={cn("h-16", t === "dark" ? "bg-black" : "bg-white")} />
              <p className="px-2 py-1.5 text-sm lowercase">{t}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="metro-header text-2xl text-muted-foreground">accent colour</h2>
        <div
          className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-w-md"
          role="radiogroup"
          aria-label="Accent colour"
        >
          {METRO_ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={accent === a.id}
              aria-label={a.id}
              title={a.id}
              onClick={() => choose(theme, a.id)}
              className="group relative aspect-square outline-offset-2 focus-visible:outline-2 focus-visible:outline-foreground"
              style={{ background: a.hex }}
            >
              {accent === a.id && (
                <Check className="absolute inset-0 m-auto w-7 h-7 text-white" strokeWidth={2.5} />
              )}
              <span className="absolute left-1.5 bottom-1 text-[11px] text-white/90 lowercase opacity-0 group-hover:opacity-100 transition-opacity">
                {a.id}
              </span>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Applies to buttons, links, tiles and highlights across re:mixd. Your
          profile keeps its own colours.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="metro-header text-2xl text-muted-foreground">preview</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="metro-button metro-button-accent">play</span>
          <span className="metro-button">follow</span>
          <span className="text-primary font-semibold">a link</span>
        </div>
      </section>
    </div>
  );
}
