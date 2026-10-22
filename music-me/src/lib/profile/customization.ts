import { z } from "zod";

// Everything a profile can be dressed up with beyond colours and fonts.
// Stored as one JSON blob on UserProfile.customization so new options never
// need a database change; always read it through `readCustomization`.

export const CURSORS = ["default", "crosshair", "pixel", "star", "heart", "skull", "pickaxe", "custom"] as const;
export const OVERLAYS = ["none", "grain", "scanlines", "halftone", "xerox", "glitter", "vhs"] as const;
/** each one moves differently, not just a different glyph (see components/profile/profile-effects.tsx) */
export const TRAILS = ["none", "sparkle", "stars", "hearts", "bubbles", "pixels", "comet"] as const;
export const CARD_STYLES = ["glass", "solid", "outline", "torn", "tape", "pixel", "sticker"] as const;
export const CORNERS = ["sharp", "soft", "round"] as const;
export const SONG_SKINS = ["metro", "winamp", "cassette", "ipod", "vinyl"] as const;
export const COUNTER_STYLES = ["odometer", "pixel", "plain"] as const;
/** the scrolling ticker across the top of the profile */
export const TICKER_STYLES = ["strip", "led", "tape", "glitter"] as const;
export const TICKER_SPEEDS = ["slow", "normal", "fast"] as const;

/** MySpace-style moods: pick one, or write your own */
export const MOODS: { emoji: string; text: string }[] = [
  { emoji: "🎧", text: "vibing" },
  { emoji: "😊", text: "happy" },
  { emoji: "🥰", text: "in love" },
  { emoji: "🤘", text: "hyped" },
  { emoji: "😴", text: "sleepy" },
  { emoji: "☕", text: "caffeinated" },
  { emoji: "🤔", text: "thoughtful" },
  { emoji: "😤", text: "annoyed" },
  { emoji: "😢", text: "sad" },
  { emoji: "🫠", text: "melting" },
  { emoji: "🎉", text: "celebrating" },
  { emoji: "🎸", text: "practicing" },
  { emoji: "🎮", text: "gaming" },
  { emoji: "📚", text: "studying" },
  { emoji: "🌙", text: "up late" },
  { emoji: "🔥", text: "on fire" },
];

/** how links show under the name: small icons, labelled badges, or not at all */
export const SOCIAL_STYLES = ["icons", "badges", "off"] as const;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const httpsOrEmpty = z.string().max(1000).refine((v) => v === "" || /^https:\/\/[^\s"'()<>]+$/i.test(v), "Images and links must be https");

// ---------------------------------------------------------------- blocks

/**
 * A profile can be a free arrangement of blocks on a 6-column grid instead
 * of one of the fixed layouts. Each block has a type, a width (2, 3, 4 or 6
 * columns: a third, half, two thirds or the full row) and an optional fixed
 * height. Arranged by dragging in the editor's live preview.
 */
export const BLOCK_TYPES = [
  "header", "song", "links", "top8", "wall", "posts", "playlists",
  "about", "artists", "vibes", "threads", "image", "text", "spacer",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
export const BLOCK_WIDTHS = [2, 3, 4, 6] as const;
export const BLOCK_HEIGHTS = ["auto", "s", "m", "l"] as const;

export const BLOCK_INFO: Record<BlockType, { label: string; hint: string; w: (typeof BLOCK_WIDTHS)[number] }> = {
  header: { label: "name & bio", hint: "picture, name, bio, mood, links", w: 4 },
  song: { label: "profile song", hint: "the player for your profile song", w: 2 },
  links: { label: "links", hint: "your links list", w: 2 },
  top8: { label: "top 8", hint: "your Top 8 friends", w: 3 },
  wall: { label: "comment wall", hint: "comments from visitors", w: 3 },
  posts: { label: "posts", hint: "your recent posts", w: 4 },
  playlists: { label: "playlists", hint: "your pinned playlists", w: 3 },
  about: { label: "about me", hint: "interests, hobbies, books and games", w: 3 },
  artists: { label: "top artists", hint: "who you listen to most", w: 2 },
  vibes: { label: "vibe board", hint: "your vibe board", w: 6 },
  threads: { label: "forum threads", hint: "threads you started", w: 3 },
  image: { label: "image", hint: "any picture, with a caption", w: 2 },
  text: { label: "text box", hint: "a title and whatever you want to say", w: 2 },
  spacer: { label: "spacer", hint: "empty space", w: 2 },
};

export const blockSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{1,16}$/i),
  type: z.enum(BLOCK_TYPES),
  w: z.number().refine((n) => (BLOCK_WIDTHS as readonly number[]).includes(n)),
  h: z.enum(BLOCK_HEIGHTS).default("auto"),
  title: z.string().max(60).default(""),
  text: z.string().max(2000).default(""),
  src: httpsOrEmpty.default(""),
  href: httpsOrEmpty.default(""),
});
export type Block = z.infer<typeof blockSchema>;
export const MAX_BLOCKS = 40;

export const newBlockId = () => Math.random().toString(36).slice(2, 10);
export const newBlock = (type: BlockType, extra: Partial<Block> = {}): Block => ({
  id: newBlockId(),
  type,
  w: BLOCK_INFO[type].w,
  h: type === "image" ? "m" : "auto",
  title: "",
  text: "",
  src: "",
  href: "",
  ...extra,
});

// ---------------------------------------------------------------- settings

export const customizationSchema = z.object({
  cursor: z.enum(CURSORS).default("default"),
  cursorUrl: z.string().url().startsWith("https://").max(500).or(z.literal("")).default(""),
  trail: z.enum(TRAILS).default("none"),
  overlay: z.enum(OVERLAYS).default("none"),
  overlayStrength: z.number().min(0.05).max(1).default(0.2),
  cardStyle: z.enum(CARD_STYLES).default("glass"),
  corners: z.enum(CORNERS).default("soft"),
  songSkin: z.enum(SONG_SKINS).default("metro"),
  textColor: hex.or(z.literal("")).default(""),
  socialStyle: z.enum(SOCIAL_STYLES).default("icons"),
  marquee: z.string().max(140).default(""),
  tickerStyle: z.enum(TICKER_STYLES).default("strip"),
  tickerSpeed: z.enum(TICKER_SPEEDS).default("normal"),
  moodEmoji: z.string().max(8).default(""),
  moodText: z.string().max(40).default(""),
  showTop8: z.boolean().default(true),
  top8Title: z.string().max(30).default("Top 8"),
  showWall: z.boolean().default(true),
  showCounter: z.boolean().default(false),
  counterStyle: z.enum(COUNTER_STYLES).default("odometer"),
  /** when there are blocks, they replace the fixed layout */
  blocks: z.array(blockSchema).max(MAX_BLOCKS).default([]),
});

export type Customization = z.infer<typeof customizationSchema>;

export const DEFAULT_CUSTOMIZATION: Customization = customizationSchema.parse({});

/** Parse whatever is stored, dropping anything invalid back to its default. */
export function readCustomization(raw: unknown): Customization {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  const shape = customizationSchema.shape;
  for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
    if (key === "blocks") {
      // keep every valid block, drop only broken ones
      const list = Array.isArray(obj.blocks) ? obj.blocks : [];
      out.blocks = list
        .map((b) => blockSchema.safeParse(b))
        .filter((r) => r.success)
        .map((r) => r.data)
        .slice(0, MAX_BLOCKS);
      continue;
    }
    // older trails that were renamed
    const value = key === "trail" && obj.trail === "pixel" ? "pixels" : obj[key];
    const r = shape[key].safeParse(value);
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

// a diamond pickaxe, block-game style: outlined curved head, wooden handle
const PICKAXE = px(
  [
    "...kkkkkk.......",
    "..kWDDDDDkk.....",
    "...kkddDDDDk....",
    "......kkdDDDk...",
    ".......kbkdDDk..",
    "......kbBk.kdDk.",
    ".....kbBk...kdDk",
    "....kbBk....kdDk",
    "...kbBk......kdk",
    "..kbBk........k.",
    ".kbBk...........",
    "kbBk............",
    "kBk.............",
    ".k..............",
    "................",
    "................",
  ],
  { k: "#141414", W: "#eafffd", D: "#5decf5", d: "#1f9ea6", b: "#a8743f", B: "#5e3c1c" }
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
      return svgCursor(PICKAXE, 6, 2); // the tip of the head
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

// ---------------------------------------------------------------- layouts

/** Fixed layouts (their own components) and block arrangements, offered side by side. */
export const LAYOUTS: { id: string; label: string; desc: string; blocks?: () => Block[] }[] = [
  { id: "CLASSIC", label: "Classic", desc: "one column, top to bottom" },
  { id: "MINIMAL", label: "Minimal", desc: "centred, no boxes" },
  { id: "BENTO", label: "Bento", desc: "a tidy grid of cards" },
  { id: "MAGAZINE", label: "Magazine", desc: "banner hero, two columns" },
  { id: "MYSPACE", label: "MySpace", desc: "the 2007 arrangement" },
  {
    id: "dashboard",
    label: "Dashboard",
    desc: "everything at a glance",
    blocks: () => [
      newBlock("header", { w: 4 }), newBlock("song", { w: 2 }),
      newBlock("top8", { w: 3 }), newBlock("links", { w: 3 }),
      newBlock("posts", { w: 4 }), newBlock("artists", { w: 2 }),
      newBlock("playlists", { w: 3 }), newBlock("threads", { w: 3 }),
      newBlock("wall", { w: 6 }),
    ],
  },
  {
    id: "spotlight",
    label: "Spotlight",
    desc: "big and centred, one thing at a time",
    blocks: () => [
      newBlock("header", { w: 6 }), newBlock("song", { w: 6 }),
      newBlock("links", { w: 6 }), newBlock("posts", { w: 6 }),
      newBlock("top8", { w: 3 }), newBlock("wall", { w: 3 }),
    ],
  },
  {
    id: "scrapbook",
    label: "Scrapbook",
    desc: "pictures, notes and odd sizes",
    blocks: () => [
      newBlock("header", { w: 3 }), newBlock("text", { w: 3, title: "about me", text: "Write anything here." }),
      newBlock("song", { w: 2 }), newBlock("image", { w: 2 }), newBlock("about", { w: 2 }),
      newBlock("top8", { w: 4 }), newBlock("artists", { w: 2 }),
      newBlock("vibes", { w: 6 }),
      newBlock("posts", { w: 3 }), newBlock("wall", { w: 3 }),
    ],
  },
  {
    id: "friendspace",
    label: "Friend Space",
    desc: "MySpace, rebuilt with blocks",
    blocks: () => [
      newBlock("header", { w: 2 }), newBlock("about", { w: 4, title: "blurbs" }),
      newBlock("song", { w: 2 }), newBlock("top8", { w: 4, title: "friend space" }),
      newBlock("links", { w: 2 }), newBlock("wall", { w: 4 }),
      newBlock("posts", { w: 6 }),
    ],
  },
  {
    id: "sidebar",
    label: "Sidebar",
    desc: "you on the left, the feed on the right",
    blocks: () => [
      newBlock("header", { w: 2 }), newBlock("posts", { w: 4 }),
      newBlock("song", { w: 2 }), newBlock("wall", { w: 4 }),
      newBlock("links", { w: 2 }), newBlock("threads", { w: 4 }),
      newBlock("top8", { w: 2 }), newBlock("playlists", { w: 4 }),
    ],
  },
];

// ---------------------------------------------------------------- templates

/** A complete look: colours, fonts, name effect, style and arrangement. */
export interface ProfileTemplate {
  id: string;
  name: string;
  blurb: string;
  colors: { backgroundColor: string; primaryColor: string; secondaryColor: string; accentColor: string };
  fontFamily: string;
  headingFont: string;
  fontWeight: string;
  effect: { type: string; color?: string; color2?: string; color3?: string; speed?: number };
  /** an id from LAYOUTS */
  layout: string;
  customization: Partial<Customization>;
}

export const PROFILE_TEMPLATES: ProfileTemplate[] = [
  {
    id: "metro",
    name: "metro",
    blurb: "the site default",
    colors: { backgroundColor: "#0a0a0a", primaryColor: "#8b5cf6", secondaryColor: "#6d28d9", accentColor: "#a78bfa" },
    fontFamily: "Inter",
    headingFont: "Space Grotesk",
    fontWeight: "400",
    effect: { type: "" },
    layout: "CLASSIC",
    customization: { cursor: "default", trail: "none", overlay: "none", cardStyle: "glass", corners: "soft", songSkin: "metro", textColor: "", socialStyle: "icons" },
  },
  {
    id: "scene-queen",
    name: "scene queen",
    blurb: "2007 forever, xD",
    colors: { backgroundColor: "#0b0b10", primaryColor: "#ff3ea5", secondaryColor: "#2de2ff", accentColor: "#b8ff3c" },
    fontFamily: "Outfit",
    headingFont: "Rubik Glitch",
    fontWeight: "500",
    effect: { type: "gradient", color: "#ff3ea5", color2: "#2de2ff", color3: "#b8ff3c", speed: 5 },
    layout: "friendspace",
    customization: { cursor: "star", trail: "sparkle", overlay: "glitter", overlayStrength: 0.12, cardStyle: "outline", corners: "sharp", songSkin: "winamp", textColor: "", socialStyle: "badges" },
  },
  {
    id: "zine",
    name: "photocopy zine",
    blurb: "cut, paste, staple",
    colors: { backgroundColor: "#ece6d8", primaryColor: "#161616", secondaryColor: "#c8241c", accentColor: "#c8241c" },
    fontFamily: "Courier Prime",
    headingFont: "Special Elite",
    fontWeight: "400",
    effect: { type: "retro", color: "#c8241c" },
    layout: "scrapbook",
    customization: { cursor: "crosshair", trail: "none", overlay: "xerox", overlayStrength: 0.14, cardStyle: "tape", corners: "sharp", songSkin: "cassette", textColor: "#161616", socialStyle: "badges" },
  },
  {
    id: "basement",
    name: "basement show",
    blurb: "loud, sweaty, all ages",
    colors: { backgroundColor: "#121212", primaryColor: "#ff5a1f", secondaryColor: "#5c5c5c", accentColor: "#ffd23f" },
    fontFamily: "Space Grotesk",
    headingFont: "Rubik Spray Paint",
    fontWeight: "500",
    effect: { type: "neon", color: "#ff5a1f" },
    layout: "dashboard",
    customization: { cursor: "skull", trail: "none", overlay: "grain", overlayStrength: 0.1, cardStyle: "torn", corners: "sharp", songSkin: "cassette", textColor: "#ececec", socialStyle: "icons" },
  },
  {
    id: "vhs",
    name: "late night vhs",
    blurb: "be kind, rewind",
    colors: { backgroundColor: "#0e0820", primaryColor: "#ff4fd8", secondaryColor: "#3ad6ff", accentColor: "#f5f57a" },
    fontFamily: "Space Mono",
    headingFont: "Monoton",
    fontWeight: "400",
    effect: { type: "glitch", color: "#ff4fd8", color2: "#3ad6ff" },
    layout: "spotlight",
    customization: { cursor: "crosshair", trail: "comet", overlay: "scanlines", overlayStrength: 0.12, cardStyle: "glass", corners: "sharp", songSkin: "vinyl", textColor: "", socialStyle: "icons" },
  },
  {
    id: "cathedral",
    name: "cathedral",
    blurb: "candle wax and blackletter",
    colors: { backgroundColor: "#09080b", primaryColor: "#b3122e", secondaryColor: "#3a0f17", accentColor: "#d9c7a0" },
    fontFamily: "Cormorant Garamond",
    headingFont: "UnifrakturMaguntia",
    fontWeight: "500",
    effect: { type: "glow", color: "#b3122e" },
    layout: "MINIMAL",
    customization: { cursor: "skull", trail: "none", overlay: "grain", overlayStrength: 0.07, cardStyle: "solid", corners: "sharp", songSkin: "vinyl", textColor: "#d9c7a0", socialStyle: "off" },
  },
  {
    id: "overworld",
    name: "overworld",
    blurb: "mined by hand",
    colors: { backgroundColor: "#1c1812", primaryColor: "#6cbb3c", secondaryColor: "#8b5a2b", accentColor: "#5decf5" },
    fontFamily: "VT323",
    headingFont: "Press Start 2P",
    fontWeight: "400",
    effect: { type: "retro", color: "#3f2a14" },
    layout: "dashboard",
    customization: { cursor: "pickaxe", trail: "pixels", overlay: "none", cardStyle: "pixel", corners: "sharp", songSkin: "ipod", textColor: "", socialStyle: "badges" },
  },
  {
    id: "chrome",
    name: "y2k chrome",
    blurb: "frosted, shiny, dial-up",
    colors: { backgroundColor: "#0d1117", primaryColor: "#9fd8ff", secondaryColor: "#c3cad4", accentColor: "#ff8ad8" },
    fontFamily: "Outfit",
    headingFont: "Michroma",
    fontWeight: "400",
    effect: { type: "chrome" },
    layout: "dashboard",
    customization: { cursor: "default", trail: "bubbles", overlay: "none", cardStyle: "glass", corners: "round", songSkin: "ipod", textColor: "", socialStyle: "badges" },
  },
  {
    id: "bedroom-pop",
    name: "bedroom pop",
    blurb: "fairy lights and voice memos",
    colors: { backgroundColor: "#f8e9ef", primaryColor: "#d94f80", secondaryColor: "#7a6cff", accentColor: "#ffb547" },
    fontFamily: "DM Sans",
    headingFont: "Caveat",
    fontWeight: "400",
    effect: { type: "typewriter" },
    layout: "scrapbook",
    customization: { cursor: "heart", trail: "hearts", overlay: "halftone", overlayStrength: 0.06, cardStyle: "sticker", corners: "round", songSkin: "cassette", textColor: "#3a2a33", socialStyle: "badges" },
  },
  {
    id: "terminal",
    name: "terminal",
    blurb: "> whoami",
    colors: { backgroundColor: "#050805", primaryColor: "#38ff7a", secondaryColor: "#1a7f3c", accentColor: "#b6ff3b" },
    fontFamily: "JetBrains Mono",
    headingFont: "VT323",
    fontWeight: "400",
    effect: { type: "typewriter" },
    layout: "sidebar",
    customization: { cursor: "crosshair", trail: "pixels", overlay: "scanlines", overlayStrength: 0.08, cardStyle: "outline", corners: "sharp", songSkin: "winamp", textColor: "#9dffb4", socialStyle: "icons" },
  },
  {
    id: "sunset-tape",
    name: "sunset tape",
    blurb: "warm, hazy, on repeat",
    colors: { backgroundColor: "#1d0f24", primaryColor: "#ff7a59", secondaryColor: "#ff3d7f", accentColor: "#ffc857" },
    fontFamily: "Outfit",
    headingFont: "Syne",
    fontWeight: "500",
    effect: { type: "gradient", color: "#ffc857", color2: "#ff7a59", color3: "#ff3d7f", speed: 8 },
    layout: "spotlight",
    customization: { cursor: "default", trail: "comet", overlay: "grain", overlayStrength: 0.06, cardStyle: "solid", corners: "round", songSkin: "cassette", textColor: "", socialStyle: "badges" },
  },
  {
    id: "clean-slate",
    name: "clean slate",
    blurb: "white space, nothing extra",
    colors: { backgroundColor: "#f4f4f1", primaryColor: "#111111", secondaryColor: "#8a8a8a", accentColor: "#2f6bff" },
    fontFamily: "Inter",
    headingFont: "Instrument Serif",
    fontWeight: "400",
    effect: { type: "" },
    layout: "MINIMAL",
    customization: { cursor: "default", trail: "none", overlay: "none", cardStyle: "outline", corners: "soft", songSkin: "metro", textColor: "#111111", socialStyle: "icons" },
  },
];
