import type { CSSProperties } from "react";
import { ArtMask, type ArtName } from "./art-mask";

// The panorama's background layer: the traced artwork, drawn faintly and
// spread wide, so it drifts behind the panels at its own (slower) speed, like
// a Windows Phone panorama background image. Pieces alternate between the
// text colour and the accent, high and low, at different scales and angles.
// Each is printed as a halftone (dots at its own pitch) rather than solid.

const TEXT = "currentColor";
const ACCENT = "var(--metro-accent)";

type Piece = { art: ArtName; color: string; opacity: number; className: string; turn?: number; flip?: boolean; dots: number };

// positions are % of the backdrop: 1.4 screens wide, which is all of it
// that ever comes into view at the backdrop's slow scroll speed
// splashRings, city and dancer were traced from images cropped at their
// edges: keep those pieces upright and push the cropped edge off the page,
// so no straight cut line shows.
const PIECES: Piece[] = [
  { art: "ringsSplash", color: TEXT, opacity: 0.12, className: "top-[-8%] left-[-7%] h-[38%]", dots: 4, turn: 20 },
  { art: "speakersInk", color: TEXT, opacity: 0.18, className: "top-[20%] left-[-5%] h-[42%]", dots: 4 },
  { art: "splashRings", color: ACCENT, opacity: 0.22, className: "bottom-[-20%] left-[-4%] h-[52%]", dots: 5 },
  { art: "speakersPaint", color: ACCENT, opacity: 0.24, className: "bottom-[-14%] left-[12%] h-[54%]", dots: 5, flip: true },
  // the cityscape rising behind "mixd" in the title
  { art: "city", color: TEXT, opacity: 0.2, className: "top-[-12%] left-[13%] h-[80%]", dots: 4 },
  { art: "ringsSplash", color: TEXT, opacity: 0.14, className: "bottom-[-10%] left-[29%] h-[40%]", dots: 5, flip: true },
  { art: "speakersHaze", color: TEXT, opacity: 0.22, className: "top-[10%] left-[49%] h-[40%]", dots: 4 },
  { art: "splashRings", color: TEXT, opacity: 0.12, className: "bottom-[-22%] left-[40%] h-[36%]", dots: 4 },
  { art: "dancer", color: ACCENT, opacity: 0.26, className: "bottom-[-8%] left-[50%] h-[56%]", dots: 6, flip: true },
  { art: "splashRings", color: TEXT, opacity: 0.14, className: "top-[-14%] left-[62%] h-[44%]", dots: 4 },
  { art: "city", color: TEXT, opacity: 0.14, className: "bottom-[-12%] left-[70%] h-[66%]", dots: 5 },
  { art: "ringsSplash", color: ACCENT, opacity: 0.26, className: "top-[2%] left-[82%] h-[50%]", dots: 6, turn: -8 },
  { art: "speakersInk", color: TEXT, opacity: 0.18, className: "bottom-[2%] left-[89%] h-[44%]", dots: 4, flip: true },
];

function pieceStyle(p: Piece): CSSProperties {
  const t = [p.turn ? `rotate(${p.turn}deg)` : "", p.flip ? "scaleX(-1)" : ""].join(" ").trim();
  return { opacity: p.opacity, transform: t || undefined };
}

export function MetroBackdrop({ className }: { className?: string }) {
  return (
    <div className={className}>
      {PIECES.map((p, i) => (
        <ArtMask key={i} art={p.art} color={p.color} className={`absolute ${p.className}`} halftone={p.dots} style={pieceStyle(p)} />
      ))}
    </div>
  );
}

