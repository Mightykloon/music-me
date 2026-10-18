import { RingCluster, StarRings, InkSplatter, Halftone, StarCluster, Flourish, MusicStaff } from "./metro-motifs";

// The panorama's background layer: the same Metro motifs, drawn very faintly
// in the text colour and spread wide, so they drift behind the panels at their
// own (slower) speed, like a Windows Phone panorama background image.
export function MetroBackdrop({ className }: { className?: string }) {
  const c = "currentColor";
  return (
    <svg className={className} viewBox="0 0 2400 900" preserveAspectRatio="xMinYMid slice" aria-hidden>
      {/* nothing in the first ~800 units: that's behind the intro text */}
      <g opacity="0.06">
        <Halftone x={900} y={760} s={1.4} color={c} />
        <InkSplatter x={1250} y={650} s={1.3} seed={23} color={c} />
        <MusicStaff x={1050} y={420} s={1.6} color={c} />
        <StarRings x={1700} y={720} s={1.2} color={c} />
        <StarCluster x={1980} y={560} s={1.1} color={c} />
        <Flourish x={2300} y={420} s={1.2} color={c} />
        <RingCluster x={2150} y={820} s={0.8} color={c} />
      </g>
    </svg>
  );
}
