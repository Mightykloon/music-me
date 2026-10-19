"use client";

import { useId } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

// A tile's fill with an icon hole-punched through it: the icon is a mask, not
// a drawing, so whatever sits behind the tile (the halftone backdrop, the page)
// shows through it. Uses Phosphor's solid ("fill") icons, which cut out
// cleanly. Fills the nearest positioned ancestor; put it on a face with
// `isolate` so the face's text stays on top.
export function PunchedFill({
  icon: Icon,
  fill,
  size,
  inset = 12,
}: {
  icon: PhosphorIcon;
  fill: string; // any CSS colour, e.g. "var(--muted)"
  size: number; // icon size in px
  inset?: number; // distance from the tile's top-left corner, in px
}) {
  const id = `punch-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  return (
    <svg aria-hidden className="absolute inset-0 -z-10 h-full w-full">
      <defs>
        <mask id={id}>
          {/* white keeps the fill, black cuts it away */}
          <rect width="100%" height="100%" fill="white" />
          <Icon x={inset} y={inset} size={size} weight="fill" color="black" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={fill} mask={`url(#${id})`} />
    </svg>
  );
}
