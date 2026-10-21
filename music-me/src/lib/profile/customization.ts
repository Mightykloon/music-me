import { z } from "zod";

// Everything a profile can be dressed up with beyond colours and fonts.
// Stored as one JSON blob on UserProfile.customization so new options never
// need a database change; always read it through `readCustomization`.

export const CURSORS = ["default", "crosshair", "pixel", "star", "heart", "skull", "pickaxe", "custom"] as const;
export const OVERLAYS = ["none", "grain", "scanlines", "halftone", "xerox", "glitter", "vhs"] as const;
export const TRAILS = ["none", "sparkle", "stars", "hearts", "pixels"] as const;
export const CARD_STYLES = ["glass", "solid", "outline", "torn", "tape", "pixel", "sticker"] as const;
export const CORNERS = ["sharp", "soft", "round"] as const;
export const SONG_SKINS = ["metro", "winamp", "cassette", "ipod", "vinyl"] as const;
export const COUNTER_STYLES = ["odometer", "pixel", "plain"] as const;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const customizationSchema = z.object({
  cursor: z.enum(CURSORS).default("default"),
  cursorUrl: z.string().url().startsWith("https://").max(500).or(z.literal("")).default(""),
  trail: z.enum(TRAILS).default("none"),
  overlay: z.enum(OVERLAYS).default("none"),
  overlayStrength: z.number().min(0.05).max(1).default(0.35),
  cardStyle: z.enum(CARD_STYLES).default("glass"),
  corners: z.enum(CORNERS).default("soft"),
  songSkin: z.enum(SONG_SKINS).default("metro"),
  textColor: hex.or(z.literal("")).default(""),
  marquee: z.string().max(140).default(""),
  moodEmoji: z.string().max(8).default(""),
  moodText: z.string().max(40).default(""),
  showTop8: z.boolean().default(true),
  top8Title: z.string().max(30).default("Top 8"),
  showWall: z.boolean().default(true),
  showCounter: z.boolean().default(false),
  counterStyle: z.enum(COUNTER_STYLES).default("odometer"),
});

export type Customization = z.infer<typeof customizationSchema>;

export const DEFAULT_CUSTOMIZATION: Customization = customizationSchema.parse({});

/** Parse whatever is stored, dropping anything invalid back to its default. */
export function readCustomization(raw: unknown): Customization {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  const shape = customizationSchema.shape;
  for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
    const r = shape[key].safeParse(obj[key]);
    out[key] = r.success ? r.data : DEFAULT_CUSTOMIZATION[key];
  }
  return out as Customization;
}

// ---------------------------------------------------------------- fonts

/** Fonts offered in the picker, grouped. Any other Google Font can be typed in. */
export const FONT_GROUPS: { label: string; fonts: string[] }[] = [
  { label: "clean", fonts: ["Inter", "Space Grotesk", "DM Sans", "Outfit", "Syne", "Instrument Serif", "Playfair Display", "Bebas Neue"] },
  { label: "grunge", fonts: ["Special Elite", "Rubik Glitch", "Rubik Wet Paint", "Rubik Distressed", "Rubik Spray Paint", "Permanent Marker", "Rock Salt", "Lacquer"] },
  { label: "scene / goth", fonts: ["Metal Mania", "Pirata One", "UnifrakturMaguntia", "Creepster", "Nosifer", "Butcherman", "Eater"] },
  { label: "pixel / terminal", fonts: ["VT323", "Press Start 2P", "Silkscreen", "JetBrains Mono", "Courier Prime"] },
  { label: "y2k / handwritten", fonts: ["Monoton", "Bungee Shade", "Comic Neue", "Caveat", "Shadows Into Light", "Gochi Hand"] },
];

// Fonts with several weights; everything else is requested at its one
// weight, because asking Google for a weight a font lacks fails the request.
const MULTI_WEIGHT = new Set([
  "Inter", "Space Grotesk", "DM Sans", "Outfit", "Syne", "Playfair Display", "JetBrains Mono", "Comic Neue", "Caveat", "Courier Prime",
]);

export const FONT_NAME = /^[A-Za-z0-9 -]{1,50}$/;

/** The font the site already loads; it never needs a Google request. */
export const SITE_DEFAULT_FONTS = new Set(["Inter", "Space Grotesk"]);

export function googleFontHref(fonts: (string | null | undefined)[]): string | null {
  const wanted = Array.from(new Set(fonts.filter((f): f is string => !!f && FONT_NAME.test(f) && !SITE_DEFAULT_FONTS.has(f) && f !== "system-ui")));
  if (wanted.length === 0) return null;
  const families = wanted.map((f) => {
    const name = f.trim().replace(/\s+/g, "+");
    return MULTI_WEIGHT.has(f) ? `family=${name}:wght@300;400;500;600;700` : `family=${name}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

// ---------------------------------------------------------------- cursors

const svgCursor = (svg: string, x: number, y: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}, auto`;

// 16-unit pixel grids, drawn at 2x so they stay crisp
const px = (rows: string[], palette: Record<string, string>) => {
  let rects = "";
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (palette[c]) rects += `<rect x="${x * 2}" y="${y * 2}" width="2" height="2" fill="${palette[c]}"/>`;
    })
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">${rects}</svg>`;
};

const PIXEL_ARROW = px(
  ["k", "kk", "kwk", "kwwk", "kwwwk", "kwwwwk", "kwwwwwk", "kwwwwwwk", "kwwwwkkkk", "kwwkwk", "kwk kwk", "kk  kwk", "k    kwk", "     kwk", "      kk"],
  { k: "#000", w: "#fff" }
);

// a little diamond pickaxe
const PICKAXE = px(
  [
    "    cccccc",
    "  cCCCCCCCc",
    " cCc     cCc",
    "cCc   b   cCc",
    "cc   b     cc",
    "    b",
    "   b",
    "  b",
    " b",
    "b",
  ].map((r) => r.padEnd(16)),
  { c: "#1b7f79", C: "#5decf5", b: "#8a5a2b" }
);

const STAR = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path d="M12 1.5l3 7.1 7.6.6-5.8 5 1.8 7.4L12 17.6 5.4 21.6l1.8-7.4-5.8-5 7.6-.6z" fill="#ffe04a" stroke="#000" stroke-width="1.4"/></svg>`;
const HEART = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" fill="#ff3d8b" stroke="#000" stroke-width="1.4"/></svg>`;
const SKULL = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><path d="M12 2C6.5 2 3 5.6 3 10.2c0 2.6 1.2 4.4 3 5.5V19h3v2h6v-2h3v-3.3c1.8-1.1 3-2.9 3-5.5C21 5.6 17.5 2 12 2z" fill="#f4f1e8" stroke="#000" stroke-width="1.4"/><circle cx="8.5" cy="11" r="2.2"/><circle cx="15.5" cy="11" r="2.2"/><path d="M11 15h2l-1-2z"/></svg>`;

export function cursorCss(c: Customization): string | undefined {
  switch (c.cursor) {
    case "crosshair":
      return "crosshair";
    case "pixel":
      return svgCursor(PIXEL_ARROW, 0, 0);
    case "star":
      return svgCursor(STAR, 14, 14);
    case "heart":
      return svgCursor(HEART, 13, 13);
    case "skull":
      return svgCursor(SKULL, 13, 13);
    case "pickaxe":
      return svgCursor(PICKAXE, 1, 9);
    case "custom":
      return c.cursorUrl ? `url("${c.cursorUrl.replace(/["\\\n]/g, "")}") 4 4, auto` : undefined;
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------- custom CSS

export const MAX_CSS_LENGTH = 12_000;

/**
 * Make user CSS safe to drop into a <style> tag on their profile:
 *  - no way out of the style tag (`<` is removed outright),
 *  - no outside stylesheets or legacy script hooks (@import, expression(),
 *    behavior, -moz-binding, javascript:),
 *  - images only over https,
 *  - nothing pinned over the site's own navigation (position: fixed/sticky
 *    become absolute/relative; the profile is its own stacking context, so
 *    z-index can't climb over the nav either).
 * The result is wrapped in `@scope` by the profile, so it only styles the
 * profile itself.
 */
export function sanitizeCss(input: string): string {
  let css = input.slice(0, MAX_CSS_LENGTH);
  css = css.replace(/</g, "");
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  css = css.replace(/\\/g, "");
  css = css.replace(/@(import|charset|namespace)[^;]*;?/gi, "");
  css = css.replace(/expression\s*\(/gi, "(");
  css = css.replace(/(behavior|-moz-binding)\s*:[^;}]*/gi, "");
  css = css.replace(/javascript\s*:/gi, "");
  css = css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_m, _q, u: string) =>
    /^https:\/\/[^\s'"()]+$/i.test(u.trim()) ? `url("${u.trim()}")` : "none"
  );
  // the keywords themselves, so `--p: fixed; position: var(--p)` can't sneak past
  css = css.replace(/\bfixed\b/gi, "absolute").replace(/\bsticky\b/gi, "relative");
  return balanceBraces(css).trim();
}

/** Drop stray closing braces and close unclosed blocks, so nothing escapes @scope. */
function balanceBraces(css: string): string {
  let depth = 0;
  let out = "";
  for (const ch of css) {
    if (ch === "{") depth++;
    if (ch === "}") {
      if (depth === 0) continue;
      depth--;
    }
    out += ch;
  }
  return out + "}".repeat(depth);
}

/**
 * Final stylesheet for a profile: user rules scoped to the profile root,
 * with @keyframes and @font-face lifted out (they don't work inside @scope).
 */
export function buildProfileCss(raw: string | null | undefined): string {
  const css = sanitizeCss(raw ?? "");
  if (!css) return "";
  const hoisted: string[] = [];
  let scoped = "";
  let i = 0;
  while (i < css.length) {
    const at = css.slice(i).match(/^\s*@(-webkit-)?(keyframes|font-face)\b/i);
    if (at) {
      const open = css.indexOf("{", i);
      if (open < 0) break;
      let depth = 0;
      let j = open;
      for (; j < css.length; j++) {
        if (css[j] === "{") depth++;
        else if (css[j] === "}" && --depth === 0) break;
      }
      hoisted.push(css.slice(i, j + 1).trim());
      i = j + 1;
      continue;
    }
    // copy one top-level chunk (up to the end of its block)
    let depth = 0;
    let j = i;
    for (; j < css.length; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}" && --depth === 0) break;
    }
    scoped += css.slice(i, j + 1);
    i = j + 1;
  }
  return `${hoisted.join("\n")}\n@scope (.profile-root) {\n${scoped.trim()}\n}`;
}

/** Class names the CSS editor can target, shown as a cheat sheet. */
export const CSS_HOOKS: { selector: string; what: string }[] = [
  { selector: ".profile-root", what: "the whole page" },
  { selector: ".profile-card", what: "every box / section" },
  { selector: ".profile-name", what: "your display name" },
  { selector: ".profile-bio", what: "your bio" },
  { selector: ".profile-avatar", what: "profile picture" },
  { selector: ".profile-mood", what: "mood line" },
  { selector: ".profile-marquee", what: "scrolling banner text" },
  { selector: ".profile-song", what: "profile song player" },
  { selector: ".profile-top8", what: "Top 8 friends" },
  { selector: ".profile-wall", what: "comment wall" },
  { selector: ".profile-counter", what: "visitor counter" },
  { selector: ".profile-section-title", what: "section headings" },
];

// ---------------------------------------------------------------- presets

export interface ThemePreset {
  id: string;
  name: string;
  blurb: string;
  colors: { backgroundColor: string; primaryColor: string; secondaryColor: string; accentColor: string };
  fontFamily: string;
  headingFont: string;
  textEffect: string;
  layoutStyle: string;
  customization: Partial<Customization>;
  swatch: string[];
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "metro",
    name: "metro",
    blurb: "the site default",
    colors: { backgroundColor: "#0a0a0a", primaryColor: "#8b5cf6", secondaryColor: "#6d28d9", accentColor: "#a78bfa" },
    fontFamily: "Inter",
    headingFont: "Space Grotesk",
    textEffect: "",
    layoutStyle: "CLASSIC",
    customization: { cursor: "default", trail: "none", overlay: "none", cardStyle: "glass", corners: "soft", songSkin: "metro", textColor: "" },
    swatch: ["#0a0a0a", "#8b5cf6", "#a78bfa"],
  },
  {
    id: "scene-2007",
    name: "scene kid 2007",
    blurb: "hot pink, glitter, rawr",
    colors: { backgroundColor: "#0b0b0b", primaryColor: "#ff2e93", secondaryColor: "#00e5ff", accentColor: "#c6ff00" },
    fontFamily: "Comic Neue",
    headingFont: "Rubik Glitch",
    textEffect: "rainbow",
    layoutStyle: "MYSPACE",
    customization: { cursor: "star", trail: "sparkle", overlay: "glitter", overlayStrength: 0.4, cardStyle: "outline", corners: "sharp", songSkin: "winamp", textColor: "" },
    swatch: ["#0b0b0b", "#ff2e93", "#00e5ff", "#c6ff00"],
  },
  {
    id: "zine",
    name: "photocopy zine",
    blurb: "xerox grain, tape, typewriter",
    colors: { backgroundColor: "#e9e4d8", primaryColor: "#111111", secondaryColor: "#d7261e", accentColor: "#d7261e" },
    fontFamily: "Special Elite",
    headingFont: "Rubik Distressed",
    textEffect: "",
    layoutStyle: "MAGAZINE",
    customization: { cursor: "crosshair", trail: "none", overlay: "xerox", overlayStrength: 0.5, cardStyle: "tape", corners: "sharp", songSkin: "cassette", textColor: "#111111" },
    swatch: ["#e9e4d8", "#111111", "#d7261e"],
  },
  {
    id: "basement",
    name: "basement show",
    blurb: "spray paint and static",
    colors: { backgroundColor: "#141414", primaryColor: "#e8e8e8", secondaryColor: "#7a7a7a", accentColor: "#ff4d00" },
    fontFamily: "Courier Prime",
    headingFont: "Rubik Spray Paint",
    textEffect: "flicker",
    layoutStyle: "BENTO",
    customization: { cursor: "skull", trail: "none", overlay: "grain", overlayStrength: 0.45, cardStyle: "torn", corners: "sharp", songSkin: "cassette", textColor: "" },
    swatch: ["#141414", "#e8e8e8", "#ff4d00"],
  },
  {
    id: "vhs",
    name: "late night vhs",
    blurb: "scanlines, chroma, tracking",
    colors: { backgroundColor: "#120a24", primaryColor: "#ff71ce", secondaryColor: "#01cdfe", accentColor: "#05ffa1" },
    fontFamily: "VT323",
    headingFont: "Monoton",
    textEffect: "glitch",
    layoutStyle: "CLASSIC",
    customization: { cursor: "crosshair", trail: "pixels", overlay: "vhs", overlayStrength: 0.4, cardStyle: "glass", corners: "sharp", songSkin: "vinyl", textColor: "" },
    swatch: ["#120a24", "#ff71ce", "#01cdfe", "#05ffa1"],
  },
  {
    id: "goth",
    name: "cathedral",
    blurb: "blackletter and candle wax",
    colors: { backgroundColor: "#07060a", primaryColor: "#b3001b", secondaryColor: "#3d0a12", accentColor: "#d9c7a3" },
    fontFamily: "Playfair Display",
    headingFont: "UnifrakturMaguntia",
    textEffect: "glow",
    layoutStyle: "MINIMAL",
    customization: { cursor: "skull", trail: "none", overlay: "grain", overlayStrength: 0.25, cardStyle: "solid", corners: "sharp", songSkin: "vinyl", textColor: "#d9c7a3" },
    swatch: ["#07060a", "#b3001b", "#d9c7a3"],
  },
  {
    id: "overworld",
    name: "overworld",
    blurb: "blocky, grassy, mined by hand",
    colors: { backgroundColor: "#1d1a14", primaryColor: "#5daa3a", secondaryColor: "#7a5230", accentColor: "#5decf5" },
    fontFamily: "Silkscreen",
    headingFont: "Press Start 2P",
    textEffect: "shadow-pop",
    layoutStyle: "BENTO",
    customization: { cursor: "pickaxe", trail: "pixels", overlay: "none", cardStyle: "pixel", corners: "sharp", songSkin: "ipod", textColor: "" },
    swatch: ["#1d1a14", "#5daa3a", "#7a5230", "#5decf5"],
  },
];
