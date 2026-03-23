"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutGrid,
  List,
  Radio,
  Newspaper,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { PostCard, type PostCardData } from "./post-card";
import type { FeedDisplayMode, FeedSource } from "@/types";

const DISPLAY_MODES: { value: FeedDisplayMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { value: "stream", icon: List, label: "Stream" },
  { value: "grid", icon: LayoutGrid, label: "Grid" },
  { value: "radio", icon: Radio, label: "Radio" },
  { value: "magazine", icon: Newspaper, label: "Magazine" },
];

const FEED_SOURCES: { value: FeedSource; label: string }[] = [
  { value: "foryou", label: "For You" },
  { value: "following", label: "Following" },
  { value: "discover", label: "Discover" },
];

export function FeedContainer() {
  const { feedSource, setFeedSource, feedDisplayMode, setFeedDisplayMode } =
    useAppStore();
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(
    async (nextCursor?: string | null) => {
      const isInitial = !nextCursor;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          source: feedSource,
          limit: "20",
        });
        if (nextCursor) params.set("cursor", nextCursor);

        const res = await fetch(`/api/feed?${params}`);
        if (!res.ok) throw new Error("Failed to fetch feed");
        const data = await res.json();

        if (isInitial) {
          setPosts(data.items);
        } else {
          setPosts((prev) => [...prev, ...data.items]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch {
        // Silently fail, keep existing posts
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [feedSource]
  );

  // Fetch on source change
  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    fetchPosts();
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPosts(cursor);
        }
      },
      { rootMargin: "200px" }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [cursor, hasMore, loadingMore, loading, fetchPosts]);

  return (
    <div>
      {/* Feed header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50">
        {/* Source tabs */}
        <div className="flex items-center">
          {FEED_SOURCES.map((source) => (
            <button
              key={source.value}
              onClick={() => setFeedSource(source.value)}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
                feedSource === source.value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {source.label}
              {feedSource === source.value && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}

          {/* Display mode toggle */}
          <div className="flex items-center gap-0.5 px-3 border-l border-border/50">
            {DISPLAY_MODES.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setFeedDisplayMode(value)}
                title={label}
                className={`p-1.5 rounded-md transition-colors ${
                  feedDisplayMode === value
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p className="text-muted-foreground text-sm">
            {feedSource === "following"
              ? "Follow some people to see their posts here."
              : "No posts yet. Be the first to share something!"}
          </p>
        </div>
      ) : (
        <FeedLayout mode={feedDisplayMode} posts={posts} />
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {loadingMore && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

/* ── Layout renderers ──────────────────────────────────────────── */

function FeedLayout({
  mode,
  posts,
}: {
  mode: FeedDisplayMode;
  posts: PostCardData[];
}) {
  switch (mode) {
    case "grid":
      return <GridLayout posts={posts} />;
    case "radio":
      return <RadioLayout posts={posts} />;
    case "magazine":
      return <MagazineLayout posts={posts} />;
    default:
      return <StreamLayout posts={posts} />;
  }
}

function StreamLayout({ posts }: { posts: PostCardData[] }) {
  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function GridLayout({ posts }: { posts: PostCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-0.5 p-0.5">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-card border border-border/30 rounded-lg overflow-hidden"
        >
          <PostCard post={post} compact />
        </div>
      ))}
    </div>
  );
}

function RadioLayout({ posts }: { posts: PostCardData[] }) {
  // Radio mode: only show posts with attached tracks, bigger player cards
  const musicPosts = posts.filter((p) => p.attachedTrack);
  const otherPosts = posts.filter((p) => !p.attachedTrack);

  return (
    <div>
      {musicPosts.length > 0 && (
        <div className="space-y-1">
          {musicPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      {otherPosts.length > 0 && (
        <div className="border-t border-border/50 mt-2">
          <p className="px-4 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Other Posts
          </p>
          {otherPosts.map((post) => (
            <PostCard key={post.id} post={post} compact />
          ))}
        </div>
      )}
    </div>
  );
}

function MagazineLayout({ posts }: { posts: PostCardData[] }) {
  // Magazine mode: featured post + smaller grid
  const [featured, ...rest] = posts;

  return (
    <div>
      {featured && (
        <div className="border-b border-border/50">
          <PostCard post={featured} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-px bg-border/30">
        {rest.map((post) => (
          <div key={post.id} className="bg-background">
            <PostCard post={post} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
