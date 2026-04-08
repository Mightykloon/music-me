"use client";

import Image from "next/image";
import { Play, Pause, ExternalLink, Music } from "lucide-react";
import type { TrackInfo } from "@/types";
import { usePlayerStore } from "@/lib/player-store";

interface EmbedPlayerProps {
  track: TrackInfo;
  compact?: boolean;
  className?: string;
}

export function EmbedPlayer({
  track,
  compact = false,
  className,
}: EmbedPlayerProps) {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  const isThisTrack = currentTrack?.id === track.id;
  const isThisPlaying = isThisTrack && isPlaying;

  const handlePlay = () => {
    if (isThisTrack) {
      togglePlay();
      return;
    }
    play({
      id: track.id,
      title: track.title,
      artist: track.artist,
      albumArtUrl: track.albumArtUrl,
      previewUrl: track.previewUrl,
      externalUrl: track.externalUrl,
      provider: track.provider,
    });
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/10 ${className ?? ""}`}
      >
        {track.albumArtUrl ? (
          <Image
            src={track.albumArtUrl}
            alt=""
            width={36}
            height={36}
            className="rounded"
          />
        ) : (
          <div className="w-9 h-9 rounded bg-muted flex items-center justify-center">
            <Music className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {track.artist}
          </p>
        </div>
        <button
          onClick={handlePlay}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          {isThisPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </button>
        {track.externalUrl && (
          <a
            href={track.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-muted-foreground"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  // Expanded mode
  return (
    <div
      className={`rounded-xl overflow-hidden border border-white/10 bg-black/20 ${className ?? ""}`}
    >
      <div className="flex items-center gap-4 p-4">
        {track.albumArtUrl ? (
          <Image
            src={track.albumArtUrl}
            alt={`${track.title} album art`}
            width={80}
            height={80}
            className="rounded-lg"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{track.title}</p>
          <p className="text-sm text-muted-foreground truncate">
            {track.artist}
          </p>
          {track.album && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {track.album}
            </p>
          )}
        </div>
        <button
          onClick={handlePlay}
          className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isThisPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
