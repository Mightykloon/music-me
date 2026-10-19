"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AudioLines, AudioWaveform, BookOpen, Coffee, Disc3, Drum, Flame, Guitar, Hand, Handshake, Headphones,
  Heart, Laptop, Lightbulb, MessageSquareText, Mic, MicVocal, Moon, Music, Newspaper, Piano, Repeat,
  Skull, SlidersVertical, Sparkles, Speaker, Star, Ticket, TreePine, Trophy, Zap, type LucideIcon,
} from "lucide-react";
import { LiveTile, type TileFace } from "@/components/metro/live-tile";
import { PunchedFill } from "@/components/metro/punched-fill";

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

// Fronts mix solid accent, accent outline and solid dark so a group never
// turns into one slab of colour; the big tiles are always solid.
type Front = "solid" | "outline" | "dark";
const FRONTS: Front[] = ["solid", "outline", "dark", "outline", "solid", "dark", "solid", "outline"];
// busiest first; ties keep the forum's own order
const byActivity = (subs: SubCategory[]) =>
  subs.map((s, order) => ({ s, order })).sort((a, b) => b.s.activity - a.s.activity || a.order - b.order).map(({ s }) => s);

const frontOf = (i: number, size: Size): Front => (size === "small" ? FRONTS[(i * 3) % FRONTS.length] : "solid");

// Fronts are painted by PunchedFill (so the icon can be cut out of them);
// outlined fronts have no fill to punch, so their icon is drawn in the accent.
const FRONT_CLASS: Record<Front, string> = {
  solid: "isolate text-white",
  outline: "border-2 border-primary text-foreground",
  dark: "isolate text-foreground",
};
const FRONT_FILL: Partial<Record<Front, string>> = {
  solid: "var(--metro-accent)",
  dark: "var(--muted)",
};
// every back is solid accent, whatever the front
const BACK_CLASS = "bg-primary text-white";

// an icon per sub-forum (by slug), replacing the emoji
const ICONS: Record<string, LucideIcon> = {
  introductions: Hand, "music-news": Newspaper, "hot-takes": Flame,
  "hip-hop": Mic, "rnb-soul": Heart, pop: Star, rock: Guitar, electronic: AudioWaveform,
  indie: Moon, "jazz-blues": Piano, classical: Music, metal: Skull, "country-folk": TreePine,
  latin: Disc3, "kpop-jpop": Sparkles, afrobeats: Drum, "punk-ska": Zap, "lofi-chill": Coffee,
  "beat-showcases": AudioLines, "production-tips": Lightbulb, "daw-talk": Laptop,
  "mixing-mastering": SlidersVertical, "sound-design": Speaker, collabs: Handshake,
  "original-songs": MicVocal, "remixes-covers": Repeat, "feedback-requests": MessageSquareText,
  "weekly-spotlight": Trophy, "concerts-festivals": Ticket, vinyl: Disc3,
  "music-history": BookOpen, gear: Headphones,
};

const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });

function faces(sub: SubCategory, front: Front, size: Size): TileFace[] {
  const label = sub.name.toLowerCase();
  const large = size === "large";
  const wide = size !== "small"; // room for more text
  const Icon = ICONS[sub.slug] ?? Music;
  const iconSize = large ? 104 : 44;
  const fill = FRONT_FILL[front];

  const frontFace: TileFace = {
    className: FRONT_CLASS[front],
    label,
    body: (
      <div className="flex h-full flex-col justify-between">
        {fill ? (
          <>
            {/* the icon is a hole in the tile; keep its space in the layout */}
            <PunchedFill icon={Icon} fill={fill} size={iconSize} strokeWidth={large ? 1.5 : 2} />
            <span aria-hidden style={{ height: iconSize - 12 }} />
          </>
        ) : (
          <Icon aria-hidden className="text-primary" width={iconSize} height={iconSize} strokeWidth={2} />
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

  const backFace: TileFace = thread
    ? {
        className: BACK_CLASS,
        label: reply ? `@${reply.author.username} replied ${ago(reply.createdAt)}` : `@${thread.author.username} · ${ago(thread.createdAt)}`,
        body: (
          <div className="flex h-full flex-col gap-1 overflow-hidden">
            <p className="text-[0.7rem] uppercase tracking-wider opacity-80">{reply ? "latest reply" : "latest thread"} · {count}</p>
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
        body: <p className="text-base font-light leading-snug">no threads yet. start the first one.</p>,
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
                const offset = (tileIndex++ * 733) % 4000;
                const size = sizeOf(sub.activity, i, all[0].activity);
                return (
                  <Link
                    key={sub.id}
                    href={`/forum/${sub.slug}`}
                    aria-label={`${sub.name}${sub.description ? `: ${sub.description}` : ""}`}
                    className={SIZE_CLASS[size].cell || undefined}
                  >
                    <LiveTile
                      faces={faces(sub, frontOf(i, size), size)}
                      offset={offset}
                      interval={5200}
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
