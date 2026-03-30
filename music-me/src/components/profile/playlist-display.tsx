"use client";

import { useState } from "react";
import Image from "next/image";
import { Music, ChevronDown, ChevronUp, Clock, ExternalLink } from "lucide-react";

interface TrackItem {
  position: number;
  track: {
    id: string;
    title: string;
    artist: string;
    album: string | null;
    albumArtUrl: string | null;
    duration: number | null;
    externalUrl: string | null;
  };
}

interface PlaylistItem {
  id: string;
  providerPlaylistId: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  trackCount: number;
  provider: string;
  isPinned: boolean;
  tracks: TrackItem[];
}

interface PlaylistDisplayProps {
  playlists: PlaylistItem[];
  className?: string;
}

function getEmbedUrl(provider: string, providerPlaylistId: string): string | null {
  switch (provider) {
    case "SPOTIFY":
      return `https://open.spotify.com/embed/playlist/${providerPlaylistId}?utm_source=generator&theme=0`;
    case "SOUNDCLOUD":
      return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/${providerPlaylistId}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
    case "DEEZER":
      return `https://widget.deezer.com/widget/dark/playlist/${providerPlaylistId}`;
    case "APPLE_MUSIC":
      return `https://embed.music.apple.com/playlist/${providerPlaylistId}?theme=dark`;
    default:
      return null;
  }
}

function formatDuration(ms: number | null): string {
  if (!ms) return "";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PlaylistDisplay({ playlists, className }: PlaylistDisplayProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (playlists.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold font-[family-name:var(--profile-heading-font)] mb-3">
        Playlists
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {playlists.map((pl) => {
          const embedUrl = getEmbedUrl(pl.provider, pl.providerPlaylistId);
          const isExpanded = expandedId === pl.id;
          const hasTracks = pl.tracks && pl.tracks.length > 0;
          const displayCount = hasTracks ? pl.tracks.length : pl.trackCount;

          return (
            <div
              key={pl.id}
              className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : pl.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
              >
                {pl.coverImageUrl ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={pl.coverImageUrl}
                      alt={pl.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{pl.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {displayCount > 0 && <>{displayCount} tracks &middot; </>}
                    {pl.provider.toLowerCase().replace("_", " ")}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-white/5">
                  {pl.description && (
                    <p className="text-sm text-muted-foreground px-4 pt-3 pb-3">
                      {pl.description}
                    </p>
                  )}

                  {/* Our own track list from DB */}
                  {hasTracks ? (
                    <div className="px-2">
                      {/* Track list header */}
                      <div className="flex items-center gap-3 px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-white/5">
                        <span className="w-6 text-center">#</span>
                        <span className="flex-1">Title</span>
                        <Clock className="w-3 h-3" />
                      </div>

                      {/* Tracks */}
                      <div className="max-h-[480px] overflow-y-auto scrollbar-hide">
                        {pl.tracks.map((pt) => (
                          <a
                            key={pt.track.id}
                            href={pt.track.externalUrl ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                          >
                            <span className="w-6 text-center text-xs text-muted-foreground">
                              {pt.position + 1}
                            </span>
                            {pt.track.albumArtUrl ? (
                              <div className="relative w-9 h-9 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={pt.track.albumArtUrl}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                                <Music className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate group-hover:text-[var(--profile-primary)] transition-colors">
                                {pt.track.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {pt.track.artist}
                                {pt.track.album && (
                                  <> &middot; {pt.track.album}</>
                                )}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatDuration(pt.track.duration)}
                            </span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : embedUrl ? (
                    /* Fallback to embed when no tracks synced yet */
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="600"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-b-xl"
                      style={{
                        borderRadius: "0 0 12px 12px",
                        background: "transparent",
                      }}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground p-3">
                      No tracks available.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
