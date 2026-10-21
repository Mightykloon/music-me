"use client";

// Loaders and the little we use of YouTube's IFrame Player API and Spotify's
// iFrame API. Both are the services' official embeds, which is what makes
// full-length playback allowed: the music is streamed by them, not us.

export interface YTPlayer {
  loadVideoById(id: string, startSeconds?: number): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: (e: { data: number }) => void;
      };
    }
  ) => YTPlayer;
}

export const YT_STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

export interface SpotifyController {
  loadUri(uri: string): void;
  play(): void;
  pause(): void;
  resume(): void;
  seek(seconds: number): void;
  destroy(): void;
  addListener(
    event: "ready" | "playback_update",
    cb: (e: { data: { isPaused: boolean; isBuffering: boolean; duration: number; position: number } }) => void
  ): void;
}

interface SpotifyIFrameAPI {
  createController(
    el: HTMLElement,
    opts: { uri: string; width?: string | number; height?: string | number },
    cb: (controller: SpotifyController) => void
  ): void;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

function addScript(src: string) {
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
}

let ytPromise: Promise<YTNamespace> | null = null;
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (ytPromise) return ytPromise;
  ytPromise = new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    addScript("https://www.youtube.com/iframe_api");
  });
  return ytPromise;
}

let spPromise: Promise<SpotifyIFrameAPI> | null = null;
export function loadSpotifyApi(): Promise<SpotifyIFrameAPI> {
  if (spPromise) return spPromise;
  spPromise = new Promise((resolve) => {
    window.onSpotifyIframeApiReady = (api) => resolve(api);
    addScript("https://open.spotify.com/embed/iframe-api/v1");
  });
  return spPromise;
}
