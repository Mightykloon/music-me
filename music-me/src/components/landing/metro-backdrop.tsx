import { ArtMask } from "./art-mask";

// The panorama's background layer: the traced artwork, drawn very faintly in
// the text colour and spread wide, so it drifts behind the panels at its own
// (slower) speed, like a Windows Phone panorama background image. Pieces sit
// on alternating high and low lines and leave the intro text clear.
export function MetroBackdrop({ className }: { className?: string }) {
  return (
    <div className={className} style={{ opacity: 0.07 }}>
      {/* nothing in the first ~40%: that's behind the intro text */}
      <ArtMask art="splashRings" className="absolute bottom-[4%] left-[38%] h-[46%]" />
      <ArtMask art="speakersInk" className="absolute top-[8%] left-[52%] h-[52%]" />
      <ArtMask art="city" className="absolute bottom-[-6%] left-[70%] h-[58%]" />
      <ArtMask art="ringsSplash" className="absolute top-[10%] left-[86%] h-[38%]" />
    </div>
  );
}
