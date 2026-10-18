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

export function ArtMask({
  art,
  color = "currentColor",
  halftone,
  className,
  style,
}: {
  art: ArtName;
  color?: string;
  /** draw the art as a halftone: a dot grid at this pitch (px), intersected with the art */
  halftone?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const { src, w, h } = ART[art];
  const shape = `url(${src}) center / contain no-repeat`;
  const mask = halftone ? `${shape}, radial-gradient(#000 38%, transparent 42%) 0 0 / ${halftone}px ${halftone}px` : shape;
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
