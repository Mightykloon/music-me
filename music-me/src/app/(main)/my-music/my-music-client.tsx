"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Trash2,
  Settings,
  ExternalLink,
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
}

export function MyMusicClient({ playlists, connections, syncGroups }: MyMusicClientProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [parityId, setParityId] = useState<string | null>(null);
  const [syncGroupName, setSyncGroupName] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(syncGroups.map(g => g.id)));
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);

  // Group playlists by provider
  const byProvider = playlists.reduce<Record<string, PlaylistItem[]>>((acc, p) => {
    (acc[p.provider] ??= []).push(p);
    return acc;
  }, {});

  const ungroupedPlaylists = playlists.filter((p) => !p.syncGroupId);

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

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      for (const conn of connections) {
        await fetch(`/api/music/connections/${conn.id}/sync`, { method: "POST" });
      }
      toast.success("Playlists synced!");
      router.refresh();
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateSyncGroup = async () => {
    if (selectedIds.size < 2) {
      toast.error("Select at least 2 playlists");
      return;
    }
    if (!parityId) {
      toast.error("Select a parity (source) playlist");
      return;
    }
    if (!syncGroupName.trim()) {
      toast.error("Enter a sync group name");
      return;
    }

    try {
      const res = await fetch("/api/music/playlists/sync-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: syncGroupName.trim(),
          playlistIds: Array.from(selectedIds),
          parityPlaylistId: parityId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
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
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
        style={{ backgroundColor: info.color + "20", color: info.color }}
      >
        {info.icon} {info.label}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Library className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
            My Music
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAll}
            disabled={syncing || connections.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Sync All
          </button>
          <Link
            href="/settings/connections"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4" />
            Connections
          </Link>
        </div>
      </div>

      {/* No connections state */}
      {connections.length === 0 && (
        <div className="text-center py-20">
          <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Connect your music services</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Link Spotify, Apple Music, or other services to see your playlists here.
          </p>
          <Link
            href="/settings/connections"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
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
              <div
                key={c.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 text-xs"
              >
                <span>{info?.icon}</span>
                <span className="font-medium" style={{ color: info?.color }}>
                  {info?.label}
                </span>
                {c.providerUsername && (
                  <span className="text-muted-foreground">@{c.providerUsername}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sync Groups */}
      {syncGroups.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Link2 className="w-4 h-4" />
            Sync Groups
          </h2>
          <div className="space-y-3">
            {syncGroups.map((group) => (
              <div
                key={group.id}
                className="border border-border/50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleGroupExpand(group.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Link2 className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{group.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {group.playlists.length} playlists linked
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {group.playlists.map((p) => (
                      <span key={p.id}>{PROVIDER_INFO[p.provider]?.icon}</span>
                    ))}
                  </div>
                </button>

                {expandedGroups.has(group.id) && (
                  <div className="border-t border-border/30 px-4 py-2 space-y-1.5 bg-muted/5">
                    {group.playlists.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 py-2 px-2 rounded-lg"
                      >
                        {p.coverImageUrl ? (
                          <img
                            src={p.coverImageUrl}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Music className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
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
                          <span className="text-xs text-muted-foreground">
                            {p._count.tracks} tracks
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1 pb-1">
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        disabled={deletingGroup === group.id}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        {deletingGroup === group.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Unlink className="w-3 h-3" />
                        )}
                        Unlink Group
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create sync group */}
      {playlists.length > 0 && (
        <section className="mb-8">
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
                <button
                  onClick={() => {
                    setShowSyncSetup(false);
                    setSelectedIds(new Set());
                    setParityId(null);
                    setSyncGroupName("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={syncGroupName}
                onChange={(e) => setSyncGroupName(e.target.value)}
                placeholder="Sync group name (e.g. 'My Favorites')"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />

              <p className="text-xs text-muted-foreground mb-3">
                Select playlists to link together, then choose one as <strong>parity</strong> (source of truth).
                The parity playlist&apos;s tracks will be synced to all others in the group.
              </p>

              {/* Playlist selection by provider */}
              <div className="space-y-4 mb-4">
                {Object.entries(byProvider).map(([provider, pls]) => (
                  <div key={provider}>
                    <div className="flex items-center gap-1.5 mb-2">
                      {providerBadge(provider)}
                    </div>
                    <div className="space-y-1">
                      {pls.filter((p) => !p.syncGroupId).map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            selectedIds.has(p.id) ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/30 border border-transparent"
                          }`}
                          onClick={() => toggleSelect(p.id)}
                        >
                          {selectedIds.has(p.id) ? (
                            <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                          {p.coverImageUrl ? (
                            <img src={p.coverImageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              <Music className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">{p.name}</span>
                            <span className="text-xs text-muted-foreground">{p._count.tracks} tracks</span>
                          </div>
                          {selectedIds.has(p.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setParityId(parityId === p.id ? null : p.id);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                                parityId === p.id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
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
                  {parityId && (
                    <> · Parity: <strong>{playlists.find((p) => p.id === parityId)?.name}</strong></>
                  )}
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
        </section>
      )}

      {/* All Playlists */}
      {playlists.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            All Playlists ({playlists.length})
          </h2>

          {Object.entries(byProvider).map(([provider, pls]) => (
            <div key={provider} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                {providerBadge(provider)}
                <span className="text-xs text-muted-foreground">
                  {pls.length} playlist{pls.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1">
                {pls.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/20 transition-colors group"
                  >
                    {p.coverImageUrl ? (
                      <img
                        src={p.coverImageUrl}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Music className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        {p.syncGroupId && (
                          <Link2 className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                        {p.isPinned && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            Pinned
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{p._count.tracks} tracks</span>
                        <span>·</span>
                        <span>{p.isPublic ? "Public" : "Private"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {playlists.length === 0 && connections.length > 0 && (
        <div className="text-center py-16">
          <RefreshCw className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            No playlists imported yet. Sync your connected services to load them.
          </p>
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
    </div>
  );
}
