import { create } from "zustand";
import type { FeedDisplayMode, FeedSource } from "@/types";

interface AppState {
  feedSource: FeedSource;
  feedDisplayMode: FeedDisplayMode;
  setFeedSource: (source: FeedSource) => void;
  setFeedDisplayMode: (mode: FeedDisplayMode) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  feedSource: "foryou",
  feedDisplayMode: "stream",
  setFeedSource: (source) => set({ feedSource: source }),
  setFeedDisplayMode: (mode) => set({ feedDisplayMode: mode }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
