"use client";

import { useState } from "react";
import Image from "next/image";
import { Music, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (playlists.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold font-[family-name:var(--profile-heading-font)] mb-3">
        Playlists
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedId(expandedId === pl.id ? null : pl.id)
              }
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
                  {pl.trackCount} tracks · {pl.provider.toLowerCase().replace("_", " ")}
                </p>
              </div>
              {expandedId === pl.id ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedId === pl.id && (
              <div className="px-3 pb-3 border-t border-white/5">
                {pl.description && (
                  <p className="text-xs text-muted-foreground mt-2 mb-2">
                    {pl.description}
                  </p>
                )}
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-xs text-[var(--profile-primary)] hover:underline mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in {pl.provider.toLowerCase().replace("_", " ")}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
