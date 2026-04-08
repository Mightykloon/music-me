"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Music, Disc3, ListMusic, Flame } from "lucide-react";

interface TrendingData {
  artists: { name: string; playlists: number; imageUrl: string | null }[];
  albums: { name: string; artist: string; artUrl: string | null; tracks: number }[];
  playlists: {
    id: string;
    name: string;
    coverImageUrl: string | null;
    trackCount: number;
    provider: string;
    user: { username: string; displayName: string | null };
    _count: { tracks: number };
  }[];
  genres: string[];
}

export function TrendingSidebar() {
  const [data, setData] = useState<TrendingData | null>(null);

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 p-4 animate-pulse">
            <div className="h-4 w-28 bg-muted rounded mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-2 w-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const hasAny = data.artists.length > 0 || data.albums.length > 0 || data.playlists.length > 0 || data.genres.length > 0;
  if (!hasAny) return null;

  return (
    <div className="space-y-6">
      {/* Trending Artists */}
      {data.artists.length > 0 && (
        <section className="rounded-xl border border-border/50 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            Trending Artists
          </h3>
          <div className="space-y-2">
            {data.artists.slice(0, 6).map((a, i) => (
              <Link
                key={a.name}
                href={`/discover?q=${encodeURIComponent(a.name)}`}
                className="flex items-center gap-2 hover:bg-muted/30 rounded-lg p-1 -mx-1 transition-colors"
              >
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                {a.imageUrl ? (
                  <img
                    src={a.imageUrl}
                    alt={a.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                    <Music className="w-3.5 h-3.5 text-primary/60" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">{a.playlists} playlists</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Genres */}
      {data.genres.length > 0 && (
        <section className="rounded-xl border border-border/50 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            Popular Genres
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {data.genres.map((g) => (
              <Link
                key={g}
                href={`/discover?genre=${encodeURIComponent(g)}`}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
              >
                {g}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Albums */}
      {data.albums.length > 0 && (
        <section className="rounded-xl border border-border/50 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
            <Disc3 className="w-4 h-4 text-purple-500" />
            Top Albums
          </h3>
          <div className="space-y-2">
            {data.albums.slice(0, 5).map((a) => (
              <Link
                key={`${a.name}-${a.artist}`}
                href={`/discover?q=${encodeURIComponent(`${a.name} ${a.artist}`)}`}
                className="flex items-center gap-2 hover:bg-muted/30 rounded-lg p-1 -mx-1 transition-colors"
              >
                {a.artUrl ? (
                  <img src={a.artUrl} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Disc3 className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{a.artist}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Playlists */}
      {data.playlists.length > 0 && (
        <section className="rounded-xl border border-border/50 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
            <ListMusic className="w-4 h-4 text-green-500" />
            Hot Playlists
          </h3>
          <div className="space-y-2">
            {data.playlists.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/playlist/${p.id}`}
                className="flex items-center gap-2 hover:bg-muted/20 rounded-lg p-1 -mx-1 transition-colors"
              >
                {p.coverImageUrl ? (
                  <img src={p.coverImageUrl} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <ListMusic className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    @{p.user.username} · {p._count.tracks || p.trackCount} tracks
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
