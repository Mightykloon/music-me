"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Users, Search as SearchIcon, Loader2, Music, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PostCard, type PostCardData } from "@/components/feed/post-card";

type SearchTab = "all" | "users" | "posts" | "tracks";

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string | null;
  isVerified: boolean;
  bio: string | null;
  profile: { profilePictureUrl: string | null } | null;
  _count: { followers: number; posts: number };
}

interface SearchUser {
  id: string;
  username: string;
  displayName: string | null;
  isVerified: boolean;
  bio: string | null;
  profile: { profilePictureUrl: string | null } | null;
  _count: { followers: number };
}

interface SearchTrack {
  id: string;
  title: string;
  artist: string;
  albumArtUrl: string | null;
  provider: string;
}

interface DiscoverClientProps {
  trendingPosts: PostCardData[];
  suggestedUsers: SuggestedUser[];
}

export function DiscoverClient({
  trendingPosts,
  suggestedUsers,
}: DiscoverClientProps) {
  const [query, setQuery] = useState("");
  const [searchTab, setSearchTab] = useState<SearchTab>("all");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [tracks, setTracks] = useState<SearchTrack[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearching = query.length > 0;
  const hasResults = users.length > 0 || posts.length > 0 || tracks.length > 0;

  const doSearch = useCallback(
    async (q: string, t: SearchTab) => {
      if (q.length < 1) {
        setUsers([]);
        setPosts([]);
        setTracks([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q, type: t, limit: "20" });
        const res = await fetch(`/api/search?${params}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (data.users) setUsers(data.users);
        if (data.posts) setPosts(data.posts);
        if (data.tracks) setTracks(data.tracks);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 1) {
      setUsers([]);
      setPosts([]);
      setTracks([]);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(value, searchTab), 300);
  };

  const handleTabChange = (t: SearchTab) => {
    setSearchTab(t);
    if (query) doSearch(query, t);
  };

  const clearSearch = () => {
    setQuery("");
    setUsers([]);
    setPosts([]);
    setTracks([]);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search bar - always visible */}
      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-lg px-4 py-3 border-b border-border/50">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search users, posts, tracks..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {isSearching && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Search tabs - only show when searching */}
        {isSearching && (
          <div className="flex gap-1 mt-2">
            {(["all", "users", "posts", "tracks"] as SearchTab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  searchTab === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {isSearching ? (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasResults ? (
          <div className="text-center py-20 px-4">
            <p className="text-muted-foreground text-sm">
              No results for &ldquo;{query}&rdquo;
            </p>
          </div>
        ) : (
          <div>
            {/* Users */}
            {users.length > 0 && (
              <div>
                {searchTab === "all" && (
                  <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    People
                  </p>
                )}
                {users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/${u.username}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/30"
                  >
                    <Avatar
                      src={u.profile?.profilePictureUrl}
                      alt={u.displayName ?? u.username}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {u.displayName ?? u.username}
                        {u.isVerified && (
                          <span className="ml-1 text-primary text-xs">✓</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{u.username} · {u._count.followers} followers
                      </p>
                      {u.bio && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Tracks */}
            {tracks.length > 0 && (
              <div>
                {searchTab === "all" && (
                  <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    Tracks
                  </p>
                )}
                {tracks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border/30"
                  >
                    {t.albumArtUrl ? (
                      <Image
                        src={t.albumArtUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.artist}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {t.provider.toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Posts */}
            {posts.length > 0 && (
              <div>
                {searchTab === "all" && (
                  <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    Posts
                  </p>
                )}
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <>
          {/* Suggested Users */}
          {suggestedUsers.length > 0 && (
            <section className="px-4 py-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">People to Follow</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {suggestedUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/${user.username}`}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors text-center"
                  >
                    <Avatar
                      src={user.profile?.profilePictureUrl}
                      alt={user.displayName ?? user.username}
                      size="lg"
                    />
                    <div className="min-w-0 w-full">
                      <p className="font-medium text-sm truncate">
                        {user.displayName ?? user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user._count.followers} followers · {user._count.posts} posts
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Trending Posts */}
          <section>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Trending</h2>
            </div>
            {trendingPosts.length > 0 ? (
              trendingPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-20 px-4">
                <p className="text-muted-foreground text-sm">
                  Nothing trending yet. Be the first to post!
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
