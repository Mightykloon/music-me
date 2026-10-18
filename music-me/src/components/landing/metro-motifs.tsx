// Frutiger Metro motif library: ring clusters with drips, ink splatter,
// halftone discs, stars, star-in-ring badges, tapered flourishes, a wavy
// music staff with notes, and flat speakers. Original vector drawings in the
// style of mid-2000s Metro art, generated from geometry (true spirals,
// tapered strokes, exact stars) so curves stay smooth at any size.
// Each motif returns an SVG <g> to compose inside a parent <svg>.

type Pt = [number, number];

const f = (n: number) => Math.round(n * 10) / 10;

// deterministic random numbers so the art is identical on every render
export function seeded(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ── geometry ─────────────────────────────────────────────────────────────

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps = 40): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

const tangentAt = (pts: Pt[], i: number): Pt => {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
};

// a spiral that starts at `from`, leaving along `dir` (unit tangent), curling
// left (+1) or right (-1) while its radius shrinks from r0 to r1
function spiral(from: Pt, dir: Pt, r0: number, r1: number, turns: number, side: 1 | -1, steps = 80): Pt[] {
  // unit vector from the spiral's centre to the start point
  const u: Pt = side === 1 ? [dir[1], -dir[0]] : [-dir[1], dir[0]];
  const c: Pt = [from[0] - u[0] * r0, from[1] - u[1] * r0];
  const a0 = Math.atan2(u[1], u[0]);
  const out: Pt[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const a = a0 + side * t * turns * Math.PI * 2;
    const r = r0 * Math.pow(r1 / r0, t);
    out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
  }
  return out;
}

// a stroke drawn as a filled outline whose width runs from w0 to w1, like a
// brush or a calligraphic pen: the defining look of vector flourishes
function taper(pts: Pt[], w0: number, w1: number, ease = 1): string {
  const left: Pt[] = [], right: Pt[] = [];
  pts.forEach((p, i) => {
    const t = Math.pow(i / (pts.length - 1), ease);
    const w = (w0 + (w1 - w0) * t) / 2;
    const [tx, ty] = tangentAt(pts, i);
    left.push([p[0] - ty * w, p[1] + tx * w]);
    right.push([p[0] + ty * w, p[1] - tx * w]);
  });
  const ring = [...left, ...right.reverse()];
  return "M" + ring.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";
}

// smooth closed blob through points (Catmull-Rom converted to Béziers)
function blob(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}

export function starPoints(cx: number, cy: number, R: number, inner = 0.42, rot = -90): string {
  return Array.from({ length: 10 }, (_, i) => {
    const a = ((rot + i * 36) * Math.PI) / 180;
    const r = i % 2 ? R * inner : R;
    return `${f(cx + Math.cos(a) * r)},${f(cy + Math.sin(a) * r)}`;
  }).join(" ");
}

// ── motifs ───────────────────────────────────────────────────────────────

type MotifProps = { x?: number; y?: number; s?: number; rot?: number; color?: string; opacity?: number };
const place = ({ x = 0, y = 0, s = 1, rot = 0 }: MotifProps) => `translate(${x} ${y}) rotate(${rot}) scale(${s})`;

// A set of concentric rings: thick outer ring, thin inner ring, solid centre.
function ringSet(cx: number, cy: number, r: number, color: string, key: string) {
  return (
    <g key={key}>
      <circle cx={cx} cy={cy} r={r * 0.89} fill="none" stroke={color} strokeWidth={r * 0.22} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={color} strokeWidth={r * 0.06} />
      <circle cx={cx} cy={cy} r={r * 0.4} fill={color} />
    </g>
  );
}

// Overlapping ring sets with paint drips running off the bottom (centred on 0,0).
export function RingCluster(p: MotifProps & { drips?: boolean }) {
  const c = p.color ?? "#000";
  const sets: Array<[number, number, number]> = [
    [70, 20, 120], [-110, 10, 90], [-30, -110, 70], [-150, -90, 34], [70, -120, 30],
    [-60, 70, 36], [-10, 110, 26], [200, 70, 52], [210, -30, 22], [-215, 80, 26], [-205, 130, 14],
  ];
  const drips: Array<[number, number, number]> = [
    [-170, 60, 70], [-90, 90, 110], [-20, 130, 60], [150, 120, 100], [230, 110, 70],
  ];
  return (
    <g transform={place(p)} opacity={p.opacity}>
      {sets.map(([x, y, r], i) => ringSet(x, y, r, c, `r${i}`))}
      {p.drips !== false &&
        drips.map(([x, y, len], i) => (
          <g key={`d${i}`}>
            <path d={taper([[x, y], [x, y + len * 0.6], [x, y + len]], 9, 4)} fill={c} />
            <ellipse cx={x} cy={y + len + 4} rx="4" ry="6" fill={c} />
          </g>
        ))}
    </g>
  );
}

// A star inside two rings, the "badge" motif.
export function StarRings(p: MotifProps) {
  const c = p.color ?? "#000";
  return (
    <g transform={place(p)} opacity={p.opacity}>
      <circle r="92" fill="none" stroke={c} strokeWidth="20" />
      <circle r="58" fill="none" stroke={c} strokeWidth="12" />
      <polygon points={starPoints(0, 2, 34)} fill={c} />
    </g>
  );
}

// Ink splatter: an irregular blot with spikes, droplets and flung streaks.
export function InkSplatter(p: MotifProps & { seed?: number }) {
  const c = p.color ?? "#000";
  const r = seeded(p.seed ?? 7);
  const R = 90;
  const outline: Pt[] = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2;
    const spike = r() > 0.82 ? 1.35 + r() * 0.5 : 0.75 + r() * 0.35;
    return [Math.cos(a) * R * spike, Math.sin(a) * R * spike * 0.8];
  });
  const drops = Array.from({ length: 70 }, () => {
    const a = r() * Math.PI * 2;
    const d = R * (1.15 + Math.pow(r(), 1.6) * 1.9);
    const size = Math.max(1.2, 11 * (1 - (d - R) / (R * 2.2)) * (0.4 + r() * 0.8));
    return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8, size, a };
  });
  const streaks = Array.from({ length: 7 }, () => {
    const a = r() * Math.PI * 2, d0 = R * (1.1 + r() * 0.5), len = 40 + r() * 70;
    const p0: Pt = [Math.cos(a) * d0, Math.sin(a) * d0 * 0.8];
    const p1: Pt = [Math.cos(a) * (d0 + len), Math.sin(a) * (d0 + len) * 0.8];
    return taper([p0, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], p1], 6, 1);
  });
  return (
    <g transform={place(p)} opacity={p.opacity} fill={c}>
      <path d={blob(outline)} />
      {streaks.map((d, i) => <path key={`s${i}`} d={d} />)}
      {drops.map((d, i) => (
        <ellipse
          key={i}
          cx={f(d.x)}
          cy={f(d.y)}
          rx={f(d.size)}
          ry={f(d.size * (d.size > 5 ? 0.8 : 1))}
          transform={`rotate(${f((d.a * 180) / Math.PI)} ${f(d.x)} ${f(d.y)})`}
        />
      ))}
    </g>
  );
}

// Halftone disc: square dots that shrink toward the edge.
export function Halftone(p: MotifProps & { radius?: number; step?: number }) {
  const c = p.color ?? "#000";
  const R = p.radius ?? 110, step = p.step ?? 14;
  const dots: Array<[number, number, number]> = [];
  for (let y = -R; y <= R; y += step) {
    for (let x = -R; x <= R; x += step) {
      const d = Math.hypot(x, y) / R;
      if (d > 1) continue;
      dots.push([x, y, step * 0.42 * (1 - d * d * 0.75)]);
    }
  }
  return (
    <g transform={place(p)} opacity={p.opacity} fill={c}>
      {dots.map(([x, y, s]) => (
        <rect key={`${x},${y}`} x={f(x - s / 2)} y={f(y - s / 2)} width={f(s)} height={f(s)} />
      ))}
    </g>
  );
}

// A cluster of outline stars plus one solid star.
export function StarCluster(p: MotifProps) {
  const c = p.color ?? "#000";
  return (
    <g transform={place(p)} opacity={p.opacity} strokeLinejoin="round">
      <polygon points={starPoints(0, 0, 70, 0.45, -78)} fill="none" stroke={c} strokeWidth="11" />
      <polygon points={starPoints(95, 60, 42, 0.45, -100)} fill="none" stroke={c} strokeWidth="7" />
      <polygon points={starPoints(40, 115, 26, 0.45, -70)} fill="none" stroke={c} strokeWidth="5" />
      <polygon points={starPoints(-70, 80, 16, 0.45, -90)} fill={c} />
    </g>
  );
}

// Flourish: a tapered stem that ends in a curl, with two curling branches and
// small leaves, drawn as filled outlines so the line swells and thins.
export function Flourish(p: MotifProps & { flip?: boolean }) {
  const c = p.color ?? "#000";
  const side = p.flip ? -1 : 1;
  const sx = (pt: Pt): Pt => [pt[0] * side, pt[1]];

  const build = (stem: Pt[], curl: { r0: number; r1: number; turns: number; side: 1 | -1 }, w0: number, w1: number) => {
    const end = stem[stem.length - 1];
    const dir = tangentAt(stem, stem.length - 1);
    const curlPts = spiral(end, dir, curl.r0, curl.r1, curl.turns, curl.side);
    return taper([...stem, ...curlPts], w0, w1, 0.8);
  };

  // curl direction flips with the drawing
  const turn = (s: 1 | -1): 1 | -1 => (side === 1 ? s : ((-s) as 1 | -1));
  const along = (pts: Pt[], t: number) => pts[Math.round(t * (pts.length - 1))];

  // tall S-curved stem that hooks over into a large spiral
  const main = cubic(sx([40, 300]), sx([-40, 200]), sx([80, 60]), sx([10, -110]), 70);
  // a big side branch sweeping out into a C-shaped curl
  const b0 = along(main, 0.42);
  const branch = cubic(b0, [b0[0] + 50 * side, b0[1] - 60], sx([230, 40]), sx([250, 130]), 50);
  // a small curl on the other side, low on the stem
  const s0 = along(main, 0.2);
  const small = cubic(s0, [s0[0] - 40 * side, s0[1] - 10], sx([-90, 200]), sx([-100, 150]), 30);

  // a leaf sitting on a stroke at t, angled off the line
  const leaf = (pts: Pt[], t: number, angle: number, size = 1) => {
    const i = Math.round(t * (pts.length - 1));
    const [tx, ty] = tangentAt(pts, i);
    const rot = (Math.atan2(ty, tx) * 180) / Math.PI + angle * side;
    const [x, y] = pts[i];
    return (
      <path
        key={`${pts.length}-${t}`}
        d="M0 0 C 10 -12, 30 -12, 40 0 C 30 8, 10 8, 0 0 Z"
        fill={c}
        transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${size})`}
      />
    );
  };

  return (
    <g transform={place(p)} opacity={p.opacity} fill={c}>
      <path d={build(main, { r0: 85, r1: 9, turns: 1.3, side: turn(1) }, 14, 2.2)} />
      <path d={build(branch, { r0: 62, r1: 7, turns: 1.35, side: turn(1) }, 10, 1.6)} />
      <path d={build(small, { r0: 30, r1: 5, turns: 1.2, side: turn(-1) }, 6, 1)} />
      {leaf(main, 0.62, -55)}
      {leaf(branch, 0.55, -60, 0.8)}
      {leaf(small, 0.5, 60, 0.6)}
    </g>
  );
}

// An eighth note (single) or a beamed pair, centred on the first note head.
function note(x: number, y: number, rot: number, s: number, beamed: boolean, color: string, key: string) {
  return (
    <g key={key} transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})`} fill={color}>
      <ellipse cx="0" cy="0" rx="10" ry="7" transform="rotate(-22)" />
      <rect x="7.5" y="-48" width="3" height="47" />
      {beamed ? (
        <>
          <ellipse cx="34" cy="-6" rx="10" ry="7" transform="rotate(-22 34 -6)" />
          <rect x="41.5" y="-56" width="3" height="49" />
          <polygon points="7.5,-48 44.5,-56 44.5,-47 7.5,-39" />
        </>
      ) : (
        <path d="M10.5 -48 C 14 -36, 30 -32, 26 -14 C 26 -26, 18 -30, 10.5 -32 Z" />
      )}
    </g>
  );
}

// A five-line staff sweeping along a curve, with notes riding on it.
export function MusicStaff(p: MotifProps & { width?: number }) {
  const c = p.color ?? "#000";
  const base = cubic([0, 300], [180, 300], [260, 60], [p.width ?? 620, 20], 90);
  const gap = 13;
  const lines = [0, 1, 2, 3, 4].map((k) =>
    base.map((pt, i): Pt => {
      const [tx, ty] = tangentAt(base, i);
      return [pt[0] - ty * k * gap, pt[1] + tx * k * gap];
    })
  );
  const at = (t: number, line: number) => {
    const i = Math.round(t * (base.length - 1));
    const [tx, ty] = tangentAt(base, i);
    const pt = lines[line][i];
    return { x: pt[0], y: pt[1], rot: (Math.atan2(ty, tx) * 180) / Math.PI };
  };
  const notes: Array<[number, number, boolean, number]> = [
    [0.14, 3, false, 1], [0.3, 1, true, 1.05], [0.5, 2, false, 1.15], [0.66, 0, true, 1.1], [0.84, 2, false, 1.2],
  ];
  return (
    <g transform={place(p)} opacity={p.opacity}>
      {lines.map((ln, k) => (
        <path key={k} d={taper(ln, 2.2, 3.2)} fill={c} />
      ))}
      {notes.map(([t, line, beamed, s], i) => {
        const n = at(t, line);
        return note(n.x, n.y, n.rot * 0.35, s, beamed, c, `n${i}`);
      })}
    </g>
  );
}

// A flat speaker cabinet, tilted, with two drivers in the accent colour.
export function Speaker(p: MotifProps & { accent?: string }) {
  const c = p.color ?? "#000";
  const accent = p.accent ?? "var(--metro-accent)";
  const driver = (cx: number, cy: number, r: number) => (
    <g key={`${cx},${cy}`}>
      <circle cx={cx} cy={cy} r={r} fill={accent} />
      <circle cx={cx} cy={cy} r={r} fill="#fff" opacity="0.18" />
      <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke={c} strokeWidth={r * 0.1} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill={c} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill={accent} />
      <circle cx={cx - r * 0.08} cy={cy - r * 0.1} r={r * 0.12} fill="#fff" opacity="0.35" />
    </g>
  );
  return (
    <g transform={place(p)} opacity={p.opacity}>
      {/* side panel */}
      <polygon points="-120,-150 -86,-170 -76,170 -110,180" fill={c} />
      <polygon points="-120,-150 -86,-170 -76,170 -110,180" fill="#fff" opacity="0.14" />
      {/* front */}
      <polygon points="-86,-170 110,-170 120,170 -76,170" fill={c} />
      {driver(18, -78, 64)}
      {driver(24, 70, 84)}
    </g>
  );
}
