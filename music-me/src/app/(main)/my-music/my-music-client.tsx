"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Using native <img> for external CDN cover art (Spotify uses many subdomains)
import {
  Library,
  RefreshCw,
  Link2,
  Unlink,
  Plus,
  Loader2,
  Music,
  CheckSquare,
  Square,
  Shield,
  ChevronDown,
  ChevronRight,
  Settings,
  ExternalLink,
  Play,
  Pause,
  Clock,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Disc3,
  ListMusic,
} from "lucide-react";
import toast from "react-hot-toast";

const PROVIDER_INFO: Record<string, { label: string; color: string; icon: string }> = {
  SPOTIFY: { label: "Spotify", color: "#1DB954", icon: "🟢" },
  APPLE_MUSIC: { label: "Apple Music", color: "#FC3C44", icon: "🍎" },
  SOUNDCLOUD: { label: "SoundCloud", color: "#FF5500", icon: "🟠" },
  YOUTUBE_MUSIC: { label: "YouTube Music", color: "#FF0000", icon: "🔴" },
  LASTFM: { label: "Last.fm", color: "#D51007", icon: "📻" },
  DEEZER: { label: "Deezer", color: "#A238FF", icon: "🟣" },
  TIDAL: { label: "Tidal", color: "#000000", icon: "🌊" },
};

interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  albumArtUrl: string | null;
  previewUrl: string | null;
  duration: number | null;
  externalUrl: string | null;
  provider: string;
}

interface PlaylistItem {
  id: string;
  provider: string;
  providerPlaylistId: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  trackCount: number;
  isPublic: boolean;
  isPinned: boolean;
  syncGroupId: string | null;
  importedAt: string;
  lastSyncedAt: string;
  _count: { tracks: number };
}

interface SyncGroup {
  id: string;
  name: string;
  parityPlaylistId: string | null;
  lastSyncedAt: string;
  createdAt: string;
  playlists: PlaylistItem[];
}

interface Connection {
  id: string;
  provider: string;
  providerUsername: string | null;
}

interface MyMusicClientProps {
  playlists: PlaylistItem[];
  connections: Connection[];
  syncGroups: SyncGroup[];
  recentTracks: TrackItem[];
}

type TabType = "playlists" | "tracks" | "sync";
type SortType = "default" | "date-new" | "date-old" | "name-az" | "name-za" | "tracks-most" | "tracks-least";

function formatDuration(ms: number | null) {
  if (!ms) return "";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function sortPlaylists(items: PlaylistItem[], sort: SortType): PlaylistItem[] {
  const sorted = [...items];
  switch (sort) {
    case "default":
      // Public first, then pinned, then alphabetical
      return sorted.sort((a, b) => {
        if (a.isPublic !== b.isPublic) return a.isPublic ? -1 : 1;
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    case "date-new":
      return sorted.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
    case "date-old":
      return sorted.sort((a, b) => new Date(a.importedAt).getTime() - new Date(b.importedAt).getTime());
    case "name-az":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-za":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "tracks-most":
      return sorted.sort((a, b) => (b._count.tracks || b.trackCount) - (a._count.tracks || a.trackCount));
    case "tracks-least":
      return sorted.sort((a, b) => (a._count.tracks || a.trackCount) - (b._count.tracks || b.trackCount));
    default:
      return sorted;
  }
}

export function MyMusicClient({ playlists, connections, syncGroups, recentTracks }: MyMusicClientProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("playlists");
  const [sortBy, setSortBy] = useState<SortType>("default");
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [parityId, setParityId] = useState<string | null>(null);
  const [syncGroupName, setSyncGroupName] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(syncGroups.map(g => g.id)));
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const handlePlay = async (track: TrackItem) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();

    let previewUrl = track.previewUrl;

    // If no Spotify preview, try Deezer as fallback (via server proxy to avoid CORS)
    if (!previewUrl) {
      try {
        const q = encodeURIComponent(`${track.artist} ${track.title}`);
        const dRes = await fetch(`/api/music/deezer-search?q=${q}&limit=1`);
        if (dRes.ok) {
          const dData = await dRes.json();
          previewUrl = dData.data?.[0]?.preview ?? null;
        }
      } catch { /* silent */ }
    }

    if (!previewUrl) {
      if (track.externalUrl) {
        window.open(track.externalUrl, "_blank");
      } else {
        toast.error("No preview available");
      }
      return;
    }

    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(track.id);
  };

  const sortedPlaylists = sortPlaylists(playlists, sortBy);
  const byProvider = sortedPlaylists.reduce<Record<string, PlaylistItem[]>>((acc, p) => {
    (acc[p.provider] ??= []).push(p);
    return acc;
  }, {});

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (parityId === id) setParityId(null);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

  // Sync a single playlist via server-side endpoint (uses user's token server-side)
  async function syncPlaylistServerSide(localPlaylistId: string): Promise<{ synced: number; total: number }> {
    const res = await fetch(`/api/music/playlists/${localPlaylistId}/fetch-tracks`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Server sync failed: ${res.status}`);
    }
    return res.json();
  }

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      // Step 1: Refresh playlist metadata from Spotify
      toast.loading("Refreshing playlists from Spotify...", { id: "sync-all" });
      const spotifyConnections = connections.filter(c => c.provider === "SPOTIFY");
      for (const conn of spotifyConnections) {
        try {
          await fetch(`/api/music/connections/${conn.id}/sync`, { method: "POST" });
        } catch {
          console.warn("Metadata sync failed for connection", conn.id);
        }
      }

      // Step 2: Get updated local playlists from DB
      const res = await fetch("/api/music/playlists");
      if (!res.ok) {
        toast.error("Failed to fetch playlists", { id: "sync-all" });
        return;
      }
      const data = await res.json();
      const allPlaylists: PlaylistItem[] = Array.isArray(data) ? data : (data.items ?? []);
      const spotifyPlaylists = allPlaylists.filter(p => p.provider === "SPOTIFY" && p.providerPlaylistId);

      if (spotifyPlaylists.length === 0) {
        toast.success("No Spotify playlists found", { id: "sync-all" });
        return;
      }

      // Step 3: Sync each playlist via server-side endpoint
      toast.loading(`Syncing ${spotifyPlaylists.length} playlists...`, { id: "sync-all" });
      setSyncProgress({ current: 0, total: spotifyPlaylists.length });
      let completed = 0;
      let failed = 0;
      let totalTracksSynced = 0;

      for (const pl of spotifyPlaylists) {
        try {
          const result = await syncPlaylistServerSide(pl.id);
          totalTracksSynced += result.synced ?? 0;
          if ((result.synced ?? 0) > 0) {
            completed++;
          } else {
            failed++;
            console.warn(`"${pl.name}": synced 0 tracks (total=${result.total})`);
          }
        } catch (err) {
          failed++;
          console.error(`Failed to sync "${pl.name}":`, err);
        }
        setSyncProgress({ current: completed + failed, total: spotifyPlaylists.length });
        toast.loading(`${completed}/${spotifyPlaylists.length} playlists · ${totalTracksSynced} tracks`, { id: "sync-all" });
        // 2s delay between playlists to avoid Spotify rate limits
        await new Promise(r => setTimeout(r, 2000));
      }

      if (completed > 0) {
        toast.success(`Done! ${completed} playlists · ${totalTracksSynced} tracks${failed > 0 ? ` (${failed} failed)` : ""}`, { id: "sync-all", duration: 5000 });
      } else if (failed > 0) {
        toast.error(`All ${failed} playlists failed — Spotify Dev Mode is blocking track access.`, { id: "sync-all", duration: 5000 });
      }
      router.refresh();
    } catch (err) {
      console.error("Sync all error:", err);
      toast.error(`Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`, { id: "sync-all" });
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleToggle = async (id: string, field: "isPublic" | "isPinned", value: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/music/playlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      toast.success(field === "isPublic" ? (value ? "Made public" : "Made private") : (value ? "Pinned to profile" : "Unpinned"));
      router.refresh();
    } catch {
      toast.error("Failed to update");
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateSyncGroup = async () => {
    if (selectedIds.size < 2) { toast.error("Select at least 2 playlists"); return; }
    if (!parityId) { toast.error("Select a parity (source) playlist"); return; }
    if (!syncGroupName.trim()) { toast.error("Enter a sync group name"); return; }
    try {
      const res = await fetch("/api/music/playlists/sync-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: syncGroupName.trim(), playlistIds: Array.from(selectedIds), parityPlaylistId: parityId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed"); }
      toast.success("Sync group created!");
      setShowSyncSetup(false);
      setSelectedIds(new Set());
      setParityId(null);
      setSyncGroupName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setDeletingGroup(groupId);
    try {
      const res = await fetch(`/api/music/playlists/sync-group?id=${groupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Sync group removed");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingGroup(null);
    }
  };

  const toggleGroupExpand = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const providerBadge = (provider: string) => {
    const info = PROVIDER_INFO[provider];
    if (!info) return null;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: info.color + "20", color: info.color }}>
        {info.icon} {info.label}
      </span>
    );
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "playlists", label: "Playlists", icon: <Disc3 className="w-4 h-4" />, count: playlists.length },
    { id: "tracks", label: "Tracks", icon: <ListMusic className="w-4 h-4" />, count: recentTracks.length },
    { id: "sync", label: "Sync Groups", icon: <Link2 className="w-4 h-4" />, count: syncGroups.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Library className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">My Music</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAll}
            disabled={syncing || connections.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncProgress
              ? `Syncing ${syncProgress.current}/${syncProgress.total}...`
              : syncing
                ? "Syncing..."
                : "Sync All"}
          </button>
          <Link href="/settings/connections" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Settings className="w-4 h-4" />
            Connections
          </Link>
        </div>
      </div>

      {/* No connections */}
      {connections.length === 0 && (
        <div className="text-center py-20">
          <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Connect your music services</h2>
          <p className="text-sm text-muted-foreground mb-4">Link Spotify, Apple Music, or other services to see your playlists here.</p>
          <Link href="/settings/connections" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Connect a Service
          </Link>
        </div>
      )}

      {/* Connected services chips */}
      {connections.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {connections.map((c) => {
            const info = PROVIDER_INFO[c.provider];
            return (
              <div key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 text-xs">
                <span>{info?.icon}</span>
                <span className="font-medium" style={{ color: info?.color }}>{info?.label}</span>
                {c.providerUsername && <span className="text-muted-foreground">@{c.providerUsername}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      {connections.length > 0 && (
        <div className="flex items-center gap-1 mb-6 border-b border-border/50 pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* PLAYLISTS TAB */}
      {activeTab === "playlists" && playlists.length > 0 && (
        <section>
          {/* Sort dropdown */}
          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="text-xs px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
              >
                <option value="default">Public first</option>
                <option value="date-new">Newest first</option>
                <option value="date-old">Oldest first</option>
                <option value="name-az">Name A–Z</option>
                <option value="name-za">Name Z–A</option>
                <option value="tracks-most">Most tracks</option>
                <option value="tracks-least">Fewest tracks</option>
              </select>
            </div>
          </div>
          {Object.entries(byProvider).map(([provider, pls]) => (
            <div key={provider} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                {providerBadge(provider)}
                <span className="text-xs text-muted-foreground">{pls.length} playlist{pls.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pls.map((p) => (
                  <div key={p.id} className="group relative rounded-xl border border-border/50 hover:border-primary/30 bg-card/50 hover:bg-card transition-all duration-200 overflow-hidden">
                    <Link href={`/playlist/${p.id}`} className="flex items-center gap-3 p-3">
                      {p.coverImageUrl ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                          <img src={p.coverImageUrl} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                          <Music className="w-7 h-7 text-primary/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{p.name}</span>
                          {p.syncGroupId && <Link2 className="w-3 h-3 text-primary flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{p._count.tracks} tracks</span>
                          <span>·</span>
                          <span>{p.trackCount} from {PROVIDER_INFO[p.provider]?.label}</span>
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Link>

                    {/* Controls bar */}
                    <div className="flex items-center gap-1 px-3 pb-2 pt-0">
                      <button
                        onClick={(e) => { e.preventDefault(); handleToggle(p.id, "isPublic", !p.isPublic); }}
                        disabled={togglingId === p.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          p.isPublic ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        }`}
                        title={p.isPublic ? "Make private" : "Make public"}
                      >
                        {p.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {p.isPublic ? "Public" : "Private"}
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleToggle(p.id, "isPinned", !p.isPinned); }}
                        disabled={togglingId === p.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          p.isPinned ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        }`}
                        title={p.isPinned ? "Unpin from profile" : "Pin to profile"}
                      >
                        {p.isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                        {p.isPinned ? "Pinned" : "Pin"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === "playlists" && playlists.length === 0 && connections.length > 0 && (
        <div className="text-center py-16">
          <RefreshCw className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No playlists imported yet. Sync your connected services to load them.</p>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sync Playlists
          </button>
        </div>
      )}

      {/* TRACKS TAB */}
      {activeTab === "tracks" && (
        <section>
          {recentTracks.length === 0 ? (
            <div className="text-center py-16">
              <ListMusic className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No tracks synced yet</p>
              <p className="text-xs text-muted-foreground">Sync your playlists to see individual tracks here.</p>
            </div>
          ) : (
            <div className="border border-border/50 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[2rem_1fr_3rem] sm:grid-cols-[2rem_1fr_1fr_4rem] gap-3 px-4 py-2 border-b border-border/50 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                <span>#</span>
                <span>Title</span>
                <span className="hidden sm:block">Album</span>
                <span className="text-right"><Clock className="w-3 h-3 inline" /></span>
              </div>
              {recentTracks.map((t, i) => {
                const isPlaying = playingId === t.id;
                const hasPreview = !!t.previewUrl;
                return (
                  <div
                    key={t.id}
                    className={`group grid grid-cols-[2rem_1fr_3rem] sm:grid-cols-[2rem_1fr_1fr_4rem] gap-3 px-4 py-2.5 items-center hover:bg-muted/30 transition-colors ${isPlaying ? "bg-primary/5" : ""}`}
                  >
                    <div className="text-center">
                      <button onClick={() => handlePlay(t)} className="w-6 h-6 flex items-center justify-center">
                        <span className="group-hover:hidden text-xs text-muted-foreground">{i + 1}</span>
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 text-primary hidden group-hover:block" />
                        ) : (
                          <Play className={`w-3.5 h-3.5 hidden group-hover:block ${hasPreview ? "text-foreground" : "text-muted-foreground"}`} />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      {t.albumArtUrl ? (
                        <img src={t.albumArtUrl} alt="" className="w-10 h-10 rounded flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Music className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm truncate ${isPlaying ? "text-primary font-medium" : ""}`}>{t.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate hidden sm:block">{t.album ?? ""}</p>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-muted-foreground">{formatDuration(t.duration)}</span>
                      {t.externalUrl && (
                        <a href={t.externalUrl} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SYNC GROUPS TAB */}
      {activeTab === "sync" && (
        <section>
          {/* Create sync group */}
          {playlists.length > 0 && (
            <div className="mb-6">
              {!showSyncSetup ? (
                <button
                  onClick={() => setShowSyncSetup(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/20 hover:border-primary/50 transition-colors w-full justify-center"
                >
                  <Link2 className="w-4 h-4" />
                  Create Sync Group (Link playlists across services)
                </button>
              ) : (
                <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-primary" />
                      New Sync Group
                    </h3>
                    <button onClick={() => { setShowSyncSetup(false); setSelectedIds(new Set()); setParityId(null); setSyncGroupName(""); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                  </div>
                  <input
                    type="text" value={syncGroupName} onChange={(e) => setSyncGroupName(e.target.value)}
                    placeholder="Sync group name (e.g. 'My Favorites')"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground mb-3">
                    Select playlists to link together, then choose one as <strong>parity</strong> (source of truth).
                  </p>
                  <div className="space-y-4 mb-4">
                    {Object.entries(byProvider).map(([provider, pls]) => (
                      <div key={provider}>
                        <div className="flex items-center gap-1.5 mb-2">{providerBadge(provider)}</div>
                        <div className="space-y-1">
                          {pls.filter((p) => !p.syncGroupId).map((p) => (
                            <div
                              key={p.id}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedIds.has(p.id) ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/30 border border-transparent"}`}
                              onClick={() => toggleSelect(p.id)}
                            >
                              {selectedIds.has(p.id) ? <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" /> : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                              {p.coverImageUrl ? <img src={p.coverImageUrl} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><Music className="w-4 h-4 text-muted-foreground" /></div>}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm truncate block">{p.name}</span>
                                <span className="text-xs text-muted-foreground">{p._count.tracks} tracks</span>
                              </div>
                              {selectedIds.has(p.id) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setParityId(parityId === p.id ? null : p.id); }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${parityId === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                >
                                  <Shield className="w-3 h-3 inline mr-0.5" />
                                  {parityId === p.id ? "PARITY" : "Set Parity"}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedIds.size > 0 && (
                    <div className="text-xs text-muted-foreground mb-3">
                      {selectedIds.size} selected
                      {parityId && <> · Parity: <strong>{playlists.find((p) => p.id === parityId)?.name}</strong></>}
                    </div>
                  )}
                  <button
                    onClick={handleCreateSyncGroup}
                    disabled={selectedIds.size < 2 || !parityId || !syncGroupName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Link2 className="w-4 h-4" />
                    Create Sync Group
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Existing groups */}
          {syncGroups.length > 0 ? (
            <div className="space-y-3">
              {syncGroups.map((group) => (
                <div key={group.id} className="border border-border/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleGroupExpand(group.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedGroups.has(group.id) ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <Link2 className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">{group.name}</span>
                      <span className="text-xs text-muted-foreground">{group.playlists.length} playlists linked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.playlists.map((p) => <span key={p.id}>{PROVIDER_INFO[p.provider]?.icon}</span>)}
                    </div>
                  </button>
                  {expandedGroups.has(group.id) && (
                    <div className="border-t border-border/30 px-4 py-2 space-y-1.5 bg-muted/5">
                      {group.playlists.map((p) => (
                        <Link key={p.id} href={`/playlist/${p.id}`} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/20 transition-colors">
                          {p.coverImageUrl ? <img src={p.coverImageUrl} alt="" className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Music className="w-5 h-5 text-muted-foreground" /></div>}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{p.name}</span>
                              {providerBadge(p.provider)}
                              {group.parityPlaylistId === p.id && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                                  <Shield className="w-3 h-3" />
                                  PARITY
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{p._count.tracks} tracks</span>
                          </div>
                        </Link>
                      ))}
                      <div className="flex justify-end pt-1 pb-1">
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          disabled={deletingGroup === group.id}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          {deletingGroup === group.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                          Unlink Group
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Link2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No sync groups yet. Link playlists across services to keep them in sync.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
