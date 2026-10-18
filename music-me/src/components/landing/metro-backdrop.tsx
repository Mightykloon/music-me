import type { CSSProperties } from "react";
import { ArtMask, type ArtName } from "./art-mask";

// The panorama's background layer: the traced artwork, drawn faintly and
// spread wide, so it drifts behind the panels at its own (slower) speed, like
// a Windows Phone panorama background image. Pieces alternate between the
// text colour and the accent, high and low, at different scales and angles;
// halftone dot fields fill the gaps between them.

const TEXT = "currentColor";
const ACCENT = "var(--metro-accent)";

type Piece = { art: ArtName; color: string; opacity: number; className: string; turn?: number; flip?: boolean };

// positions are % of the backdrop: 1.4 screens wide, which is all of it
// that ever comes into view at the backdrop's slow scroll speed
const PIECES: Piece[] = [
  { art: "splashRings", color: ACCENT, opacity: 0.1, className: "bottom-[-10%] left-[-2%] h-[42%]", turn: -12 },
  { art: "city", color: TEXT, opacity: 0.045, className: "top-[4%] left-[17%] h-[34%]", turn: 8 },
  { art: "ringsSplash", color: TEXT, opacity: 0.06, className: "bottom-[0%] left-[27%] h-[34%]", flip: true },
  { art: "speakersHaze", color: TEXT, opacity: 0.08, className: "top-[10%] left-[37%] h-[46%]" },
  { art: "dancer", color: ACCENT, opacity: 0.12, className: "bottom-[-6%] left-[50%] h-[46%]", flip: true },
  { art: "splashRings", color: TEXT, opacity: 0.06, className: "top-[-8%] left-[61%] h-[40%]", turn: 18 },
  { art: "city", color: TEXT, opacity: 0.06, className: "bottom-[-12%] left-[70%] h-[62%]" },
  { art: "ringsSplash", color: ACCENT, opacity: 0.12, className: "top-[4%] left-[83%] h-[40%]", turn: -8 },
  { art: "speakersInk", color: TEXT, opacity: 0.07, className: "bottom-[4%] left-[90%] h-[36%]", flip: true },
];

// halftone dot fields, each fading out from its centre
const DOTS: { className: string; color: string; size: number; opacity: number }[] = [
  { className: "top-[2%] left-[6%] h-[38%] w-[14%]", color: TEXT, size: 9, opacity: 0.09 },
  { className: "bottom-[6%] left-[20%] h-[40%] w-[12%]", color: ACCENT, size: 12, opacity: 0.18 },
  { className: "top-[26%] left-[44%] h-[46%] w-[12%]", color: ACCENT, size: 10, opacity: 0.16 },
  { className: "top-[40%] left-[62%] h-[42%] w-[10%]", color: TEXT, size: 8, opacity: 0.1 },
  { className: "top-[30%] left-[78%] h-[50%] w-[13%]", color: TEXT, size: 11, opacity: 0.08 },
];

function pieceStyle(p: Piece): CSSProperties {
  const t = [p.turn ? `rotate(${p.turn}deg)` : "", p.flip ? "scaleX(-1)" : ""].join(" ").trim();
  return { opacity: p.opacity, transform: t || undefined };
}

export function MetroBackdrop({ className }: { className?: string }) {
  return (
    <div className={className}>
      {DOTS.map((d, i) => (
        <div
          key={i}
          className={`absolute ${d.className}`}
          style={{
            opacity: d.opacity,
            backgroundImage: `radial-gradient(${d.color} 28%, transparent 30%)`,
            backgroundSize: `${d.size}px ${d.size}px`,
            maskImage: "radial-gradient(closest-side, #000 20%, transparent)",
            WebkitMaskImage: "radial-gradient(closest-side, #000 20%, transparent)",
          }}
        />
      ))}
      {PIECES.map((p, i) => (
        <ArtMask key={i} art={p.art} color={p.color} className={`absolute ${p.className}`} style={pieceStyle(p)} />
      ))}
    </div>
  );
}

// Film grain over the whole panorama: fractal noise, tiled, barely there.
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
)}")`;

export function MetroGrain({ className }: { className?: string }) {
  return <div aria-hidden className={className} style={{ backgroundImage: GRAIN, opacity: 0.06 }} />;
}
