"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowsOutLineVertical, DotsSixVertical, Trash } from "@phosphor-icons/react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSong } from "@/components/profile/profile-song";
import { PlaylistDisplay } from "@/components/profile/playlist-display";
import { LinkSection } from "@/components/profile/link-section";
import { VibeBoard } from "@/components/profile/vibe-board";
import { PostGrid } from "@/components/profile/post-grid";
import { NowPlayingBadge } from "@/components/profile/now-playing-badge";
import { FavoritesSection } from "@/components/profile/favorites-section";
import { GenreWidget } from "@/components/profile/genre-widget";
import { Card, Mood, SectionTitle, Top8, Wall } from "@/components/profile/profile-extras";
import { BLOCK_HEIGHTS, BLOCK_INFO, BLOCK_WIDTHS, type Block } from "@/lib/profile/customization";
import { favoritesOf, hasFavorites, vibeItemsOf } from "./shared";
import type { ProfileLayoutProps } from "./types";

/** Editing hooks; only the profile editor's live preview passes these. */
export interface ArrangeControls {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (blocks: Block[]) => void;
}

// 6 columns from a medium-width container up; phones get one column in order
const SPAN: Record<number, string> = {
  2: "@xl:col-span-2",
  3: "@xl:col-span-3",
  4: "@xl:col-span-4",
  6: "@xl:col-span-6",
};
const HEIGHT: Record<string, string> = { auto: "", s: "h-48", m: "h-80", l: "h-[28rem]" };
const WIDTH_NAMES: Record<number, string> = { 2: "⅓", 3: "½", 4: "⅔", 6: "full" };

export function BlocksLayout(props: ProfileLayoutProps & { arrange?: ArrangeControls }) {
  const { custom, arrange } = props;
  const blocks = custom.blocks;
  const grid = useRef<HTMLDivElement>(null);
  // drag handlers outlive a render, so they read the newest blocks from here
  const latest = useRef(blocks);
  useLayoutEffect(() => {
    latest.current = blocks;
  }, [blocks]);
  const [dragging, setDragging] = useState<string | null>(null);

  // drag a block by its handle; it slots in before or after whatever it's over
  const startMove = (e: React.PointerEvent, id: string) => {
    if (!arrange) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(id);
    arrange.onSelect(id);
    const move = (ev: PointerEvent) => {
      const over = document
        .elementsFromPoint(ev.clientX, ev.clientY)
        .map((n) => n.closest("[data-block-id]"))
        .find((n) => n && n.getAttribute("data-block-id") !== id);
      if (!over) return;
      const targetId = over.getAttribute("data-block-id")!;
      const r = over.getBoundingClientRect();
      const after = (ev.clientX - r.left) / r.width + (ev.clientY - r.top) / r.height > 1;
      const list = latest.current.filter((b) => b.id !== id);
      const dragged = latest.current.find((b) => b.id === id)!;
      const at = list.findIndex((b) => b.id === targetId) + (after ? 1 : 0);
      list.splice(at, 0, dragged);
      if (list.some((b, i) => b.id !== latest.current[i]?.id)) arrange.onChange(list);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDragging(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // drag the right edge; the width snaps to a third, half, two thirds or full
  const startResize = (e: React.PointerEvent, block: Block) => {
    if (!arrange || !grid.current) return;
    e.preventDefault();
    e.stopPropagation();
    const colW = grid.current.getBoundingClientRect().width / 6;
    const sx = e.clientX;
    const move = (ev: PointerEvent) => {
      const want = block.w + (ev.clientX - sx) / colW;
      const w = BLOCK_WIDTHS.reduce((best, n) => (Math.abs(n - want) < Math.abs(best - want) ? n : best), BLOCK_WIDTHS[0]);
      const cur = latest.current.find((b) => b.id === block.id);
      if (cur && cur.w !== w) arrange.onChange(latest.current.map((b) => (b.id === block.id ? { ...b, w } : b)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const patch = (id: string, change: Partial<Block>) => arrange?.onChange(latest.current.map((b) => (b.id === id ? { ...b, ...change } : b)));
  const remove = (id: string) => {
    arrange?.onChange(latest.current.filter((b) => b.id !== id));
    arrange?.onSelect(null);
  };

  return (
    <div ref={grid} className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 [grid-auto-flow:row_dense] @xl:grid-cols-6">
      {blocks.map((block) => {
        const content = <BlockContent block={block} {...props} />;
        // blocks with nothing to show are left out, except while arranging
        if (!content && !arrange) return null;
        const selected = arrange?.selectedId === block.id;
        return (
          <div
            key={block.id}
            data-block-id={block.id}
            onClick={arrange ? () => arrange.onSelect(block.id) : undefined}
            className={`relative min-w-0 ${SPAN[block.w]} ${HEIGHT[block.h]} ${
              arrange ? `rounded-sm outline-2 outline-offset-2 ${selected ? "outline outline-[var(--profile-primary)]" : "hover:outline hover:outline-white/30"}` : ""
            } ${dragging === block.id ? "opacity-60" : ""}`}
          >
            <div className={`h-full ${arrange ? "pointer-events-none select-none" : ""}`}>
              {content ?? <Placeholder block={block} />}
            </div>

            {arrange && (
              <>
                <div className="absolute -top-3 left-2 z-10 flex items-center gap-1 border border-white/15 bg-black/85 px-1 py-0.5 text-[11px] text-white shadow-lg">
                  <button
                    onPointerDown={(e) => startMove(e, block.id)}
                    className="cursor-grab touch-none p-0.5 active:cursor-grabbing"
                    aria-label={`Move ${BLOCK_INFO[block.type].label}`}
                    title="Drag to move"
                  >
                    <DotsSixVertical className="h-3.5 w-3.5" weight="bold" />
                  </button>
                  <span className="px-1">{BLOCK_INFO[block.type].label}</span>
                  {BLOCK_WIDTHS.map((w) => (
                    <button
                      key={w}
                      onClick={(e) => {
                        e.stopPropagation();
                        patch(block.id, { w });
                      }}
                      className={`px-1 ${block.w === w ? "bg-white text-black" : "hover:bg-white/20"}`}
                      title={`Width: ${WIDTH_NAMES[w]}`}
                    >
                      {WIDTH_NAMES[w]}
                    </button>
                  ))}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      patch(block.id, { h: BLOCK_HEIGHTS[(BLOCK_HEIGHTS.indexOf(block.h) + 1) % BLOCK_HEIGHTS.length] });
                    }}
                    className="flex items-center gap-0.5 px-1 hover:bg-white/20"
                    title="Height: auto, small, medium, large"
                  >
                    <ArrowsOutLineVertical className="h-3 w-3" />
                    {block.h}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(block.id);
                    }}
                    className="p-0.5 hover:text-red-400"
                    aria-label="Remove block"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
                {/* right edge: drag to resize */}
                <div
                  onPointerDown={(e) => startResize(e, block)}
                  className="absolute -right-2 top-1/2 z-10 hidden h-10 w-3 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center @xl:flex"
                  title="Drag to resize"
                >
                  <span className="h-8 w-1 rounded-full bg-[var(--profile-primary)]" />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Placeholder({ block }: { block: Block }) {
  return (
    <div className="profile-card flex h-full min-h-24 flex-col items-center justify-center gap-1 border-dashed p-4 text-center text-xs opacity-70">
      <span className="font-semibold">{BLOCK_INFO[block.type].label}</span>
      <span>{block.type === "image" ? "add an image link in the panel" : block.type === "spacer" ? "empty space" : "nothing to show here yet"}</span>
    </div>
  );
}

const fill = "h-full overflow-auto";

/** What a block shows, or null when it has nothing (so it can be hidden). */
function BlockContent({ block, user, posts, isOwn, genres, custom, wall, viewerId }: ProfileLayoutProps & { block: Block }) {
  const titled = (fallback: string) => block.title || fallback;
  switch (block.type) {
    case "header":
      return (
        <Card className={fill}>
          {user.nowPlaying?.track && (
            <div className="mb-4">
              <NowPlayingBadge track={user.nowPlaying.track} />
            </div>
          )}
          <ProfileHeader user={user} isOwn={isOwn} />
          <div className="mt-3">
            <Mood custom={custom} />
          </div>
        </Card>
      );
    case "song":
      return user.profileSong ? (
        <div className="flex h-full flex-col justify-center">
          <ProfileSong track={user.profileSong} autoplay={user.profile?.autoplayProfileSong} skin={custom.songSkin} />
        </div>
      ) : null;
    case "links":
      return (user.links?.length ?? 0) > 0 ? (
        <Card className={fill}>
          <LinkSection links={user.links} />
        </Card>
      ) : null;
    case "top8":
      return (
        <div className={`${fill} [&>section]:min-h-full`}>
          <Top8 friends={user.top8 ?? []} title={block.title || custom.top8Title} isOwn={isOwn} />
        </div>
      );
    case "wall":
      return wall ? (
        <div className={`${fill} [&>section]:min-h-full`}>
          <Wall username={user.username} initial={wall} viewerId={viewerId} isOwn={isOwn} />
        </div>
      ) : null;
    case "posts":
      return (
        <Card className={fill}>
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          <PostGrid posts={posts} />
        </Card>
      );
    case "playlists":
      return (user.playlists?.length ?? 0) > 0 ? (
        <Card className={fill}>
          <PlaylistDisplay playlists={user.playlists} />
        </Card>
      ) : null;
    case "about":
      return hasFavorites(user) ? (
        <Card className={fill}>
          <FavoritesSection favorites={favoritesOf(user)} title={titled("About Me")} />
        </Card>
      ) : null;
    case "artists":
      return (genres?.length ?? 0) > 0 ? (
        <Card className={fill}>
          <GenreWidget genres={genres ?? []} />
        </Card>
      ) : null;
    case "vibes":
      return vibeItemsOf(user).length > 0 ? (
        <Card className={fill}>
          <VibeBoard items={vibeItemsOf(user)} />
        </Card>
      ) : null;
    case "threads":
      return (user.threads?.length ?? 0) > 0 ? (
        <Card className={fill}>
          <SectionTitle>{titled("forum threads")}</SectionTitle>
          <ul className="space-y-2">
            {user.threads!.map((t) => (
              <li key={t.id}>
                <Link href={`/forum/${t.categorySlug}/${t.id}`} className="group block">
                  <span className="block truncate text-sm font-medium group-hover:underline">{t.title}</span>
                  <span className="text-xs opacity-60">
                    {t.categoryName} · {t.replies} {t.replies === 1 ? "reply" : "replies"} ·{" "}
                    {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null;
    case "image": {
      if (!block.src) return null;
      const img = (
        <figure className="profile-card profile-image-block relative h-full min-h-40 overflow-hidden p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.title || ""} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          {block.title && (
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-8 text-sm font-medium text-white">
              {block.title}
            </figcaption>
          )}
        </figure>
      );
      return block.href ? (
        <a href={block.href} target="_blank" rel="noopener noreferrer" className="block h-full">
          {img}
        </a>
      ) : (
        img
      );
    }
    case "text":
      return block.title || block.text ? (
        <Card className={fill}>
          {block.title &&
            (block.href ? (
              <a href={block.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                <SectionTitle>{block.title}</SectionTitle>
              </a>
            ) : (
              <SectionTitle>{block.title}</SectionTitle>
            ))}
          <p className="profile-text-block whitespace-pre-wrap break-words text-sm leading-relaxed">{block.text}</p>
        </Card>
      ) : null;
    case "spacer":
      return <div className={block.h === "auto" ? "h-8" : "h-full"} aria-hidden />;
  }
}
