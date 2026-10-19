// Site-wide Metro theme: a dark or light background plus one accent colour,
// exactly like Windows Phone's Settings → Theme. Stored per browser; profiles
// keep their own colours on top of this.

export type MetroTheme = "dark" | "light";

// The 20 Windows Phone 8 accent colours. Hex values must stay in sync with
// the [data-accent] rules in globals.css.
export const METRO_ACCENTS = [
  { id: "lime", hex: "#a4c400" },
  { id: "green", hex: "#60a917" },
  { id: "emerald", hex: "#008a00" },
  { id: "teal", hex: "#00aba9" },
  { id: "cyan", hex: "#1ba1e2" },
  { id: "cobalt", hex: "#0050ef" },
  { id: "indigo", hex: "#6a00ff" },
  { id: "violet", hex: "#aa00ff" },
  { id: "pink", hex: "#f472d0" },
  { id: "magenta", hex: "#d80073" },
  { id: "crimson", hex: "#a20025" },
  { id: "red", hex: "#e51400" },
  { id: "orange", hex: "#fa6800" },
  { id: "amber", hex: "#f0a30a" },
  { id: "yellow", hex: "#d8c100" },
  { id: "brown", hex: "#825a2c" },
  { id: "olive", hex: "#6d8764" },
  { id: "steel", hex: "#647687" },
  { id: "mauve", hex: "#76608a" },
  { id: "sienna", hex: "#7a3b3f" },
] as const;

export type MetroAccent = (typeof METRO_ACCENTS)[number]["id"];

export const DEFAULT_THEME: MetroTheme = "dark";
export const DEFAULT_ACCENT: MetroAccent = "violet";

const THEME_KEY = "remixd-theme";
const ACCENT_KEY = "remixd-accent";

// Runs in <head> before first paint so the saved theme never flashes.
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement,t=localStorage.getItem("${THEME_KEY}"),a=localStorage.getItem("${ACCENT_KEY}");if(t==="light"||t==="dark"){d.dataset.theme=t;d.classList.toggle("dark",t==="dark")}if(a)d.dataset.accent=a}catch(e){}})();`;

export function readTheme(): { theme: MetroTheme; accent: MetroAccent } {
  if (typeof document === "undefined") return { theme: DEFAULT_THEME, accent: DEFAULT_ACCENT };
  const d = document.documentElement;
  const theme = d.dataset.theme === "light" ? "light" : "dark";
  const accent = (METRO_ACCENTS.find((a) => a.id === d.dataset.accent)?.id ?? DEFAULT_ACCENT) as MetroAccent;
  return { theme, accent };
}

export function applyTheme(theme: MetroTheme, accent: MetroAccent) {
  const d = document.documentElement;
  d.dataset.theme = theme;
  d.dataset.accent = accent;
  d.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(ACCENT_KEY, accent);
  } catch {
    // storage blocked (private mode etc.): the choice still applies for this visit
  }
}
