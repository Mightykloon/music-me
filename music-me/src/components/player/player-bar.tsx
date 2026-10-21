"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, ExternalLink, Music } from "lucide-react";
import { usePlayerStore, type PlayerTrack } from "@/lib/player-store";
import { loadSpotifyApi, loadYouTubeApi, YT_STATE, type SpotifyController, type YTPlayer } from "@/lib/music/embed-apis";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Where the sound comes from:
//   youtube - the full song, in YouTube's player (kept visible, per YouTube's rules)
//   spotify - the full song for people logged into Spotify, 30s for everyone else
//   audio   - the 30 second preview, in a plain <audio> element
type Engine = "youtube" | "spotify" | "audio";
/** what the listener picked; "full" means YouTube when there's a match */
type Preference = "full" | "spotify" | "preview";

interface Sources {
  trackId: string;
  youtubeId: string | null;
  spotifyId: string | null;
  previewUrl: string | null;
  albumArtUrl: string | null;
}

const PREF_KEY = "remixd-player-source";

function readPref(): Preference {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return v === "spotify" || v === "preview" ? v : "full";
  } catch {
    return "full";
  }
}

/** Ask the server where a track can play; tracks that aren't saved fall back to a Deezer search. */
async function fetchSources(track: PlayerTrack, signal: AbortSignal): Promise<Sources> {
  const empty = { trackId: track.id, youtubeId: null, spotifyId: null, previewUrl: track.previewUrl, albumArtUrl: track.albumArtUrl };
  try {
    const res = await fetch(`/api/music/tracks/${encodeURIComponent(track.id)}/sources`, { signal });
    if (res.ok) return { ...empty, ...(await res.json()), trackId: track.id };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
  }
  if (empty.previewUrl) return empty;
  try {
    const r = await fetch(`/api/music/deezer-search?q=${encodeURIComponent(`${track.artist} ${track.title}`)}&limit=5`, { signal });
    const data = await r.json();
    return { ...empty, previewUrl: data.data?.find((d: { preview: string }) => d.preview)?.preview ?? null };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    return empty;
  }
}

export function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytHost = useRef<HTMLDivElement>(null);
  const ytPlayer = useRef<YTPlayer | null>(null);
  const ytVideo = useRef<string | null>(null);
  const spHost = useRef<HTMLDivElement>(null);
  const spController = useRef<SpotifyController | null>(null);
  const spUri = useRef<string | null>(null);
  // play() straight after loadUri() is ignored until the new song has loaded, so keep asking
  const spWantsPlay = useRef(false);

  const [sources, setSources] = useState<Sources | null>(null);
  // the bar only renders once something plays, so reading storage here can't mismatch the server render
  const [pref, setPref] = useState<Preference>(() => (typeof window === "undefined" ? "full" : readPref()));
  // engines that failed for a given track (e.g. the video can't be embedded)
  const [failed, setFailed] = useState<{ trackId: string; engines: Engine[] } | null>(null);

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

  const choose = (p: Preference) => {
    setPref(p);
    try {
      localStorage.setItem(PREF_KEY, p);
    } catch {
      /* private mode: remember for this page only */
    }
  };

  // look up sources whenever the track changes
  useEffect(() => {
    if (!currentTrack) return;
    const ctrl = new AbortController();
    fetchSources(currentTrack, ctrl.signal)
      .then(setSources)
      .catch(() => {});
    return () => ctrl.abort();
  }, [currentTrack]);

  const current = sources && currentTrack && sources.trackId === currentTrack.id ? sources : null;
  const loading = !!currentTrack && !current;
  const broken = failed && currentTrack && failed.trackId === currentTrack.id ? failed.engines : [];

  let engine: Engine | null = null;
  if (current) {
    if (pref === "spotify" && current.spotifyId && !broken.includes("spotify")) engine = "spotify";
    else if (pref !== "preview" && current.youtubeId && !broken.includes("youtube")) engine = "youtube";
    else if (current.previewUrl) engine = "audio";
  }
  const markFailed = useCallback(
    (e: Engine) => {
      const id = usePlayerStore.getState().currentTrack?.id;
      if (id) setFailed((f) => ({ trackId: id, engines: f?.trackId === id ? [...f.engines, e] : [e] }));
    },
    []
  );

  // ---------------------------------------------------------------- audio engine
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (engine !== "audio" || !current?.previewUrl) {
      audio.pause();
      return;
    }
    if (audio.src !== current.previewUrl) {
      audio.src = current.previewUrl;
      audio.load();
    }
    if (isPlaying) audio.play().catch(() => pause());
    else audio.pause();
  }, [engine, current?.previewUrl, isPlaying, pause]);

  // ---------------------------------------------------------------- youtube engine
  const youtubeId = engine === "youtube" ? current?.youtubeId ?? null : null;
  useEffect(() => {
    if (!youtubeId) {
      ytPlayer.current?.pauseVideo();
      return;
    }
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !ytHost.current) return;
      const p = ytPlayer.current;
      if (!p) {
        ytVideo.current = youtubeId;
        // the API swaps the element for its iframe, so give it one React doesn't own
        const el = document.createElement("div");
        ytHost.current.appendChild(el);
        ytPlayer.current = new YT.Player(el, {
          videoId: youtubeId,
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, controls: 1, modestbranding: 1 },
          events: {
            onReady: (e) => {
              e.target.setVolume(Math.round(usePlayerStore.getState().volume * 100));
              if (usePlayerStore.getState().isPlaying) e.target.playVideo();
            },
            onStateChange: (e) => {
              const s = usePlayerStore.getState();
              if (e.data === YT_STATE.ENDED) s.next();
              else if (e.data === YT_STATE.PLAYING && !s.isPlaying) s.resume();
              else if (e.data === YT_STATE.PAUSED && s.isPlaying) s.pause();
            },
            // 100: removed, 101/150: owner doesn't allow embedding
            onError: () => markFailed("youtube"),
          },
        });
      } else if (ytVideo.current !== youtubeId) {
        ytVideo.current = youtubeId;
        p.loadVideoById(youtubeId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [youtubeId, markFailed]);

  useEffect(() => {
    const p = ytPlayer.current;
    if (!youtubeId || !p?.getPlayerState) return;
    if (isPlaying) p.playVideo();
    else p.pauseVideo();
  }, [isPlaying, youtubeId]);

  // progress from the video, and noticing when the browser blocked autoplay
  useEffect(() => {
    if (!youtubeId) return;
    let stalled = 0;
    const t = setInterval(() => {
      const p = ytPlayer.current;
      if (!p?.getCurrentTime) return;
      setProgress(p.getCurrentTime());
      const d = p.getDuration();
      if (d) setDuration(d);
      const state = p.getPlayerState();
      const s = usePlayerStore.getState();
      if (s.isPlaying && (state === YT_STATE.UNSTARTED || state === YT_STATE.CUED)) {
        if (++stalled >= 5) s.pause(); // show a play button the listener can press
      } else stalled = 0;
    }, 500);
    return () => clearInterval(t);
  }, [youtubeId, setProgress, setDuration]);

  // ---------------------------------------------------------------- spotify engine
  const spotifyId = engine === "spotify" ? current?.spotifyId ?? null : null;
  useEffect(() => {
    if (!spotifyId) {
      spController.current?.pause();
      return;
    }
    const uri = `spotify:track:${spotifyId}`;
    let cancelled = false;
    loadSpotifyApi().then((api) => {
      if (cancelled || !spHost.current) return;
      if (!spController.current) {
        spUri.current = uri;
        const el = document.createElement("div");
        spHost.current.appendChild(el);
        api.createController(el, { uri, width: "100%", height: 80 }, (c) => {
          spController.current = c;
          c.addListener("ready", () => {
            if (usePlayerStore.getState().isPlaying) c.play();
          });
          c.addListener("playback_update", (e) => {
            const { isPaused, position, duration: d } = e.data;
            setProgress(position / 1000);
            if (d) setDuration(d / 1000);
            const s = usePlayerStore.getState();
            if (!isPaused) spWantsPlay.current = false;
            if (isPaused && spWantsPlay.current && s.isPlaying) c.play();
            else if (isPaused && d > 0 && position >= d - 400) s.next();
            else if (!isPaused && !s.isPlaying) s.resume();
          });
        });
      } else if (spUri.current !== uri) {
        spUri.current = uri;
        const c = spController.current;
        spWantsPlay.current = usePlayerStore.getState().isPlaying;
        c.loadUri(uri);
        c.play();
        // and once more in case no update arrives while it loads
        setTimeout(() => spWantsPlay.current && c.play(), 900);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [spotifyId, setProgress, setDuration]);

  useEffect(() => {
    const c = spController.current;
    if (!spotifyId || !c) return;
    if (isPlaying) c.resume();
    else c.pause();
  }, [isPlaying, spotifyId]);

  // ---------------------------------------------------------------- shared controls
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    ytPlayer.current?.setVolume?.(Math.round(volume * 100));
  }, [volume]);

  const onSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const time = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
      if (engine === "youtube") ytPlayer.current?.seekTo(time, true);
      else if (engine === "spotify") spController.current?.seek(time);
      else if (audioRef.current) audioRef.current.currentTime = time;
      seek(time);
    },
    [duration, engine, seek]
  );

  const handleTimeUpdate = useCallback(() => {
    if (engine === "audio" && audioRef.current) setProgress(audioRef.current.currentTime);
  }, [engine, setProgress]);
  const handleLoadedMetadata = useCallback(() => {
    if (engine === "audio" && audioRef.current) setDuration(audioRef.current.duration);
  }, [engine, setDuration]);
  const handleEnded = useCallback(() => {
    if (engine === "audio") next();
  }, [engine, next]);

  const close = () => {
    ytPlayer.current?.pauseVideo();
    spController.current?.pause();
    audioRef.current?.pause();
    clearPlayer();
  };

  const hasNext = queueIndex < queue.length - 1;
  const hasPrev = queueIndex > 0 || progress > 3;
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const art = currentTrack?.albumArtUrl ?? current?.albumArtUrl ?? null;
  const showVideo = !!currentTrack && engine === "youtube";
  const showSpotify = !!currentTrack && engine === "spotify";

  const chip = (p: Preference, label: string, available: boolean) =>
    available && (
      <button
        key={p}
        onClick={() => choose(p)}
        aria-pressed={pref === p}
        className={`px-2 py-0.5 text-[11px] lowercase transition-colors ${pref === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        title={
          p === "full" ? "Full song via YouTube" : p === "spotify" ? "Full song if you're logged into Spotify" : "30 second preview"
        }
      >
        {label}
      </button>
    );

  return (
    <>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} preload="auto" />

      {/* The embedded players stay mounted once created (recreating them is
          slow) and are only shown while in use. YouTube's must stay visible
          and at least 200x200 while it plays. */}
      <div
        className={`fixed right-3 bottom-[76px] z-50 w-[min(356px,calc(100vw-24px))] border border-border bg-background shadow-2xl ${showVideo ? "" : "hidden"}`}
      >
        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-muted-foreground">
          <span>playing the full song from YouTube</span>
          <button onClick={() => choose("preview")} className="hover:text-foreground" title="Switch to the 30s preview (hides the video)">
            preview instead
          </button>
        </div>
        <div className="aspect-video min-h-[200px] w-full">
          <div ref={ytHost} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
        </div>
      </div>
      <div className={`fixed right-3 bottom-[76px] z-50 w-[min(356px,calc(100vw-24px))] ${showSpotify ? "" : "hidden"}`}>
        <div ref={spHost} />
      </div>

      {currentTrack && (
        <>
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border">
            <div className="h-1 cursor-pointer group relative" onClick={onSeek}>
              <div className="absolute inset-0 bg-muted/50" />
              <div className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-100" style={{ width: `${progressPct}%` }} />
              <div className="absolute inset-0 bg-transparent group-hover:bg-muted/20 transition-colors" />
            </div>

            <div className="flex items-center gap-3 px-4 py-2 max-w-screen-2xl mx-auto">
              {/* Track info */}
              <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
                {art ? (
                  <img src={art} alt="" className="w-11 h-11 object-cover flex-shrink-0 shadow-lg" />
                ) : (
                  <div className="w-11 h-11 bg-muted flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentTrack.artist}
                    {engine === "audio" && <span className="ml-1.5 opacity-70">· 30s preview</span>}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button onClick={previous} disabled={!hasPrev} className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-30" aria-label="Previous">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={isPlaying ? pause : resume}
                  disabled={loading || !engine}
                  className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  title={!loading && !engine ? "Nothing playable found for this song" : undefined}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
                <button onClick={next} disabled={!hasNext} className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-30" aria-label="Next">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <span className="text-[11px] text-muted-foreground tabular-nums w-20 text-center hidden sm:block">
                {formatTime(progress)} / {formatTime(duration)}
              </span>

              {/* source picker */}
              {current && (current.youtubeId || current.spotifyId) && (
                <div className="hidden md:flex border border-border" role="group" aria-label="Play from">
                  {chip("full", "full", !!current.youtubeId)}
                  {chip("spotify", "spotify", !!current.spotifyId)}
                  {chip("preview", "30s", !!current.previewUrl)}
                </div>
              )}

              {/* Volume + actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors hidden sm:flex"
                  aria-label={volume === 0 ? "Unmute" : "Mute"}
                >
                  {volume === 0 ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
                </button>
                <div
                  className="w-20 h-1.5 rounded-full bg-muted cursor-pointer hidden sm:block"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                  }}
                >
                  <div className="h-full rounded-full bg-muted-foreground/50" style={{ width: `${volume * 100}%` }} />
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
                <button onClick={close} className="p-1.5 rounded-full hover:bg-muted transition-colors" title="Close player">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
          {/* Spacer to prevent content from being hidden behind fixed player */}
          <div className="h-16" />
        </>
      )}
    </>
  );
}
