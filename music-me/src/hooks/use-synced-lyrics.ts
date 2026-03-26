"use client";

import { useState, useEffect, useMemo } from "react";
import type { SyncedLyricLine } from "@/lib/music/lyrics";

interface UseSyncedLyricsOptions {
  trackTitle: string;
  trackArtist: string;
  currentTime: number; // ms
  enabled?: boolean;
}

interface UseSyncedLyricsResult {
  lyrics: SyncedLyricLine[];
  currentLine: SyncedLyricLine | null;
  currentIndex: number;
  loading: boolean;
  error: string | null;
  synced: boolean;
}

export function useSyncedLyrics({
  trackTitle,
  trackArtist,
  currentTime,
  enabled = true,
}: UseSyncedLyricsOptions): UseSyncedLyricsResult {
  const [lyrics, setLyrics] = useState<SyncedLyricLine[]>([]);
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!enabled || !trackTitle || !trackArtist) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLyrics([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `/api/music/lyrics?title=${encodeURIComponent(trackTitle)}&artist=${encodeURIComponent(trackArtist)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setLyrics([]);
        } else {
          setLyrics(data.lines ?? []);
          setSynced(data.synced ?? false);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load lyrics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trackTitle, trackArtist, enabled]);

  // Find current line based on playback position
  const currentIndex = useMemo(() => {
    if (!synced || lyrics.length === 0) return -1;

    // Binary search for the current line
    let lo = 0;
    let hi = lyrics.length - 1;
    let result = -1;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (lyrics[mid].time <= currentTime) {
        result = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return result;
  }, [lyrics, currentTime, synced]);

  const currentLine = useMemo(() => {
    return currentIndex >= 0 ? lyrics[currentIndex] : null;
  }, [lyrics, currentIndex]);

  return {
    lyrics,
    currentLine,
    currentIndex,
    loading,
    error,
    synced,
  };
}
