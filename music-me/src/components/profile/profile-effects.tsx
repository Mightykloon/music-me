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

type Trail = Exclude<Customization["trail"], "none">;

// Each trail behaves differently, not just a different glyph:
//   sparkle - twinkles where you were, flaring and fading in place
//   stars   - tumbles down with gravity, spinning
//   hearts  - floats up and sways like a balloon
//   bubbles - rises slowly and pops
//   pixels  - snaps to a grid and shrinks away, like a snake
//   comet   - a smooth glowing streak drawn on a canvas
const GLYPHS: Record<Exclude<Trail, "comet">, string[]> = {
  sparkle: ["✦", "✧", "✶", "⋆"],
  stars: ["★", "☆"],
  hearts: ["♥", "❤", "♡"],
  bubbles: [""],
  pixels: [""],
};
const GAP_MS: Record<Exclude<Trail, "comet">, number> = { sparkle: 40, stars: 70, hearts: 110, bubbles: 120, pixels: 25 };
const MAX_ALIVE = 24;

/**
 * Something that follows the pointer. Throttled and capped, and off entirely
 * for people who prefer reduced motion or are on a touch screen. In the editor
 * preview a transformed wrapper makes `fixed` mean "fixed to the preview", so
 * the layer works there too.
 */
export function CursorTrail({ trail, color }: { trail: Customization["trail"]; color: string }) {
  const layer = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (trail === "none") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    if (trail === "comet") {
      const c = canvas.current;
      const ctx = c?.getContext("2d");
      if (!c || !ctx) return;
      const points: { x: number; y: number; t: number }[] = [];
      let frame = 0;
      const resize = () => {
        const r = c.getBoundingClientRect();
        c.width = r.width * devicePixelRatio;
        c.height = r.height * devicePixelRatio;
      };
      resize();
      const onMove = (ev: PointerEvent) => {
        const r = c.getBoundingClientRect();
        points.push({ x: ev.clientX - r.left, y: ev.clientY - r.top, t: performance.now() });
        if (!frame) frame = requestAnimationFrame(draw);
      };
      const draw = () => {
        const now = performance.now();
        while (points.length && now - points[0].t > 350) points.shift();
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.lineCap = "round";
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        for (let i = 1; i < points.length; i++) {
          const life = 1 - (now - points[i].t) / 350;
          ctx.strokeStyle = color;
          ctx.globalAlpha = Math.max(0, life);
          ctx.lineWidth = 1 + 5 * life;
          ctx.beginPath();
          ctx.moveTo(points[i - 1].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
          ctx.stroke();
        }
        frame = points.length ? requestAnimationFrame(draw) : 0;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("resize", resize);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(frame);
      };
    }

    const el = layer.current;
    if (!el) return;
    const glyphs = GLYPHS[trail];
    let last = 0;
    let n = 0;
    const onMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - last < GAP_MS[trail] || el.childElementCount > MAX_ALIVE) return;
      last = now;
      const rect = el.getBoundingClientRect();
      let x = ev.clientX - rect.left;
      let y = ev.clientY - rect.top;
      if (trail === "pixels") {
        x = Math.round(x / 10) * 10;
        y = Math.round(y / 10) * 10;
      }
      if (trail === "sparkle") {
        x += (Math.random() - 0.5) * 18;
        y += (Math.random() - 0.5) * 18;
      }
      const s = document.createElement("span");
      s.className = `profile-trail profile-trail-${trail}`;
      s.textContent = glyphs[n++ % glyphs.length];
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.color = color;
      s.style.setProperty("--drift", `${(Math.random() - 0.5) * 40}px`);
      s.style.setProperty("--spin", `${(Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360)}deg`);
      s.style.setProperty("--size", `${0.7 + Math.random() * 0.6}`);
      s.addEventListener("animationend", () => s.remove(), { once: true });
      el.appendChild(s);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [trail, color]);

  if (trail === "none") return null;
  if (trail === "comet") return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
  return <div ref={layer} aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden" />;
}
