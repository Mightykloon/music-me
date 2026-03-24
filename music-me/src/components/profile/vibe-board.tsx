"use client";

import Image from "next/image";
import { Music, Sparkles } from "lucide-react";

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
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-[var(--profile-primary)]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vibe Board</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-[var(--profile-primary)]/20 transition-all duration-300 group"
            style={{ gridColumn: item.colSpan ? `span ${item.colSpan}` : undefined, gridRow: item.rowSpan ? `span ${item.rowSpan}` : undefined }}
          >
            {item.type === "album" && item.imageUrl && (
              <div className="relative aspect-square">
                <Image src={item.imageUrl} alt={item.content} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <p className="text-xs font-semibold truncate drop-shadow-lg">{item.trackTitle}</p>
                  <p className="text-[10px] text-white/70 truncate">{item.trackArtist}</p>
                </div>
              </div>
            )}
            {item.type === "lyric" && (
              <div className="p-5 flex items-center justify-center min-h-[120px] bg-gradient-to-br from-[var(--profile-primary)]/5 to-transparent">
                <div className="text-center">
                  <p className="text-sm italic leading-relaxed text-foreground/90">&ldquo;{item.content}&rdquo;</p>
                  {item.trackTitle && <p className="text-[10px] text-muted-foreground mt-3 flex items-center justify-center gap-1"><Music className="w-3 h-3" />{item.trackTitle}</p>}
                </div>
              </div>
            )}
            {item.type === "image" && item.imageUrl && (
              <div className="relative aspect-square">
                <Image src={item.imageUrl} alt={item.content || "Vibe board image"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            {item.type === "text" && (
              <div className="p-5 flex items-center justify-center min-h-[100px] bg-gradient-to-br from-[var(--profile-primary)]/5 to-transparent">
                <p className="text-sm text-center text-foreground/80 leading-relaxed">{item.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
