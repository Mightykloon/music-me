"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/ui/avatar";
import type { Customization } from "@/lib/profile/customization";
import type { ProfileLayoutProps, Top8Friend, WallCommentInfo } from "./layouts/types";

// The MySpace-era pieces every layout can place: boxes, Top 8, the comment
// wall, a visitor counter, the mood line and a marquee. Class names starting
// with `profile-` are documented hooks for the custom CSS editor.

export function Card({ className = "", children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className={`profile-card @container p-4 @2xl:p-5 ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="profile-section-title mb-3 text-sm font-bold uppercase tracking-wider text-[var(--profile-primary)] font-[family-name:var(--profile-heading-font)]">
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------- top 8

export function Top8({ friends, title, isOwn }: { friends: Top8Friend[]; title: string; isOwn: boolean }) {
  if (friends.length === 0 && !isOwn) return null;
  return (
    <Card className="profile-top8">
      <SectionTitle>
        {title || "Top 8"}
      </SectionTitle>
      {friends.length === 0 ? (
        <p className="text-sm opacity-70">
          No one here yet. <Link href="/settings/profile#top8" className="underline">Pick your Top 8</Link>
        </p>
      ) : (
        <ol className="grid grid-cols-4 gap-2 @2xl:gap-3">
          {friends.map((f, i) => (
            <li key={f.id}>
              <Link href={`/${f.username}`} className="group block text-center" title={`#${i + 1} ${f.displayName ?? f.username}`}>
                <div className="profile-top8-pic relative aspect-square overflow-hidden border-2 border-[var(--profile-primary)]/40 transition-transform group-hover:-rotate-2 group-hover:scale-105">
                  <Avatar src={f.profilePictureUrl} alt={f.displayName ?? f.username} className="!h-full !w-full !rounded-none" />
                </div>
                <p className="mt-1 truncate text-[11px] @2xl:text-xs group-hover:underline">{f.displayName ?? f.username}</p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- wall

export function Wall({
  username,
  initial,
  viewerId,
  isOwn,
}: {
  username: string;
  initial: { comments: WallCommentInfo[]; nextCursor: string | null };
  viewerId: string | null | undefined;
  isOwn: boolean;
}) {
  const [comments, setComments] = useState(initial.comments);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${username}/wall`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(data.error ?? "Couldn't post that.");
      setComments((c) => [{ ...data, createdAt: data.createdAt }, ...c]);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/users/${username}/wall?id=${id}`, { method: "DELETE" });
    if (res.ok) setComments((c) => c.filter((x) => x.id !== id));
    else toast.error("Couldn't delete that.");
  }

  async function more() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/users/${username}/wall?cursor=${cursor}`);
      const data = await res.json();
      setComments((c) => [...c, ...(data.comments ?? [])]);
      setCursor(data.nextCursor ?? null);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Card className="profile-wall" id="wall">
      <SectionTitle>
        comments <span className="opacity-60">({comments.length}{cursor ? "+" : ""})</span>
      </SectionTitle>

      {viewerId ? (
        <form onSubmit={post} className="mb-4 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={isOwn ? "write on your own wall..." : "leave a comment..."}
            className="w-full resize-y border border-[var(--profile-primary)]/30 bg-black/20 p-2 text-sm placeholder:opacity-60 focus:border-[var(--profile-primary)] focus:outline-none"
          />
          <div className="flex items-center justify-between text-xs opacity-70">
            <span>{text.length}/500</span>
            <button type="submit" disabled={busy || !text.trim()} className="border border-[var(--profile-primary)] px-3 py-1 font-semibold text-[var(--profile-primary)] hover:bg-[var(--profile-primary)] hover:text-black disabled:opacity-40">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "post"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-4 text-sm opacity-70">
          <Link href="/login" className="underline">Log in</Link> to leave a comment.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm opacity-60">No comments yet. Be the first.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="profile-wall-comment flex gap-3 border-t border-[var(--profile-primary)]/15 pt-3 first:border-0 first:pt-0">
              <Link href={`/${c.author.username}`} className="flex-shrink-0">
                <Avatar src={c.author.profile?.profilePictureUrl} alt={c.author.displayName ?? c.author.username} size="sm" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 text-xs">
                  <Link href={`/${c.author.username}`} className="font-semibold text-[var(--profile-primary)] hover:underline">
                    {c.author.displayName ?? c.author.username}
                  </Link>
                  <span className="opacity-50">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                  {(viewerId === c.author.id || isOwn) && (
                    <button onClick={() => remove(c.id)} className="ml-auto opacity-40 hover:opacity-100" aria-label="Delete comment">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <button onClick={more} disabled={loadingMore} className="mt-4 text-xs underline opacity-70 hover:opacity-100">
          {loadingMore ? "loading..." : "older comments"}
        </button>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- counter

export function VisitorCounter({
  username,
  initial,
  style,
  track = true,
}: {
  username: string;
  initial: number;
  style: Customization["counterStyle"];
  /** count this visit (off in the editor preview) */
  track?: boolean;
}) {
  const [views, setViews] = useState(initial);
  useEffect(() => {
    if (!track) return;
    let cancelled = false;
    fetch(`/api/users/${username}/view`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && typeof d?.views === "number") setViews(d.views);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [username, track]);

  const digits = String(views).padStart(6, "0");
  return (
    <div className={`profile-counter profile-counter-${style} flex items-center justify-center gap-2 text-xs`}>
      <span className="opacity-70">visitors</span>
      {style === "plain" ? (
        <span className="font-semibold tabular-nums">{views.toLocaleString()}</span>
      ) : (
        <span className="profile-counter-digits flex" aria-label={`${views} visitors`}>
          {[...digits].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- mood, marquee

/** "mood: 🎧 vibing", MySpace style: a small badge under the name */
export function Mood({ custom }: { custom: Customization }) {
  if (!custom.moodText && !custom.moodEmoji) return null;
  return (
    <p className="profile-mood inline-flex items-center gap-2 border border-[var(--profile-primary)]/30 bg-[var(--profile-primary)]/10 py-1 pl-1 pr-3 text-sm">
      <span className="bg-[var(--profile-primary)] px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--profile-bg)]">mood</span>
      {custom.moodEmoji && <span className="text-lg leading-none" aria-hidden>{custom.moodEmoji}</span>}
      <span>{custom.moodText}</span>
    </p>
  );
}

const TICKER_SECONDS = { slow: 40, normal: 24, fast: 12 } as const;

/** The scrolling ticker across the top: a plain strip, an LED sign, caution tape or glitter. */
export function Marquee({ custom }: { custom: Customization }) {
  const text = custom.marquee;
  if (!text) return null;
  return (
    <div
      className={`profile-marquee profile-ticker-${custom.tickerStyle} relative -mx-4 mb-4 overflow-hidden @2xl:mx-0`}
      style={{ ["--ticker-time" as string]: `${TICKER_SECONDS[custom.tickerSpeed]}s` }}
      aria-label={text}
    >
      <div className="profile-marquee-track flex w-max whitespace-nowrap" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="profile-ticker-item">{text}</span>
        ))}
      </div>
    </div>
  );
}

/** Top 8, wall and counter in one stack, for layouts that don't place them individually. */
export function ProfileExtras({ user, isOwn, custom, wall, viewerId }: Pick<ProfileLayoutProps, "user" | "isOwn" | "custom" | "wall" | "viewerId">) {
  return (
    <>
      {custom.showTop8 && <Top8 friends={user.top8 ?? []} title={custom.top8Title} isOwn={isOwn} />}
      {custom.showWall && wall && <Wall username={user.username} initial={wall} viewerId={viewerId} isOwn={isOwn} />}
    </>
  );
}
