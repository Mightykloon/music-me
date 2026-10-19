"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tilt } from "./tilt";

export type TileFace = {
  // the big content of the face (icon, number, image…)
  body: React.ReactNode;
  // the small lowercase label in the bottom-left corner
  label?: string;
  // this face's own fill, e.g. an outlined front that flips to solid accent
  // (the tile itself is accent unless given another background)
  className?: string;
};

// A Windows Phone live tile: a flat square of colour with a label in the
// bottom-left corner that periodically flips (rotating on its horizontal axis)
// to show its next face.
export function LiveTile({
  faces,
  className,
  style,
  interval = 4200,
  offset = 0,
  hoverFace,
}: {
  faces: TileFace[];
  className?: string;
  style?: React.CSSProperties;
  interval?: number;
  // stagger so a grid of tiles doesn't flip in unison
  offset?: number;
  // flip straight to this face while the pointer is over the tile (the
  // timer pauses meanwhile)
  hoverFace?: number;
}) {
  const [i, setI] = useState(0);
  const [hovered, setHovered] = useState(false);
  const hoveredRef = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (faces.length < 2 || reduced) return;
    let timer: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      const next = () => setI((n) => (hoveredRef.current ? n : (n + 1) % faces.length));
      next();
      timer = setInterval(next, interval);
    }, interval + offset);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [faces.length, interval, offset, reduced]);

  const shown = hovered && hoverFace != null && hoverFace < faces.length ? hoverFace : i;
  const face = faces[shown];
  const hover = (on: boolean) => () => {
    hoveredRef.current = on;
    setHovered(on);
  };

  return (
    <Tilt className={cn("relative overflow-hidden bg-primary text-white", className)}>
      <div
        style={{ perspective: 800, ...style }}
        className="absolute inset-0"
        onPointerEnter={hoverFace != null ? hover(true) : undefined}
        onPointerLeave={hoverFace != null ? hover(false) : undefined}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={shown}
            className={cn("absolute inset-0 p-3 flex flex-col", face.className)}
            initial={reduced ? { opacity: 0 } : { rotateX: -90, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { rotateX: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.3, 1] }}
            style={{ transformOrigin: "50% 50%", backfaceVisibility: "hidden" }}
          >
            <div className="flex-1 min-h-0">{face.body}</div>
            {face.label && <p className="text-sm lowercase leading-none">{face.label}</p>}
          </motion.div>
        </AnimatePresence>
      </div>
    </Tilt>
  );
}
