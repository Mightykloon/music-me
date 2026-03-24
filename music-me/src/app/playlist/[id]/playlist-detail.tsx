"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Music, Play, Pause, ExternalLink, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  albumArtUrl: string | null;
  previewUrl: string | null;
  duration: number | null;
  externalUrl: string | null;
  provider: string;
}

interface PlaylistTrack {
  position: number;
  addedAt: string | null;
  track: Track;
}

interface PlaylistData {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  trackCount: number;
  provider: string;
  tracks: PlaylistTrack[];
  user: {
    id: string;
    username: string;
    displayName: string | null;
    profile: { profilePictureUrl: string | null } | null;
  };
}

function formatDuration(ms: number | null) {
  if (!ms) return "";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PlaylistDetail({ playlist }: { playlist: PlaylistData }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const handlePlay = (track: Track) => {
    if (!track.previewUrl) return;

    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(track.previewUrl);
    audio.volume = 0.5;
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(track.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 mx-auto sm:mx-0">
          {playlist.coverImageUrl ? (
            <Image
              src={playlist.coverImageUrl}
              alt={playlist.name}
              width={224}
              height={224}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Music className="w-16 h-16 text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-end text-center sm:text-left">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Playlist
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            <Link
              href={`/${playlist.user.username}`}
              className="flex items-center gap-2 hover:underline"
            >
              <Avatar
                src={playlist.user.profile?.profilePictureUrl}
                alt={playlist.user.displayName ?? playlist.user.username}
                size="sm"
              />
              <span className="text-sm font-medium">
                {playlist.user.displayName ?? playlist.user.username}
              </span>
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              {playlist.tracks.length} tracks
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {playlist.provider.toLowerCase().replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_3rem] sm:grid-cols-[2rem_1fr_1fr_4rem] gap-3 px-4 py-2 border-b border-border/50 text-xs text-muted-foreground">
          <span>#</span>
          <span>Title</span>
          <span className="hidden sm:block">Album</span>
          <span className="text-right">
            <Clock className="w-3 h-3 inline" />
          </span>
        </div>

        {playlist.tracks.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No tracks synced yet. Try re-syncing from your connections.
          </div>
        ) : (
          playlist.tracks.map((pt, i) => {
            const t = pt.track;
            const isPlaying = playingId === t.id;
            const hasPreview = !!t.previewUrl;

            return (
              <div
                key={`${t.id}-${i}`}
                className={`group grid grid-cols-[2rem_1fr_3rem] sm:grid-cols-[2rem_1fr_1fr_4rem] gap-3 px-4 py-2 items-center hover:bg-muted/30 transition-colors ${isPlaying ? "bg-primary/5" : ""}`}
              >
                <div className="text-center">
                  {hasPreview ? (
                    <button
                      onClick={() => handlePlay(t)}
                      className="w-6 h-6 flex items-center justify-center"
                    >
                      <span className="group-hover:hidden text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 text-primary hidden group-hover:block" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-foreground hidden group-hover:block" />
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  {t.albumArtUrl ? (
                    <Image
                      src={t.albumArtUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Music className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm truncate ${isPlaying ? "text-primary font-medium" : ""}`}
                    >
                      {t.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.artist}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                  {t.album ?? ""}
                </p>

                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(t.duration)}
                  </span>
                  {t.externalUrl && (
                    <a
                      href={t.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
