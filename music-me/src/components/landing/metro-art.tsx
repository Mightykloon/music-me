import { ArtMask } from "./art-mask";

// Frutiger Metro hero artwork: a black silhouette over a bright, striated
// background in the visitor's accent colour (the look of mid-2000s iPod
// silhouette ads and Zune era art). One focal point, the dancer, with the
// sunburst centred on them and the visualiser rising from the bottom edge.

// where the sunburst radiates from (the dancer's torso), in the 600 x 600 box
const FOCUS = { x: 270, y: 250 };

const RAYS = Array.from({ length: 16 }, (_, i) => i);
const BANDS = [
  { y: 40, h: 26, o: 0.16 },
  { y: 92, h: 10, o: 0.22 },
  { y: 128, h: 44, o: 0.1 },
  { y: 214, h: 14, o: 0.24 },
  { y: 262, h: 30, o: 0.12 },
  { y: 330, h: 8, o: 0.26 },
  { y: 372, h: 52, o: 0.09 },
  { y: 470, h: 18, o: 0.2 },
  { y: 520, h: 36, o: 0.12 },
];

// visualiser: 30 bars across the full width, bars run off the bottom edge
const VIS = Array.from({ length: 30 }, (_, i) => {
  const wave = Math.sin(i * 0.55) * 0.5 + Math.sin(i * 1.7 + 1) * 0.3 + 0.9;
  return Math.round(28 + wave * 50 + (i % 3) * 8);
});

export function MetroArt({ className }: { className?: string }) {
  return (
    <div className={className} role="img" aria-label="A black silhouette of a dancer leaping out of an ink splash and rings, over bright stripes and a sunburst">
      {/* background: accent colour, striated, with a sunburst */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="600" height="600" fill="var(--metro-accent)" />
        <g transform="rotate(-14 300 300)">
          {BANDS.map((b) => (
            <rect key={b.y} x="-200" y={b.y} width="1000" height={b.h} fill="#fff" opacity={b.o} />
          ))}
        </g>
        <g transform={`translate(${FOCUS.x} ${FOCUS.y})`} opacity="0.15">
          {RAYS.map((i) => (
            <polygon key={i} points="0,0 -16,-480 16,-480" fill="#fff" transform={`rotate(${(i * 360) / RAYS.length})`} />
          ))}
        </g>
      </svg>

      {/* focal point: the dancer, sitting just above the visualiser */}
      <ArtMask art="dancer" color="#000" className="absolute left-[8%] top-[5%] w-[86%]" />

      {/* visualiser, in front, sinking off the bottom */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {VIS.map((h, i) => (
          <rect
            key={i}
            className="metro-eq-bar"
            x={4 + i * 20}
            y={600 - h}
            width="14"
            height={h + 40}
            fill="#000"
            style={{ animationDelay: `${(i * 173) % 1100}ms`, animationDuration: `${780 + ((i * 97) % 420)}ms` }}
          />
        ))}
      </svg>
    </div>
  );
}
