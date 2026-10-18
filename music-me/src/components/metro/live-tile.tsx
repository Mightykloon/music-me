"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tilt } from "./tilt";

export type TileFace = {
  // the big content of the face (icon, number, image…)
  body: React.ReactNode;
  // the small lowercase label in the bottom-left corner
  label?: string;
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
}: {
  faces: TileFace[];
  className?: string;
  style?: React.CSSProperties;
  interval?: number;
  // stagger so a grid of tiles doesn't flip in unison
  offset?: number;
}) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (faces.length < 2 || reduced) return;
    let timer: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      setI((n) => (n + 1) % faces.length);
      timer = setInterval(() => setI((n) => (n + 1) % faces.length), interval);
    }, interval + offset);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [faces.length, interval, offset, reduced]);

  const face = faces[i];

  return (
    <Tilt className={cn("relative overflow-hidden bg-primary text-white", className)}>
      <div style={{ perspective: 800, ...style }} className="absolute inset-0">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={i}
            className="absolute inset-0 p-3 flex flex-col"
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
