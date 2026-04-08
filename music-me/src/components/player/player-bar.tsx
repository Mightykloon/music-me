"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  Music,
} from "lucide-react";
import { usePlayerStore } from "@/lib/player-store";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    queue,
    queueIndex,
    pause,
    resume,
    next,
    previous,
    setProgress,
    setDuration,
    seek,
    setVolume,
    clearPlayer,
  } = usePlayerStore();

  // Fetch Deezer preview URL when track changes
  useEffect(() => {
    if (!currentTrack) {
      setPreviewUrl(null);
      return;
    }

    // If track already has a preview URL, use it
    if (currentTrack.previewUrl) {
      setPreviewUrl(currentTrack.previewUrl);
      return;
    }

    // Otherwise search Deezer for a preview
    setLoading(true);
    const query = `${currentTrack.artist} ${currentTrack.title}`;
    fetch(`/api/music/deezer-search?q=${encodeURIComponent(query)}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        const hit = data.data?.find((d: { preview: string }) => d.preview);
        setPreviewUrl(hit?.preview ?? null);
      })
      .catch(() => setPreviewUrl(null))
      .finally(() => setLoading(false));
  }, [currentTrack]);

  // Control audio element when play state or preview URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !previewUrl) return;

    if (audio.src !== previewUrl) {
      audio.src = previewUrl;
      audio.load();
    }

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, previewUrl]);

  // Seek
  const seekRef = useRef(false);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekRef.current) return;
    // Only external seek (from store) - handled via onSeek
  }, [progress]);

  const onSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = pct * duration;
      audio.currentTime = time;
      seek(time);
    },
    [duration, seek]
  );

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) setProgress(audioRef.current.currentTime);
  }, [setProgress]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  }, [setDuration]);

  const handleEnded = useCallback(() => {
    next();
  }, [next]);

  if (!currentTrack) return null;

  const hasNext = queueIndex < queue.length - 1;
  const hasPrev = queueIndex > 0 || progress > 3;
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border">
        {/* Progress bar - thin line at top of player */}
        <div
          className="h-1 cursor-pointer group relative"
          onClick={onSeek}
        >
          <div className="absolute inset-0 bg-muted/50" />
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-100"
            style={{ width: `${progressPct}%` }}
          />
          <div className="absolute inset-0 bg-transparent group-hover:bg-muted/20 transition-colors" />
        </div>

        <div className="flex items-center gap-3 px-4 py-2 max-w-screen-2xl mx-auto">
          {/* Track info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
            {currentTrack.albumArtUrl ? (
              <img
                src={currentTrack.albumArtUrl}
                alt=""
                className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-lg"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={previous}
              disabled={!hasPrev}
              className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-30"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={isPlaying ? pause : resume}
              disabled={loading || !previewUrl}
              className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button
              onClick={next}
              disabled={!hasNext}
              className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-30"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Time */}
          <span className="text-[11px] text-muted-foreground tabular-nums w-20 text-center hidden sm:block">
            {formatTime(progress)} / {formatTime(duration)}
          </span>

          {/* Volume + actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors hidden sm:flex"
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            <div
              className="w-20 h-1.5 rounded-full bg-muted cursor-pointer hidden sm:block"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setVolume(pct);
              }}
            >
              <div
                className="h-full rounded-full bg-muted-foreground/50"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
            {currentTrack.externalUrl && (
              <a
                href={currentTrack.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                title="Open in streaming service"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            )}
            <button
              onClick={clearPlayer}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              title="Close player"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
      {/* Spacer to prevent content from being hidden behind fixed player */}
      <div className="h-16" />
    </>
  );
}
