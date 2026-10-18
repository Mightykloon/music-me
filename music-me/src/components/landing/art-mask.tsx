import type { CSSProperties } from "react";

// Licensed artwork, traced to single colour SVGs in public/art. Each one is
// drawn as a CSS mask over a solid fill, so the same file can be black, the
// visitor's accent colour, or the text colour without shipping copies.
export const ART = {
  dancer: { src: "/art/dancer.svg", w: 3000, h: 2820 },
  headphones: { src: "/art/headphones.svg", w: 2132, h: 3000 },
  splashRings: { src: "/art/splash-rings.svg", w: 3000, h: 2583 },
  ringsSplash: { src: "/art/rings-splash.svg", w: 3000, h: 2121 },
  city: { src: "/art/city.svg", w: 3000, h: 2937 },
  speakersHaze: { src: "/art/speakers-haze.svg", w: 2250, h: 1731 },
  speakersPaint: { src: "/art/speakers-paint.svg", w: 2250, h: 1731 },
  speakersInk: { src: "/art/speakers-ink.svg", w: 2250, h: 1731 },
} as const;

export type ArtName = keyof typeof ART;

// A halftone screen tile: CELLS x CELLS dots at the given pitch, each with its
// own radius from a smooth wobble, so the dots vary in size like a real print
// instead of forming a uniform grid.
const CELLS = 12;
function halftoneTile(pitch: number) {
  let dots = "";
  for (let y = 0; y < CELLS; y++) {
    for (let x = 0; x < CELLS; x++) {
      const t = (Math.sin(x * 0.9 + y * 0.4) + Math.sin(y * 1.3 - x * 0.5 + 2) + Math.sin((x + y) * 2.1)) / 3; // -1..1
      const r = pitch * (0.24 + 0.16 * t);
      dots += `<circle cx="${(x + 0.5) * pitch}" cy="${(y + 0.5) * pitch}" r="${r.toFixed(2)}"/>`;
    }
  }
  const size = CELLS * pitch;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${dots}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / ${size}px ${size}px`;
}

export function ArtMask({
  art,
  color = "currentColor",
  halftone,
  className,
  style,
}: {
  art: ArtName;
  color?: string;
  /** draw the art as a halftone: a dot screen at this pitch (px), intersected with the art */
  halftone?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const { src, w, h } = ART[art];
  const shape = `url(${src}) center / contain no-repeat`;
  const mask = halftone ? `${shape}, ${halftoneTile(halftone)}` : shape;
  return (
    <div
      aria-hidden
      className={className}
      style={{
        aspectRatio: `${w} / ${h}`,
        backgroundColor: color,
        mask,
        WebkitMask: mask,
        // keep only the dots that fall inside the art
        ...(halftone ? { maskComposite: "intersect", WebkitMaskComposite: "source-in" } : null),
        ...style,
      }}
    />
  );
}
