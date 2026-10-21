"use client";

import { useEffect, useRef } from "react";
import type { Customization } from "@/lib/profile/customization";

/** Texture laid over the whole profile (grain, scanlines, glitter...). Never catches clicks. */
export function ProfileOverlay({ overlay, strength }: { overlay: Customization["overlay"]; strength: number }) {
  if (overlay === "none") return null;
  return (
    <div
      aria-hidden
      className={`profile-overlay profile-overlay-${overlay} pointer-events-none fixed inset-0 z-40`}
      style={{ opacity: strength }}
    />
  );
}

const TRAIL_GLYPHS: Record<Exclude<Customization["trail"], "none">, string[]> = {
  sparkle: ["✦", "✧", "·", "✶"],
  stars: ["★", "☆"],
  hearts: ["♥", "♡"],
  pixels: ["■", "▪"],
};

/**
 * Little glyphs that follow the pointer. Throttled, capped at a handful on
 * screen, and off entirely for people who prefer reduced motion or are on a
 * touch screen (no pointer to follow). In the editor preview a transformed
 * wrapper makes `fixed` mean "fixed to the preview", so the layer works there too.
 */
export function CursorTrail({ trail, color }: { trail: Customization["trail"]; color: string }) {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trail === "none") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = layer.current;
    if (!el) return;
    const glyphs = TRAIL_GLYPHS[trail];
    let last = 0;
    let n = 0;

    const onMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - last < 45 || el.childElementCount > 14) return;
      last = now;
      const rect = el.getBoundingClientRect();
      const s = document.createElement("span");
      s.className = "profile-trail-dot";
      s.textContent = glyphs[n++ % glyphs.length];
      s.style.left = `${ev.clientX - rect.left}px`;
      s.style.top = `${ev.clientY - rect.top}px`;
      s.style.color = color;
      s.style.setProperty("--drift", `${(Math.random() - 0.5) * 30}px`);
      s.addEventListener("animationend", () => s.remove(), { once: true });
      el.appendChild(s);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [trail, color]);

  if (trail === "none") return null;
  return <div ref={layer} aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden" />;
}
