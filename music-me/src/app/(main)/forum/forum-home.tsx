"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { LiveTile, type TileFace } from "@/components/metro/live-tile";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  _count: { threads: number };
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
// the first tile is wide, and every few tiles one goes dark so the accent
// doesn't turn into a single slab.
const isWide = (i: number) => i === 0;
const isDark = (i: number) => i % 4 === 2;

function faces(sub: SubCategory): TileFace[] {
  const label = sub.name.toLowerCase();
  const list: TileFace[] = [
    { body: <span className="text-4xl leading-none">{sub.icon}</span>, label },
  ];
  if (sub.description) {
    list.push({ body: <p className="text-base leading-snug">{sub.description.toLowerCase()}</p>, label });
  }
  if (sub._count.threads > 0) {
    list.push({
      body: <span className="text-5xl font-light leading-none">{sub._count.threads}</span>,
      label: sub._count.threads === 1 ? "thread" : "threads",
    });
  }
  return list;
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
                return (
                  <Link
                    key={sub.id}
                    href={`/forum/${sub.slug}`}
                    aria-label={`${sub.name}${sub.description ? `: ${sub.description}` : ""}`}
                    className={isWide(i) ? "col-span-2" : undefined}
                  >
                    <LiveTile
                      faces={faces(sub)}
                      offset={offset}
                      interval={5200}
                      className={
                        (isWide(i) ? "aspect-[2/1] " : "aspect-square ") +
                        (isDark(i) ? "bg-muted text-foreground" : "")
                      }
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
