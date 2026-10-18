"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Pause, ExternalLink, Music } from "lucide-react";
import type { TrackInfo } from "@/types";

interface EmbedPlayerProps {
  track: TrackInfo;
  compact?: boolean;
  autoplay?: boolean;
  className?: string;
}

export function EmbedPlayer({
  track,
  compact = false,
  autoplay = false,
  className,
}: EmbedPlayerProps) {
  const [playing, setPlaying] = useState(autoplay);
  const embedUrl = getEmbedUrl(track);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 pr-2 bg-muted ${className ?? ""}`}
      >
        {track.albumArtUrl ? (
          <Image
            src={track.albumArtUrl}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-primary flex items-center justify-center">
            <Music className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {track.artist}
          </p>
        </div>
        <button
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "pause" : "play"}
          className="metro-appbar-icon h-8 w-8 transition-colors hover:border-primary hover:bg-primary hover:text-white"
        >
          {playing ? (
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
            aria-label="open in music app"
            className="p-1.5 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {playing && embedUrl && (
          <iframe
            src={embedUrl}
            className="hidden"
            allow="autoplay; encrypted-media"
            title={`Playing ${track.title}`}
          />
        )}
      </div>
    );
  }

  // Expanded mode
  return (
    <div
      className={`overflow-hidden bg-muted ${className ?? ""}`}
    >
      {embedUrl && playing ? (
        <iframe
          src={embedUrl}
          width="100%"
          height={track.provider === "YOUTUBE_MUSIC" ? 200 : 152}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={`${track.title} - ${track.artist}`}
          className="border-0"
        />
      ) : (
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
            <div className="w-20 h-20 bg-primary flex items-center justify-center">
              <Music className="w-8 h-8 text-white" strokeWidth={1.5} />
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
            onClick={() => setPlaying(true)}
            className="metro-appbar-icon h-12 w-12 transition-colors hover:border-primary hover:bg-primary hover:text-white"
          >
            <Play className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function getEmbedUrl(track: TrackInfo): string | null {
  switch (track.provider) {
    case "SPOTIFY":
      return `https://open.spotify.com/embed/track/${track.providerTrackId}?utm_source=generator&theme=0`;
    case "APPLE_MUSIC":
      return `https://embed.music.apple.com/us/song/${track.providerTrackId}`;
    case "SOUNDCLOUD":
      return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${track.providerTrackId}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=true`;
    case "YOUTUBE_MUSIC":
      return `https://www.youtube.com/embed/${track.providerTrackId}?autoplay=1`;
    case "DEEZER":
      return `https://widget.deezer.com/widget/dark/track/${track.providerTrackId}`;
    default:
      return null;
  }
}
