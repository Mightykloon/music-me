"use client";

import { useId } from "react";
import { ArrowFatRight, type Icon as PhosphorIcon } from "@phosphor-icons/react";

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

// A tile's fill with bold text hole-punched out of its top-right corner, the
// tops of the letters touching the tile's top edge. With `arrow`, a short
// thick arrow follows the text and its point runs off the tile's right edge.
// `textClassName` styles the cut (e.g. "opacity-0 group-hover:opacity-100"
// to punch it only on hover).
export function PunchedCornerText({
  text,
  fill,
  size = 17,
  inset = 12,
  arrow = false,
  textClassName,
}: {
  text: string;
  fill: string;
  size?: number; // font size in px
  inset?: number; // distance from the right edge, in px (without an arrow)
  arrow?: boolean;
  textClassName?: string;
}) {
  const id = `punch-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  // Phosphor's ArrowFatRight (fill), a short thick block arrow, spans x 32..240
  // of its 256 box and is centred vertically. Its point lands 2px past the
  // right edge, so it bleeds off the tile.
  const arrowSize = Math.round(size * 0.9);
  const arrowX = -arrowSize * (240 / 256) + 2;
  const arrowLeft = arrowX + arrowSize * (32 / 256);
  // the arrow sits on the middle of the lowercase letters (x-height centre)
  const arrowY = size * 0.4 - arrowSize / 2;
  const style = { fontFamily: "var(--metro-font)", transition: "opacity 150ms" };
  return (
    <svg aria-hidden className="absolute inset-0 -z-10 h-full w-full">
      <defs>
        <mask id={id}>
          <rect width="100%" height="100%" fill="white" />
          {/* hanging from the top edge; pulled up by the space Segoe UI / Open Sans
              leave above their ascenders (~0.34em), so the letters meet the edge */}
          <text
            x="100%"
            dx={arrow ? arrowLeft - size * 0.2 : -inset}
            y={-size * 0.34}
            textAnchor="end"
            dominantBaseline="text-before-edge"
            fontSize={size}
            fontWeight={800}
            fill="black"
            className={textClassName}
            style={style}
          >
            {text}
          </text>
          {arrow && (
            // origin at the tile's right edge; overflow lets the point run past it
            <svg x="100%" y="0" overflow="visible" className={textClassName} style={style}>
              <ArrowFatRight x={arrowX} y={arrowY} size={arrowSize} weight="fill" color="black" />
            </svg>
          )}
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={fill} mask={`url(#${id})`} />
    </svg>
  );
}
