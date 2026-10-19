"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  BookOpen, ChatText, Coffee, Equalizer, Faders, Fire, GlobeHemisphereEast, Guitar, HandWaving, Handshake,
  Headphones, Heart, Laptop, Lightbulb, Lightning, Microphone, MicrophoneStage, MoonStars, MusicNotes,
  Newspaper, PianoKeys, Repeat, Skull, Sparkle, SpeakerHifi, Star, Ticket, Tree, Trophy, VinylRecord, Waveform,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { LiveTile, type TileFace } from "@/components/metro/live-tile";
import { PunchedCornerText } from "@/components/metro/punched-fill";

interface LatestThread {
  id: string;
  title: string;
  createdAt: string;
  author: { username: string };
  replies: { content: string; createdAt: string; author: { username: string } }[];
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  _count: { threads: number };
  threads: LatestThread[];
  // threads + replies, used to size and order the tiles
  activity: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  children: SubCategory[];
  _count: { threads: number };
}

// Tile sizes follow activity (threads + replies), like a start screen you've
// arranged by what you use most: the busiest sub-forum in a group gets a big
// 2x2 tile at the far left, other busy ones get wide 2x1 tiles, and quiet ones
// stay regular squares trailing off to the right.
type Size = "large" | "wide" | "small";
function sizeOf(activity: number, rank: number, max: number): Size {
  if (activity === 0 || max === 0) return "small";
  if (rank === 0) return "large";
  return activity >= max / 3 ? "wide" : "small";
}
const SIZE_CLASS: Record<Size, { cell: string; tile: string }> = {
  large: { cell: "col-span-2 sm:row-span-2", tile: "aspect-square" },
  wide: { cell: "col-span-2", tile: "aspect-[2/1]" },
  small: { cell: "", tile: "aspect-square" },
};

// Idle fronts are quiet: solid near-black or a grey outline, never the accent.
// Colour only appears when a tile flips to show new activity. Which tiles are
// outlined wanders over time (see useRoamingOutlines).
type Front = "solid" | "outline";
// busiest first; ties keep the forum's own order
const byActivity = (subs: SubCategory[]) =>
  subs.map((s, order) => ({ s, order })).sort((a, b) => b.s.activity - a.s.activity || a.order - b.order).map(({ s }) => s);

// Solid fronts are a near-black fill with a solid icon; outlined fronts are
// a border in the text colour (white on dark); both get a solid icon.
const FRONT_CLASS: Record<Front, string> = {
  solid: "bg-[var(--metro-tile)] text-foreground",
  outline: "border-2 border-foreground text-foreground",
};

// Like the reactor tiles on damian.digital: every so often one random tile
// gains or loses its outline, stuttering on the way like a flickering light,
// keeping roughly a quarter to a half of the tiles outlined. Starts from a
// fixed pattern so the server and client render the same thing.
function useRoamingOutlines(ids: string[]) {
  const [outlined, setOutlined] = useState(() => new Set(ids.filter((_, i) => i % 3 === 1)));
  const current = useRef(outlined);
  const reduced = useReducedMotion();
  const key = ids.join(",");

  useEffect(() => {
    if (reduced || ids.length < 3) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const set = (id: string, on: boolean) => {
      const next = new Set(current.current);
      if (on) next.add(id);
      else next.delete(id);
      current.current = next;
      setOutlined(next);
    };
    const cycle = () => {
      if (!document.hidden) {
        const on = ids.filter((id) => current.current.has(id));
        const off = ids.filter((id) => !current.current.has(id));
        const min = Math.ceil(ids.length * 0.25);
        const max = Math.floor(ids.length * 0.45);
        const insert = on.length < min || (on.length < max && Math.random() < 0.55);
        const pool = insert ? off : on;
        const id = pool[Math.floor(Math.random() * pool.length)];
        if (id) {
          // stutter: flick a few times before settling
          [insert, !insert, insert, !insert, insert].forEach((state, n) =>
            timers.push(setTimeout(() => set(id, state), [0, 90, 170, 290, 430][n]))
          );
        }
      }
      timers.push(setTimeout(cycle, 900 + Math.random() * 1300));
    };
    timers.push(setTimeout(cycle, 1500));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids are keyed by `key`
  }, [key, reduced]);

  return outlined;
}

// every back is solid accent: colour means "something new here"
// painted by PunchedCornerText, so "browse →" can be cut out of the corner
const BACK_CLASS = "isolate text-white";
const BACK_FILL = "var(--metro-accent)";

// an icon per sub-forum (by slug), from Phosphor's solid set
const ICONS: Record<string, PhosphorIcon> = {
  introductions: HandWaving, "music-news": Newspaper, "hot-takes": Fire,
  "hip-hop": Microphone, "rnb-soul": Heart, pop: Star, rock: Guitar, electronic: Waveform,
  indie: MoonStars, "jazz-blues": PianoKeys, classical: MusicNotes, metal: Skull, "country-folk": Tree,
  latin: VinylRecord, "kpop-jpop": Sparkle, afrobeats: GlobeHemisphereEast, "punk-ska": Lightning,
  "lofi-chill": Coffee, "beat-showcases": Equalizer, "production-tips": Lightbulb, "daw-talk": Laptop,
  "mixing-mastering": Faders, "sound-design": SpeakerHifi, collabs: Handshake,
  "original-songs": MicrophoneStage, "remixes-covers": Repeat, "feedback-requests": ChatText,
  "weekly-spotlight": Trophy, "concerts-festivals": Ticket, vinyl: VinylRecord,
  "music-history": BookOpen, gear: Headphones,
};

const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });

function faces(sub: SubCategory, front: Front, size: Size): TileFace[] {
  const label = sub.name.toLowerCase();
  const large = size === "large";
  const wide = size !== "small"; // room for more text
  const Icon = ICONS[sub.slug] ?? MusicNotes;
  const iconSize = large ? 96 : 40;

  const frontFace: TileFace = {
    className: FRONT_CLASS[front],
    label,
    body: (
      <div className="flex h-full flex-col justify-between">
        {/* a solid icon in the text colour (white on dark), on both the solid
            and the outlined tiles */}
        <Icon aria-hidden className="text-foreground" size={iconSize} weight="fill" />

        {wide && sub.description && (
          <p className={`${large ? "text-xl font-light" : "text-sm"} leading-snug opacity-90`}>{sub.description.toLowerCase()}</p>
        )}
      </div>
    ),
  };

  // the back: the newest activity in this sub-forum
  const thread = sub.threads[0];
  const reply = thread?.replies[0];
  const count = `${sub._count.threads} ${sub._count.threads === 1 ? "thread" : "threads"}`;

  // Top row of the back: what this is on the left; on the right, a reserved
  // slot where "browse →" is punched out of the tile on hover (bold, its
  // letters touching the top edge), so it never sits over text.
  const topRow = (kicker: string) => (
    <div className="flex items-start gap-2">
      <PunchedCornerText
        text="browse"
        fill={BACK_FILL}
        textClassName="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      <p className="min-w-0 flex-1 text-[0.7rem] uppercase leading-tight tracking-wider opacity-80">{kicker}</p>
      <span aria-hidden className="w-[5.75rem] shrink-0" />
    </div>
  );

  const backFace: TileFace = thread
    ? {
        className: BACK_CLASS,
        label: reply ? `@${reply.author.username} replied ${ago(reply.createdAt)}` : `@${thread.author.username} · ${ago(thread.createdAt)}`,
        body: (
          <div className="flex h-full flex-col gap-1 overflow-hidden">
            {topRow(`${reply ? "latest reply" : "latest thread"} · ${count}`)}
            {reply ? (
              <>
                <p className={`leading-snug ${wide ? "line-clamp-3 text-base" : "line-clamp-2 text-sm"}`}>{reply.content}</p>
                <p className="mt-auto truncate text-xs opacity-80">in {thread.title}</p>
              </>
            ) : (
              <p className={`font-light leading-tight ${wide ? "line-clamp-3 text-xl" : "line-clamp-3 text-base"}`}>{thread.title}</p>
            )}
          </div>
        ),
      }
    : {
        className: BACK_CLASS,
        label,
        body: (
          <div className="flex h-full flex-col gap-1 overflow-hidden">
            {topRow("no threads yet")}
            <p className="text-base font-light leading-snug">start the first one.</p>
          </div>
        ),
      };

  return [frontFace, backFace];
}

export function ForumHome({ categories }: { categories: Category[] }) {
  const strip = useRef<HTMLDivElement>(null);
  const outlined = useRoamingOutlines(categories.flatMap((c) => c.children.map((s) => s.id)));

  // on wide screens the groups run sideways: a vertical mouse wheel scrolls
  // the strip horizontally, the same as the landing panorama
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  let tileIndex = 0; // staggers the flips across the whole page

  return (
    <div className="sm:h-[calc(100dvh-4rem)] sm:flex sm:flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 sm:px-10">
        <h1 className="metro-header text-5xl">forum</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Discuss music, share your work, discover indie artists.
        </p>
      </div>

      {/* Groups: stacked on phones, a sideways strip on wider screens */}
      <div
        ref={strip}
        role="region"
        aria-label="forum sections"
        tabIndex={0}
        className="flex flex-col gap-8 px-4 pb-8 pt-4 outline-none sm:min-h-0 sm:flex-1 sm:flex-row sm:gap-12 sm:overflow-x-auto sm:px-10 sm:pb-6 [scrollbar-width:thin]"
      >
        {categories.map((category) => (
          <section key={category.id} className="shrink-0 sm:flex sm:flex-col">
            <h2 className="metro-header text-3xl mb-3 flex items-baseline gap-2">
              {category.name}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-flow-col-dense sm:grid-rows-3 sm:auto-cols-[clamp(8.5rem,calc((100dvh-19rem)/3),11.5rem)] sm:grid-cols-none">
              {byActivity(category.children).map((sub, i, all) => {
                // slow, scattered flips: each tile turns every ~14s, starts spread over ~14s
                const offset = (tileIndex++ * 1931) % 14000;
                const size = sizeOf(sub.activity, i, all[0].activity);
                return (
                  <Link
                    key={sub.id}
                    href={`/forum/${sub.slug}`}
                    aria-label={`${sub.name}${sub.description ? `: ${sub.description}` : ""}`}
                    className={`group outline-none focus-visible:ring-2 focus-visible:ring-primary ${SIZE_CLASS[size].cell}`}
                  >
                    <LiveTile
                      faces={faces(sub, outlined.has(sub.id) ? "outline" : "solid", size)}
                      offset={offset}
                      interval={14000}
                      hoverFace={1}
                      // each face paints its own fill (outlined fronts flip to solid)
                      className={`${SIZE_CLASS[size].tile} bg-transparent text-foreground`}
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
