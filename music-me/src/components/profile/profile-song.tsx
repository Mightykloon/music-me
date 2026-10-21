"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { usePlayerStore } from "@/lib/player-store";
import type { Customization } from "@/lib/profile/customization";
import type { TrackInfo } from "@/types";

interface ProfileSongProps {
  track: TrackInfo;
  autoplay?: boolean;
  skin?: Customization["songSkin"];
  className?: string;
}

// The profile song plays through the site's own player (so it keeps going
// while you browse, and finds a preview on Deezer when the track has none).
// "Autoplay" waits for the visitor's first click or key press on the page,
// because browsers block sound before that anyway.
export function ProfileSong({ track, autoplay = false, skin = "metro", className = "" }: ProfileSongProps) {
  const { currentTrack, isPlaying, progress, duration, play, togglePlay } = usePlayerStore();
  const isThis = currentTrack?.id === track.id;
  const playing = isThis && isPlaying;
  const pct = isThis && duration ? Math.min(100, (progress / duration) * 100) : 0;

  const start = () => {
    if (isThis) togglePlay();
    else
      play({
        id: track.id,
        title: track.title,
        artist: track.artist,
        albumArtUrl: track.albumArtUrl,
        previewUrl: track.previewUrl,
        externalUrl: track.externalUrl,
        provider: track.provider,
      });
  };

  useEffect(() => {
    if (!autoplay) return;
    const kick = () => {
      const s = usePlayerStore.getState();
      // never cut off something the visitor chose to play
      if (!s.currentTrack)
        s.play({
          id: track.id,
          title: track.title,
          artist: track.artist,
          albumArtUrl: track.albumArtUrl,
          previewUrl: track.previewUrl,
          externalUrl: track.externalUrl,
          provider: track.provider,
        });
    };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, [autoplay, track]);

  const PlayIcon = playing ? Pause : Play;
  const label = playing ? "Pause profile song" : "Play profile song";
  const art = track.albumArtUrl;

  if (skin === "winamp") {
    return (
      <div className={`profile-song song-winamp ${className}`} data-playing={playing}>
        <div className="song-winamp-title">
          <span>remixd amp</span>
          <span aria-hidden>▪ ▪ ▪</span>
        </div>
        <div className="song-winamp-body">
          <div className="song-winamp-lcd">
            <div className="song-winamp-scroll">
              <span>
                {track.artist} - {track.title} ***&nbsp;
              </span>
              <span aria-hidden>
                {track.artist} - {track.title} ***&nbsp;
              </span>
            </div>
            <div className="song-winamp-bars" aria-hidden>
              {Array.from({ length: 14 }, (_, i) => (
                <i key={i} style={{ animationDelay: `${(i * 137) % 900}ms` }} />
              ))}
            </div>
          </div>
          <div className="song-winamp-seek">
            <div style={{ width: `${pct}%` }} />
          </div>
          <button onClick={start} className="song-winamp-btn" aria-label={label}>
            <PlayIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (skin === "cassette") {
    return (
      <button onClick={start} className={`profile-song song-cassette ${className}`} data-playing={playing} aria-label={label}>
        <div className="song-cassette-label">
          <span className="song-cassette-side">A</span>
          <span className="truncate">{track.title}</span>
          <span className="truncate text-[0.7em] opacity-70">{track.artist}</span>
        </div>
        <div className="song-cassette-window">
          <span className="song-cassette-reel" />
          <span className="song-cassette-tape" style={{ ["--pct" as string]: `${pct}%` }} />
          <span className="song-cassette-reel" />
        </div>
        <span className="song-cassette-play">
          <PlayIcon className="h-3 w-3" />
        </span>
      </button>
    );
  }

  if (skin === "ipod") {
    return (
      <div className={`profile-song song-ipod ${className}`} data-playing={playing}>
        <div className="song-ipod-screen">
          <div className="song-ipod-bar">
            <span>{playing ? "▶" : "❚❚"}</span>
            <span>Now Playing</span>
            <span aria-hidden>▮</span>
          </div>
          <div className="song-ipod-track">
            {art && <Image src={art} alt="" width={56} height={56} className="song-ipod-art" />}
            <div className="min-w-0">
              <p className="truncate font-bold">{track.title}</p>
              <p className="truncate">{track.artist}</p>
            </div>
          </div>
          <div className="song-ipod-progress">
            <div style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="song-ipod-wheel">
          <span className="song-ipod-menu">MENU</span>
          <button onClick={start} className="song-ipod-center" aria-label={label}>
            <PlayIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (skin === "vinyl") {
    return (
      <div className={`profile-song song-vinyl ${className}`} data-playing={playing}>
        <button onClick={start} className="song-vinyl-record" aria-label={label}>
          <span className="song-vinyl-label" style={art ? { backgroundImage: `url("${art}")` } : undefined} />
          <span className="song-vinyl-play">
            <PlayIcon className="h-4 w-4" />
          </span>
        </button>
        <span className="song-vinyl-arm" aria-hidden />
        <div className="min-w-0">
          <p className="truncate font-semibold">{track.title}</p>
          <p className="truncate text-sm opacity-70">{track.artist}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`profile-song profile-card flex items-center gap-3 p-3 ${className}`} data-playing={playing}>
      {art && (
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden">
          <Image src={art} alt={`${track.title} - ${track.artist}`} fill className="object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.title}</p>
        <p className="truncate text-xs opacity-70">{track.artist}</p>
        <div className="mt-1.5 h-0.5 bg-white/10">
          <div className="h-full bg-[var(--profile-primary)] transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button onClick={start} className="p-2 transition-colors hover:bg-white/10" aria-label={label}>
        <PlayIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
