"use client";

import Image from "next/image";
import { Music, ExternalLink, Disc3 } from "lucide-react";

interface PlaylistItem {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  trackCount: number;
  provider: string;
  isPinned: boolean;
}

interface PlaylistDisplayProps {
  playlists: PlaylistItem[];
  className?: string;
}

export function PlaylistDisplay({ playlists, className }: PlaylistDisplayProps) {
  if (playlists.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Disc3 className="w-4 h-4 text-[var(--profile-primary)]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Playlists</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {playlists.map((pl) => (
          <div key={pl.id} className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:bg-white/[0.05] hover:border-[var(--profile-primary)]/20 transition-all duration-300">
            <div className="flex items-center gap-3 p-3">
              {pl.coverImageUrl ? (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                  <Image src={pl.coverImageUrl} alt={pl.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[var(--profile-primary)]/20 to-[var(--profile-secondary)]/20 flex items-center justify-center flex-shrink-0">
                  <Music className="w-6 h-6 text-[var(--profile-primary)]/60" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate group-hover:text-[var(--profile-primary)] transition-colors">{pl.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pl.trackCount} tracks</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground mt-1 inline-block">{pl.provider.toLowerCase().replace("_", " ")}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
            {pl.description && <p className="text-xs text-muted-foreground px-3 pb-3 -mt-1 line-clamp-2">{pl.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
