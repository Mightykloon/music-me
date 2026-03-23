"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import type { TrackInfo } from "@/types";

interface ProfileSongProps {
  track: TrackInfo;
  autoplay?: boolean;
  className?: string;
}

export function ProfileSong({
  track,
  autoplay = false,
  className,
}: ProfileSongProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(!autoplay);

  const embedUrl = getEmbedUrl(track);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 ${className ?? ""}`}
    >
      {/* Album art */}
      {track.albumArtUrl && (
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={track.albumArtUrl}
            alt={`${track.title} - ${track.artist}`}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Hidden embed iframe */}
      {isPlaying && embedUrl && (
        <iframe
          src={embedUrl}
          className="hidden"
          allow="autoplay; encrypted-media"
          title="Profile song player"
        />
      )}
    </div>
  );
}

function getEmbedUrl(track: TrackInfo): string | null {
  switch (track.provider) {
    case "SPOTIFY":
      return `https://open.spotify.com/embed/track/${track.providerTrackId}?utm_source=generator&theme=0`;
    case "SOUNDCLOUD":
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(track.externalUrl ?? "")}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`;
    case "YOUTUBE_MUSIC":
      return `https://www.youtube.com/embed/${track.providerTrackId}?autoplay=1`;
    default:
      return null;
  }
}
