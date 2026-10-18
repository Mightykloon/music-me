"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Palette, ListMusic, Mic2, LayoutGrid, Users, Headphones, Disc3, Radio, ArrowRight } from "lucide-react";
import { LiveTile } from "@/components/metro/live-tile";
import { Tilt } from "@/components/metro/tilt";
import { RemixdWordmark } from "@/components/remixd-wordmark";
import { MetroArt } from "./metro-art";
import { MetroBackdrop } from "./metro-backdrop";

// The landing page as a Windows Phone panorama: one wide horizontal canvas
// you swipe (or scroll) through. Each panel is narrower than the screen so the
// next one peeks in, and the giant lowercase title glides behind the content
// at a slower speed.

const TITLE_SPEED = 0.35; // title moves at 35% of the content's speed
const BACKDROP_SPEED = 0.15; // background motifs drift slower still

const HEADPHONES_MASK = "url(/art/headphones.svg) left bottom / contain no-repeat";
const HEADPHONES = { mask: HEADPHONES_MASK, WebkitMask: HEADPHONES_MASK };

// "Turnstile": panels swing in like a door, one after another
const turnstile = {
  hidden: { opacity: 0, rotateY: -72, x: -24 },
  show: (i: number) => ({
    opacity: 1,
    rotateY: 0,
    x: 0,
    transition: { delay: 0.12 + i * 0.09, duration: 0.55, ease: [0.1, 0.9, 0.2, 1] as const },
  }),
};

export function Panorama() {
  const scroller = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    // parallax: the title trails the content
    const onScroll = () => {
      if (title.current && !reduced) {
        title.current.style.transform = `translate3d(${-el.scrollLeft * TITLE_SPEED}px,0,0)`;
      }
      if (backdrop.current && !reduced) {
        backdrop.current.style.transform = `translate3d(${-el.scrollLeft * BACKDROP_SPEED}px,0,0)`;
      }
    };

    // a vertical mouse wheel scrolls the panorama sideways
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
    };
  }, [reduced]);

  const panel = (i: number) => ({
    custom: i,
    variants: reduced ? undefined : turnstile,
    initial: reduced ? false : ("hidden" as const),
    animate: "show" as const,
    style: { transformOrigin: "left center", transformPerspective: 1000 },
  });

  return (
    <div
      className="relative h-dvh overflow-hidden bg-background text-foreground"
      // height left for panel content under the title (matches the panels' pt + pb)
      style={{ ["--pano-avail" as string]: "calc(100dvh - clamp(8rem, 30vh, 17rem) - 2.5rem)" }}
    >
      {/* the oversized panorama title (the original wordmark), bleeding off the top-left */}
      <div
        ref={title}
        aria-hidden
        className="pointer-events-none absolute left-[-1.5vh] top-[-2.5vh] z-[1] select-none text-foreground will-change-transform"
      >
        <RemixdWordmark className="h-[clamp(7rem,27vh,16rem)] w-auto" />
      </div>
      <h1 className="sr-only">re:mixd</h1>

      {/* faint artwork behind everything, drifting slowest */}
      <div ref={backdrop} aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-0 w-[140vw] text-foreground will-change-transform">
        <MetroBackdrop className="relative h-full w-full" />
      </div>

      {/* top bar: app title + sign-in, always visible */}
      <header className="absolute right-0 top-0 z-20 flex items-center gap-4 p-4 sm:p-6">
        <Link href="/login" className="text-sm lowercase text-muted-foreground hover:text-foreground">
          log in
        </Link>
        <Link href="/register" className="metro-button metro-button-accent min-h-[38px] px-4 text-sm">
          sign up
        </Link>
      </header>

      <div
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label="re:mixd overview, scroll sideways"
        className="relative z-10 flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* 1 · your sound */}
        <motion.section
          {...panel(0)}
          className="flex w-[88vw] max-w-[640px] shrink-0 sm:w-auto snap-start flex-col justify-end gap-6 pb-10 pl-5 pr-3 pt-[clamp(8rem,30vh,17rem)] sm:pl-10"
        >
          <div className="space-y-2">
            <h2 className="metro-header text-[2.6rem] leading-none sm:text-6xl">your sound.</h2>
            <h2 className="metro-header text-[2.6rem] leading-none text-primary sm:text-6xl">your identity.</h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Build a profile that sounds like you. Import your playlists, share lyric cards, customize everything, and
            connect with listeners who get your vibe.
          </p>
          <div className="flex flex-wrap gap-3">
            <Tilt>
              <Link href="/register" className="metro-button metro-button-accent text-base">
                get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Tilt>
            <Tilt>
              <Link href="/login" className="metro-button text-base">
                log in
              </Link>
            </Tilt>
          </div>
          <p className="metro-app-title flex items-center gap-2 text-muted-foreground">
            swipe <ArrowRight className="h-3.5 w-3.5" />
          </p>
        </motion.section>

        {/* 2 · the art */}
        <motion.section
          {...panel(1)}
          className="flex shrink-0 snap-start items-end pb-10 pl-3 pr-3 pt-[clamp(8rem,30vh,17rem)]"
        >
          {/* sized to the tile grid on the next panel (1.5x its width plus a gap),
              so their tops and bottoms line up; the visualiser still dissolves
              into the page over the last stretch */}
          <div
            className="relative aspect-square overflow-hidden"
            style={{
              width: "min(88vw - 1.5rem, 788px, var(--pano-avail) - 3.5rem)",
              maskImage: "linear-gradient(to bottom, #000 86%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 86%, transparent 100%)",
            }}
          >
            <MetroArt className="absolute inset-0 h-full w-full" />
          </div>
        </motion.section>

        {/* 3 · what you get, as live tiles */}
        <motion.section
          {...panel(2)}
          className="flex shrink-0 snap-start flex-col justify-end gap-4 pb-10 pl-3 pr-3 pt-[clamp(8rem,30vh,17rem)]"
        >
          <h2 className="metro-header text-4xl text-muted-foreground">what you get</h2>
          {/* three tile rows = 1.5× the grid width, so size it from the height left */}
          <div className="grid grid-cols-4 gap-2" style={{ width: "min(88vw - 1.5rem, 520px, (var(--pano-avail) - 4rem) / 1.5)" }}>
            <LiveTile
              className="col-span-2 aspect-square"
              faces={[
                { body: <Palette className="h-12 w-12" strokeWidth={1.5} />, label: "custom profiles" },
                { body: <p className="text-lg leading-snug">colors, fonts, layouts, vibes. make it yours.</p>, label: "custom profiles" },
              ]}
            />
            <LiveTile
              className="col-span-2 aspect-square"
              offset={900}
              faces={[
                { body: <ListMusic className="h-12 w-12" strokeWidth={1.5} />, label: "playlist imports" },
                { body: <p className="text-lg leading-snug">spotify, apple music, soundcloud, and more.</p>, label: "playlist imports" },
              ]}
            />
            <LiveTile
              className="col-span-4 aspect-[2/1]"
              offset={1800}
              faces={[
                { body: <Mic2 className="h-12 w-12" strokeWidth={1.5} />, label: "live lyrics" },
                { body: <p className="text-xl font-light leading-tight">synced lyrics and shareable lyric cards.</p>, label: "live lyrics" },
              ]}
            />
            <LiveTile
              className="col-span-2 aspect-square"
              offset={2700}
              faces={[
                { body: <LayoutGrid className="h-12 w-12" strokeWidth={1.5} />, label: "no doomscrolling" },
                { body: <p className="text-lg leading-snug">stream, grid, radio, or magazine. you choose.</p>, label: "no doomscrolling" },
              ]}
            />
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <Tilt className="aspect-square bg-muted p-2 flex items-end"><Headphones className="h-6 w-6" /></Tilt>
              <Tilt className="aspect-square bg-muted p-2 flex items-end"><Disc3 className="h-6 w-6" /></Tilt>
              <Tilt className="aspect-square bg-muted p-2 flex items-end"><Users className="h-6 w-6" /></Tilt>
              <Tilt className="aspect-square bg-muted p-2 flex items-end"><Radio className="h-6 w-6" /></Tilt>
            </div>
          </div>
        </motion.section>

        {/* 4 · join */}
        <motion.section
          {...panel(3)}
          className="flex shrink-0 snap-start flex-col justify-end gap-6 pb-10 pl-3 pr-8 pt-[clamp(8rem,30vh,17rem)] sm:flex-row sm:items-end sm:gap-8 sm:pr-16"
        >
          {/* the headphones portrait, floating: the accent print set slightly off
              register behind a figure in the text colour. On wide screens its top lines up with
              the tiles and its cropped bottom edge runs off the bottom of the page;
              on phones it fills whatever height the text leaves. */}
          <div aria-hidden className="relative min-h-0 w-[calc(88vw-2.75rem)] flex-1 sm:aspect-[2132/3000] sm:-mb-10 sm:h-[calc(var(--pano-avail)-1rem)] sm:w-auto sm:flex-none">
            <div className="absolute inset-0 translate-x-[6px] translate-y-[4px]" style={{ backgroundColor: "var(--metro-accent)", ...HEADPHONES }} />
            <div className="absolute inset-0" style={{ backgroundColor: "currentColor", ...HEADPHONES }} />
          </div>
          <div className="flex w-[calc(88vw-2.75rem)] flex-col gap-6 sm:w-[400px]">
            <h2 className="metro-header text-5xl sm:text-6xl">join the mix</h2>
            <p className="max-w-sm text-muted-foreground">
              Make an account, connect a music service, and your profile starts sounding like you in a couple of minutes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Tilt>
                <Link href="/register" className="metro-button metro-button-accent text-base">create account</Link>
              </Tilt>
              <Tilt>
                <Link href="/login" className="metro-button text-base">log in</Link>
              </Tilt>
            </div>
            <nav className="flex gap-5 pt-4 text-sm lowercase text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">privacy</Link>
              <Link href="/terms" className="hover:text-foreground">terms</Link>
              <span>&copy; {new Date().getFullYear()} re:mixd</span>
            </nav>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
