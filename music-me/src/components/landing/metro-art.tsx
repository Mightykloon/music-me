// Frutiger Metro artwork: black vectors over a bright, striated background
// in the visitor's accent colour (the look of the mid-2000s iPod silhouette
// ads and Zune/Xbox 360 era art). Original vector drawing; recolours itself
// from --metro-accent. Layers, back to front: stripes → sunburst → halftone,
// ripples and bubbles → ribbons and flourishes → record, headphones, notes →
// a full-width visualiser whose bars run off the bottom edge.

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

// visualiser: 30 bars across the full width, taller toward the middle-left
const VIS = Array.from({ length: 30 }, (_, i) => {
  const wave = Math.sin(i * 0.55) * 0.5 + Math.sin(i * 1.7 + 1) * 0.3 + 0.9;
  return Math.round(34 + wave * 58 + (i % 3) * 9);
});

// halftone: a triangle of dots that shrink toward the corner
const HALFTONE: Array<[number, number, number]> = [];
for (let r = 0; r < 7; r++) {
  for (let c = 0; c < 9 - r; c++) {
    HALFTONE.push([600 - 18 - c * 22, 18 + r * 22, Math.max(1.2, 7.5 - (c + r) * 0.75)]);
  }
}

const BUBBLES: Array<[number, number, number]> = [
  [70, 330, 18], [118, 296, 8], [512, 250, 22], [560, 300, 10], [300, 196, 9], [470, 92, 13], [40, 140, 7],
];

const NOTES: Array<[number, number, number, number]> = [
  // x, y, scale, rotation
  [500, 210, 1, 12],
  [86, 236, 0.75, -10],
  [322, 140, 0.6, 6],
];

export function MetroArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 600"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Black silhouettes of headphones, a vinyl record, music notes and a pulsing visualiser over bright stripes"
    >
      {/* background: accent colour, striated */}
      <rect width="600" height="600" fill="var(--metro-accent)" />
      <g transform="rotate(-14 300 300)">
        {BANDS.map((b) => (
          <rect key={b.y} x="-200" y={b.y} width="1000" height={b.h} fill="#fff" opacity={b.o} />
        ))}
      </g>

      {/* sunburst behind the record */}
      <g transform="translate(410 400)" opacity="0.16">
        {RAYS.map((i) => (
          <polygon key={i} points="0,0 -16,-460 16,-460" fill="#fff" transform={`rotate(${(i * 360) / RAYS.length})`} />
        ))}
      </g>

      {/* halftone dots, top-right */}
      <g fill="#000" opacity="0.28">
        {HALFTONE.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>

      {/* speaker-cone ripples behind the headphones */}
      <g transform="translate(170 270)" fill="none" stroke="#fff" strokeOpacity="0.22">
        {[60, 92, 126, 164, 206].map((r, i) => (
          <circle key={r} r={r} strokeWidth={6 - i} />
        ))}
      </g>

      {/* bubbles */}
      {BUBBLES.map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill="#fff" fillOpacity="0.12" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
          <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.22} fill="#fff" fillOpacity="0.6" />
        </g>
      ))}

      {/* sweeping ribbons */}
      <path d="M-20 92 C 120 40, 240 150, 380 96 S 560 30, 640 70 L 640 80 C 560 46, 470 120, 380 120 S 140 70, -20 104 Z" fill="#000" opacity="0.85" />
      <path d="M-20 470 C 120 400, 250 520, 400 440 S 600 360, 640 300 L 640 322 C 610 380, 520 440, 410 468 S 150 450, -20 496 Z" fill="#000" />

      {/* flourishes: curling vector swirls, top-left and right */}
      <g fill="none" stroke="#000" strokeLinecap="round">
        <path d="M24 196 C 24 150, 80 140, 96 172 C 108 196, 84 214, 68 202 C 56 192, 66 178, 76 184" strokeWidth="6" />
        <path d="M96 172 C 120 120, 190 116, 214 150" strokeWidth="4" />
        <path d="M214 150 C 228 170, 258 166, 262 146 C 264 132, 250 126, 242 134" strokeWidth="3" />
        <path d="M600 150 C 560 150, 548 196, 574 210 C 592 220, 604 202, 594 192" strokeWidth="5" />
      </g>

      {/* vinyl record */}
      <g transform="translate(410 400)">
        <circle r="150" fill="#000" />
        {[138, 124, 110, 96, 82, 68].map((r) => (
          <circle key={r} r={r} fill="none" stroke="#fff" strokeOpacity="0.09" strokeWidth="1.5" />
        ))}
        <circle r="46" fill="var(--metro-accent)" />
        <circle r="46" fill="#fff" opacity="0.18" />
        <circle r="6" fill="#000" />
        <path d="M-118 -60 A 132 132 0 0 1 -40 -126" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* headphones */}
      <g transform="translate(205 300) rotate(-16)">
        <path d="M-118 20 A 118 118 0 0 1 118 20" fill="none" stroke="#000" strokeWidth="26" strokeLinecap="round" />
        <path d="M-96 18 A 96 96 0 0 1 96 18" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="5" strokeLinecap="round" />
        <rect x="-152" y="8" width="66" height="112" rx="26" fill="#000" />
        <rect x="86" y="8" width="66" height="112" rx="26" fill="#000" />
        <rect x="-138" y="24" width="10" height="80" rx="5" fill="#fff" opacity="0.2" />
      </g>

      {/* music notes */}
      {NOTES.map(([x, y, s, rot]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} fill="#000">
          <ellipse cx="-16" cy="30" rx="15" ry="11" transform="rotate(-22 -16 30)" />
          <ellipse cx="28" cy="20" rx="15" ry="11" transform="rotate(-22 28 20)" />
          <rect x="-4" y="-34" width="6" height="64" />
          <rect x="40" y="-44" width="6" height="64" />
          <polygon points="-4,-34 46,-44 46,-30 -4,-20" />
        </g>
      ))}

      {/* sparkles */}
      {[
        [96, 190, 1],
        [540, 150, 0.7],
        [300, 64, 0.55],
        [252, 236, 0.45],
        [570, 420, 0.5],
        [20, 400, 0.6],
      ].map(([x, y, s]) => (
        <path
          key={`${x}-${y}`}
          d="M0 -22 C 3 -6, 6 -3, 22 0 C 6 3, 3 6, 0 22 C -3 6, -6 3, -22 0 C -6 -3, -3 -6, 0 -22 Z"
          fill="#000"
          transform={`translate(${x} ${y}) scale(${s})`}
        />
      ))}

      {/* visualiser: full width, bars run off the bottom edge */}
      <g>
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
      </g>
    </svg>
  );
}
