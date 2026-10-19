"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { LiveTile, type TileFace } from "@/components/metro/live-tile";

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

// Tile rhythm within a group, like the Xbox 360 / Windows Phone start screen:
// the first tile is wide; the rest mix solid accent, accent outline and
// solid dark fronts so a group never turns into one slab of colour.
type Front = "solid" | "outline" | "dark";
const FRONTS: Front[] = ["solid", "outline", "dark", "outline", "solid", "dark", "solid", "outline"];
const isWide = (i: number) => i === 0;
const frontOf = (i: number): Front => (isWide(i) ? "solid" : FRONTS[(i * 3) % FRONTS.length]);

const FRONT_CLASS: Record<Front, string> = {
  solid: "bg-primary text-white",
  outline: "border-2 border-primary text-foreground",
  dark: "bg-muted text-foreground",
};
// every back is solid accent, whatever the front
const BACK_CLASS = "bg-primary text-white";

const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });

function faces(sub: SubCategory, front: Front, wide: boolean): TileFace[] {
  const label = sub.name.toLowerCase();

  const frontFace: TileFace = {
    className: FRONT_CLASS[front],
    label,
    body: (
      <div className="flex h-full flex-col justify-between">
        <span className="text-4xl leading-none">{sub.icon}</span>
        {wide && sub.description && <p className="text-sm leading-snug opacity-90">{sub.description.toLowerCase()}</p>}
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
              {category.children.map((sub, i) => {
                const offset = (tileIndex++ * 733) % 4000;
                const wide = isWide(i);
                return (
                  <Link
                    key={sub.id}
                    href={`/forum/${sub.slug}`}
                    aria-label={`${sub.name}${sub.description ? `: ${sub.description}` : ""}`}
                    className={wide ? "col-span-2" : undefined}
                  >
                    <LiveTile
                      faces={faces(sub, frontOf(i), wide)}
                      offset={offset}
                      interval={5200}
                      // each face paints its own fill (outlined fronts flip to solid)
                      className={(wide ? "aspect-[2/1]" : "aspect-square") + " bg-transparent text-foreground"}
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
