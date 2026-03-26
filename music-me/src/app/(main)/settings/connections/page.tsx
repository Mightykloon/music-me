"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Star,
  Unplug,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Music,
  ListMusic,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Connection {
  id: string;
  provider: string;
  providerUsername: string | null;
  isActive: boolean;
  isPrimary: boolean;
  connectedAt: string;
}

const PROVIDER_INFO: Record<
  string,
  { name: string; color: string; description: string }
> = {
  SPOTIFY: {
    name: "Spotify",
    color: "#1DB954",
    description: "Stream, playlists, now playing, top tracks & artists",
  },
  APPLE_MUSIC: {
    name: "Apple Music",
    color: "#FC3C44",
    description: "Playlists, search, 30-second previews",
  },
  SOUNDCLOUD: {
    name: "SoundCloud",
    color: "#FF5500",
    description: "Playlists, full streaming for public tracks",
  },
  YOUTUBE_MUSIC: {
    name: "YouTube Music",
    color: "#FF0000",
    description: "Playlists, search, video embeds",
  },
  LASTFM: {
    name: "Last.fm",
    color: "#D51007",
    description: "Scrobbling data, listening history, taste matching",
  },
  DEEZER: {
    name: "Deezer",
    color: "#A238FF",
    description: "Playlists, 30-second previews, search",
  },
};

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("success")) {
      toast.success("Service connected successfully!");
    }
    if (searchParams.get("error")) {
      toast.error(`Connection failed: ${searchParams.get("error")}`);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/music/connections")
      .then((r) => r.json())
      .then((data) => {
        setConnections(data.connections ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (connections.length > 0) {
      setPlaylistsLoading(true);
      fetch("/api/music/playlists")
        .then((r) => r.json())
        .then((data) => {
          setPlaylists(Array.isArray(data) ? data : []);
          setPlaylistsLoading(false);
        })
        .catch(() => setPlaylistsLoading(false));
    }
  }, [connections]);

  const handlePlaylistToggle = async (
    playlistId: string,
    field: "isPublic" | "isPinned",
    value: boolean
  ) => {
    const res = await fetch(`/api/music/playlists/${playlistId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, [field]: value } : p))
      );
      toast.success(
        field === "isPublic"
          ? value
            ? "Playlist made public"
            : "Playlist made private"
          : value
            ? "Pinned to profile"
            : "Unpinned from profile"
      );
    }
  };

  const handleConnect = (provider: string) => {
    window.location.href = `/api/auth/connect/${provider.toLowerCase()}`;
  };

  const handleDisconnect = async (connectionId: string) => {
    const res = await fetch(`/api/music/connections/${connectionId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setConnections((c) => c.filter((conn) => conn.id !== connectionId));
      toast.success("Disconnected");
    }
  };

  const handleSetPrimary = async (connectionId: string) => {
    const res = await fetch(`/api/music/connections/${connectionId}/primary`, {
      method: "POST",
    });
    if (res.ok) {
      setConnections((c) =>
        c.map((conn) => ({
          ...conn,
          isPrimary: conn.id === connectionId,
        }))
      );
      toast.success("Set as primary service");
    }
  };

  const handleSync = async (connectionId: string) => {
    setSyncing(connectionId);
    try {
      await fetch(`/api/music/connections/${connectionId}/sync`, {
        method: "POST",
      });
      toast.success("Playlists synced!");
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  const connectedProviders = new Set(connections.map((c) => c.provider));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] mb-2">
        Music Connections
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Connect your music services to import playlists, show what you&apos;re
        listening to, and search across all your libraries.
      </p>

      <div className="space-y-4">
        {Object.entries(PROVIDER_INFO).map(([key, info]) => {
          const connection = connections.find((c) => c.provider === key);
          const isConnected = connectedProviders.has(key);

          return (
            <div
              key={key}
              className="p-4 rounded-xl border border-border bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: info.color }}
                  >
                    {info.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{info.name}</h3>
                      {connection?.isPrimary && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {info.description}
                    </p>
                    {connection?.providerUsername && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Connected as{" "}
                        <span className="font-medium">
                          {connection.providerUsername}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {!connection?.isPrimary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            connection && handleSetPrimary(connection.id)
                          }
                          title="Set as primary"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          connection && handleSync(connection.id)
                        }
                        disabled={syncing === connection?.id}
                        title="Re-sync playlists"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${syncing === connection?.id ? "animate-spin" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          connection && handleDisconnect(connection.id)
                        }
                        title="Disconnect"
                      >
                        <Unplug className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(key)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* My Playlists */}
      {connections.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-2">
            <ListMusic className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
              My Playlists
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Toggle visibility and pin playlists to your profile.
          </p>
          {playlistsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : playlists.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No playlists found. Try syncing your connected services.
            </p>
          ) : (
            <div className="space-y-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30"
                >
                  {pl.coverImageUrl ? (
                    <Image
                      src={pl.coverImageUrl}
                      alt={pl.name}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{pl.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pl._count?.tracks ?? pl.trackCount} tracks ·{" "}
                      {pl.provider.toLowerCase().replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handlePlaylistToggle(pl.id, "isPublic", !pl.isPublic)
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        pl.isPublic
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      title={
                        pl.isPublic
                          ? "Public (click to make private)"
                          : "Private (click to make public)"
                      }
                    >
                      {pl.isPublic ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handlePlaylistToggle(pl.id, "isPinned", !pl.isPinned)
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        pl.isPinned
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      title={
                        pl.isPinned
                          ? "Pinned to profile (click to unpin)"
                          : "Not on profile (click to pin)"
                      }
                    >
                      {pl.isPinned ? (
                        <Pin className="w-4 h-4" />
                      ) : (
                        <PinOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
