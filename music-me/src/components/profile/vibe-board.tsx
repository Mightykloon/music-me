"use client";

import Image from "next/image";
import { Music } from "lucide-react";

interface VibeBoardItem {
  type: "album" | "lyric" | "image" | "text";
  content: string;
  imageUrl?: string;
  trackTitle?: string;
  trackArtist?: string;
  colSpan?: number;
  rowSpan?: number;
}

interface VibeBoardProps {
  items: VibeBoardItem[];
  className?: string;
}

export function VibeBoard({ items, className }: VibeBoardProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold font-[family-name:var(--profile-heading-font)] mb-3">
        Vibe Board
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`rounded-xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-sm ${
              item.colSpan === 2 ? "col-span-2" : ""
            } ${item.rowSpan === 2 ? "row-span-2" : ""}`}
            style={{
              gridColumn: item.colSpan ? `span ${item.colSpan}` : undefined,
              gridRow: item.rowSpan ? `span ${item.rowSpan}` : undefined,
            }}
          >
            {item.type === "album" && item.imageUrl && (
              <div className="relative aspect-square">
                <Image
                  src={item.imageUrl}
                  alt={item.content}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-medium truncate">{item.trackTitle}</p>
                  <p className="text-xs text-white/60 truncate">{item.trackArtist}</p>
                </div>
              </div>
            )}

            {item.type === "lyric" && (
              <div className="p-4 flex items-center justify-center min-h-[120px]">
                <div className="text-center">
                  <p className="text-sm italic leading-relaxed">
                    &ldquo;{item.content}&rdquo;
                  </p>
                  {item.trackTitle && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                      <Music className="w-3 h-3" />
                      {item.trackTitle}
                    </p>
                  )}
                </div>
              </div>
            )}

            {item.type === "image" && item.imageUrl && (
              <div className="relative aspect-square">
                <Image
                  src={item.imageUrl}
                  alt={item.content || "Vibe board image"}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {item.type === "text" && (
              <div className="p-4 flex items-center justify-center min-h-[100px]">
                <p className="text-sm text-center">{item.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
