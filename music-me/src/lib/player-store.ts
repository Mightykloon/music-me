import { create } from "zustand";

export interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  albumArtUrl: string | null;
  previewUrl: string | null;
  externalUrl: string | null;
  provider?: string;
}

interface PlayerState {
  // Current track
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  progress: number; // seconds
  duration: number; // seconds
  volume: number; // 0-1

  // Queue
  queue: PlayerTrack[];
  queueIndex: number;

  // Actions
  play: (track: PlayerTrack) => void;
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  setProgress: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  queue: [],
  queueIndex: -1,

  play: (track) => {
    set({
      currentTrack: track,
      isPlaying: true,
      progress: 0,
      duration: 0,
      queue: [track],
      queueIndex: 0,
    });
  },

  playQueue: (tracks, startIndex = 0) => {
    const track = tracks[startIndex];
    if (!track) return;
    set({
      currentTrack: track,
      isPlaying: true,
      progress: 0,
      duration: 0,
      queue: tracks,
      queueIndex: startIndex,
    });
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),

  togglePlay: () => {
    const { isPlaying, currentTrack } = get();
    if (!currentTrack) return;
    set({ isPlaying: !isPlaying });
  },

  next: () => {
    const { queue, queueIndex } = get();
    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      set({
        currentTrack: queue[nextIndex],
        queueIndex: nextIndex,
        isPlaying: true,
        progress: 0,
        duration: 0,
      });
    } else {
      set({ isPlaying: false });
    }
  },

  previous: () => {
    const { queue, queueIndex, progress } = get();
    // If more than 3 seconds in, restart current track
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }
    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      set({
        currentTrack: queue[prevIndex],
        queueIndex: prevIndex,
        isPlaying: true,
        progress: 0,
        duration: 0,
      });
    }
  },

  setProgress: (seconds) => set({ progress: seconds }),
  setDuration: (seconds) => set({ duration: seconds }),
  seek: (seconds) => set({ progress: seconds }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  clearPlayer: () =>
    set({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      duration: 0,
      queue: [],
      queueIndex: -1,
    }),
}));
