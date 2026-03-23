"use client";

import Image from "next/image";
import { Headphones } from "lucide-react";
import type { TrackInfo } from "@/types";

interface NowPlayingBadgeProps {
  track: TrackInfo;
  className?: string;
}

export function NowPlayingBadge({ track, className }: NowPlayingBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--profile-primary)]/10 border border-[var(--profile-primary)]/20 ${className ?? ""}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--profile-primary)] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--profile-primary)]" />
      </span>
      <Headphones className="w-3.5 h-3.5 text-[var(--profile-primary)]" />
      {track.albumArtUrl && (
        <Image
          src={track.albumArtUrl}
          alt=""
          width={20}
          height={20}
          className="rounded-sm"
        />
      )}
      <span className="text-xs font-medium max-w-[200px] truncate">
        {track.title}
      </span>
      <span className="text-xs text-muted-foreground max-w-[120px] truncate">
        {track.artist}
      </span>
    </div>
  );
}
