"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  BookOpen, ChatText, Coffee, Equalizer, Faders, Fire, GlobeHemisphereEast, Guitar, HandWaving, Handshake,
  Headphones, Heart, Laptop, Lightbulb, Lightning, Microphone, MicrophoneStage, MoonStars, MusicNotes,
  Newspaper, PianoKeys, Repeat, Skull, Sparkle, SpeakerHifi, Star, Ticket, Tree, Trophy, VinylRecord, Waveform,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { LiveTile, type TileFace } from "@/components/metro/live-tile";
import { PunchedCornerText, PunchedFill } from "@/components/metro/punched-fill";

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

// Idle fronts are quiet: solid dark grey or a grey outline, never the accent.
// Colour only appears when a tile flips to show new activity. Big and wide
// tiles are always solid.
type Front = "solid" | "outline";
const FRONTS: Front[] = ["solid", "outline", "solid", "solid", "outline", "solid", "outline", "solid"];
// busiest first; ties keep the forum's own order
const byActivity = (subs: SubCategory[]) =>
  subs.map((s, order) => ({ s, order })).sort((a, b) => b.s.activity - a.s.activity || a.order - b.order).map(({ s }) => s);

const frontOf = (i: number, size: Size): Front => (size === "small" ? FRONTS[(i * 3) % FRONTS.length] : "solid");

// Solid fronts are painted by PunchedFill so the icon can be cut out of them;
// outlined fronts have no fill to punch, so their icon is drawn in grey.
const FRONT_CLASS: Record<Front, string> = {
  solid: "isolate text-foreground",
  outline: "border-2 border-border text-foreground",
};
const FRONT_FILL = "var(--muted)";
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
        {front === "solid" ? (
          <>
            {/* the icon is a hole in the tile; keep its space in the layout */}
            <PunchedFill icon={Icon} fill={FRONT_FILL} size={iconSize} />
            <span aria-hidden style={{ height: iconSize - 12 }} />
          </>
        ) : (
          <Icon aria-hidden className="text-muted-foreground" size={iconSize} weight="fill" />
        )}
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
        text="browse →"
        fill={BACK_FILL}
        textClassName="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      <p className="min-w-0 flex-1 text-[0.7rem] uppercase leading-tight tracking-wider opacity-80">{kicker}</p>
      <span aria-hidden className="w-[4.75rem] shrink-0" />
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
                      faces={faces(sub, frontOf(i, size), size)}
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
