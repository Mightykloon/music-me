"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, Music, Loader2, X } from "lucide-react";
import type { MusicTrackResult } from "@/lib/music/types";

interface TrackSearchInputProps {
  onSelect: (track: MusicTrackResult) => void;
  placeholder?: string;
  className?: string;
}

export function TrackSearchInput({
  onSelect,
  placeholder = "Search for a song...",
  className,
}: TrackSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicTrackResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/music/search?q=${encodeURIComponent(q)}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setOpen(true);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 400);
  };

  const handleSelect = (track: MusicTrackResult) => {
    onSelect(track);
    setQuery(track.title + " - " + track.artist);
    setOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-background shadow-xl max-h-80 overflow-y-auto">
          {results.map((track, i) => (
            <button
              key={`${track.provider}-${track.providerTrackId}-${i}`}
              onClick={() => handleSelect(track)}
              className="w-full flex items-center gap-3 p-2 hover:bg-muted transition-colors text-left"
            >
              {track.albumArtUrl ? (
                <Image
                  src={track.albumArtUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                  <Music className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artist}
                  {track.album && ` · ${track.album}`}
                </p>
              </div>
              <span className="text-xs text-muted-foreground capitalize">
                {track.provider.toLowerCase().replace("_", " ")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
