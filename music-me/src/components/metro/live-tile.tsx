"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tilt } from "./tilt";

export type TileFace = {
  // the big content of the face (icon, number, image…)
  body: React.ReactNode;
  // the small lowercase label in the bottom-left corner
  label?: React.ReactNode;
  // this face's own fill and text colour (accent with white text by default),
  // e.g. an outlined front that flips to solid accent
  className?: string;
};

// The hover look for a tile's back face: solid accent normally, one smooth
// accent outline with nothing inside while the tile is hovered. The border is
// always there (transparent) so the content doesn't shift. Needs a `group`
// on the tile or an ancestor.
export const HOVER_OUTLINE =
  "border-2 border-transparent transition-colors duration-200 group-hover:bg-transparent group-hover:border-primary group-hover:text-foreground";

// The card: two sides back to back. Each flip turns it half a turn on its
// horizontal axis, and the side coming round is filled with the next face
// while it's still facing away.
type Card = { turns: number; sides: [number, number] };
const flipTo = (card: Card, face: number): Card => {
  if (card.sides[card.turns % 2] === face) return card;
  const sides: [number, number] = [...card.sides];
  sides[(card.turns + 1) % 2] = face;
  return { turns: card.turns + 1, sides };
};

const FLIP = { duration: 0.75, ease: [0.45, 0.05, 0.2, 1] as const };

// A Windows Phone live tile: a flat square of colour with a label in the
// bottom-left corner that periodically flips over, like a card, to show its
// next face.
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
  // timer pauses meanwhile, and it flips back on leaving)
  hoverFace?: number;
}) {
  const [card, setCard] = useState<Card>({ turns: 0, sides: [0, faces.length > 1 ? 1 : 0] });
  const hoveredRef = useRef(false);
  const beforeHover = useRef(0);
  const reduced = useReducedMotion();
  const [scope, animate] = useAnimate();
  const showing = card.sides[card.turns % 2];

  useEffect(() => {
    if (faces.length < 2 || reduced) return;
    let timer: ReturnType<typeof setInterval>;
    const next = () =>
      setCard((c) => (hoveredRef.current ? c : flipTo(c, (c.sides[c.turns % 2] + 1) % faces.length)));
    const start = setTimeout(() => {
      next();
      timer = setInterval(next, interval);
    }, interval + offset);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [faces.length, interval, offset, reduced]);

  // While it turns, the card blurs a touch, darkens as it goes edge-on (the
  // way light catches a turning card) and dips slightly, all peaking mid-flip.
  useEffect(() => {
    if (card.turns === 0 || reduced || !scope.current) return;
    animate(
      scope.current,
      {
        filter: ["blur(0px) brightness(1)", "blur(1.6px) brightness(0.7)", "blur(0px) brightness(1)"],
        scale: [1, 0.96, 1],
      },
      FLIP
    );
  }, [card.turns, reduced, animate, scope]);

  const onEnter = () => {
    if (hoverFace == null || hoverFace >= faces.length) return;
    hoveredRef.current = true;
    beforeHover.current = showing;
    setCard((c) => flipTo(c, hoverFace));
  };
  const onLeave = () => {
    if (hoverFace == null || !hoveredRef.current) return;
    hoveredRef.current = false;
    setCard((c) => flipTo(c, beforeHover.current));
  };

  const side = (slot: 0 | 1) => {
    const face = faces[card.sides[slot]];
    return (
      <div
        aria-hidden={card.turns % 2 !== slot}
        className={cn("absolute inset-0 flex flex-col p-3 bg-primary text-white", face.className)}
        style={{ backfaceVisibility: "hidden", transform: slot ? "rotateX(180deg)" : undefined }}
      >
        <div className="flex-1 min-h-0">{face.body}</div>
        {face.label && <p className="text-sm lowercase leading-none">{face.label}</p>}
      </div>
    );
  };

  return (
    <Tilt className={cn("relative", className)}>
      <div
        ref={scope}
        style={{ perspective: 900, ...style }}
        className="absolute inset-0"
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
      >
        {reduced ? (
          // no turning: just show the current face
          <div className="absolute inset-0">{side((card.turns % 2) as 0 | 1)}</div>
        ) : (
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
            initial={false}
            animate={{ rotateX: -card.turns * 180 }}
            transition={FLIP}
          >
            {side(0)}
            {side(1)}
          </motion.div>
        )}
      </div>
    </Tilt>
  );
}
