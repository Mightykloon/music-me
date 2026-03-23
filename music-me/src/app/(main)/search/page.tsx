"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Search as SearchIcon, Loader2, Music } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PostCard, type PostCardData } from "@/components/feed/post-card";

type SearchTab = "all" | "users" | "posts" | "tracks";

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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("all");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [tracks, setTracks] = useState<SearchTrack[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
    debounceRef.current = setTimeout(() => doSearch(value, tab), 300);
  };

  const handleTabChange = (t: SearchTab) => {
    setTab(t);
    if (query) doSearch(query, t);
  };

  const hasResults = users.length > 0 || posts.length > 0 || tracks.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Search input */}
      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-lg px-4 py-3 border-b border-border/50">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search users, posts, tracks..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            autoFocus
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-2">
          {(["all", "users", "posts", "tracks"] as SearchTab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !hasResults && query ? (
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
              {(tab === "all") && (
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
              {(tab === "all") && (
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
                    <img
                      src={t.albumArtUrl}
                      alt=""
                      className="w-10 h-10 rounded"
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
              {(tab === "all") && (
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
      )}
    </div>
  );
}
