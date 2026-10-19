"use client";

import { usePathname } from "next/navigation";
import { MetroBackdrop } from "@/components/landing/metro-backdrop";

// The landing page's halftone art as the base background for the rest of the
// site: fixed behind everything, showing the same view the panorama opens on.
// It's drawn in the text colour and the accent, so it follows the theme. The
// landing page renders its own scrolling (parallax) copy instead.
export function SiteBackdrop() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden text-foreground">
      {/* the backdrop is laid out 1.4 screens wide; this shows its first screen */}
      <MetroBackdrop className="absolute inset-y-0 left-0 w-[140vw]" />
    </div>
  );
}
