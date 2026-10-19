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

// how far the punched corner text runs past the tile's edges, in em
const BLEED_TOP = 0.08;
const BLEED_RIGHT = 0.1;

// A tile's fill with bold capitals hole-punched out of its top-right corner,
// bleeding off it: the tops of the letters run past the top edge and the last
// letter past the right edge, as if stamped over the corner. `textClassName`
// styles the cut (e.g. "opacity-0 group-hover:opacity-100" to punch it only
// on hover).
export function PunchedCornerText({
  text,
  fill,
  size = 17,
  textClassName,
  frameOnHover = false,
}: {
  text: string;
  fill: string;
  size?: number; // font size in px
  textClassName?: string;
  frameOnHover?: boolean;
}) {
  const id = `punch-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  return (
    <svg aria-hidden className="absolute inset-0 -z-10 h-full w-full">
      <defs>
        <mask id={id}>
          <rect width="100%" height="100%" fill="white" />
          {/* Capitals all share one height, so every letter reaches the edge.
              Hanging from the top, pulled up by the space Segoe UI leaves above
              its capitals (0.37em; Open Sans 0.34em) plus the bleed; anchored
              at the right edge and pushed past it by the bleed. */}
          <text
            x="100%"
            dx={size * BLEED_RIGHT}
            y={-size * (0.37 + BLEED_TOP)}
            textAnchor="end"
            dominantBaseline="text-before-edge"
            fontSize={size}
            fontWeight={800}
            letterSpacing="0.04em"
            fill="black"
            className={textClassName}
            style={{ fontFamily: "var(--metro-font)", transition: "opacity 150ms" }}
          >
            {text.toUpperCase()}
          </text>
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        {/* the fill; with `frameOnHover` it pulls in on hover, leaving a gap
            inside a thin frame in the same colour. The text is cut through
            both, so the frame looks punched too. (Needs a `group` ancestor.) */}
        <rect
          fill={fill}
          className={
            frameOnHover
              ? "[height:100%] [width:100%] [x:0px] [y:0px] transition-all duration-200 group-hover:[height:calc(100%_-_12px)] group-hover:[width:calc(100%_-_12px)] group-hover:[x:6px] group-hover:[y:6px] group-focus-visible:[height:calc(100%_-_12px)] group-focus-visible:[width:calc(100%_-_12px)] group-focus-visible:[x:6px] group-focus-visible:[y:6px]"
              : "[height:100%] [width:100%]"
          }
        />
        {frameOnHover && (
          <rect
            fill="none"
            stroke={fill}
            strokeWidth={2}
            className="[height:calc(100%_-_2px)] [width:calc(100%_-_2px)] [x:1px] [y:1px] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        )}
      </g>
    </svg>
  );
}
