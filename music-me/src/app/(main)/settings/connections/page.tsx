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

// Brand SVG icons for each provider
const ProviderIcons: Record<string, React.ReactNode> = {
  SPOTIFY: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  ),
  APPLE_MUSIC: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.7.197 10.496 10.496 0 0018.007.058h-6.934c-.37 0-.74.012-1.11.03a10.24 10.24 0 00-1.878.241 5.15 5.15 0 00-1.633.71C5.537 1.63 4.875 2.44 4.48 3.462a8.89 8.89 0 00-.372 1.634 11.61 11.61 0 00-.1 1.58v10.647c0 .42.015.84.06 1.26.058.632.178 1.255.399 1.85.393 1.064 1.067 1.905 1.99 2.498.57.364 1.197.61 1.87.736.43.084.87.126 1.31.148.38.02.76.03 1.14.03h7.14c.56 0 1.12-.02 1.67-.083a7.6 7.6 0 001.43-.323c1.095-.37 1.978-1.022 2.622-1.969.38-.563.63-1.18.778-1.84.113-.498.176-1.004.2-1.515.02-.38.03-.76.03-1.14V6.124zM17.72 12.566c0 2.27-.01 4.54.005 6.81a3.396 3.396 0 01-.153 1.028c-.166.51-.487.88-.993 1.069a2.532 2.532 0 01-1.086.163c-.672-.03-1.22-.29-1.574-.866a1.82 1.82 0 01-.248-.96c-.003-.658.24-1.198.771-1.59.34-.254.734-.39 1.14-.49.378-.095.76-.172 1.138-.262.34-.08.575-.303.64-.645.028-.158.04-.32.04-.48V9.085a.843.843 0 00-.012-.165c-.052-.355-.31-.58-.663-.514l-4.61.95c-.097.02-.193.052-.287.083-.2.065-.32.22-.353.425a1.866 1.866 0 00-.02.29v8.098c.003.3-.002.6-.035.897a2.26 2.26 0 01-.164.666c-.223.524-.605.854-1.157.982-.266.062-.54.09-.814.083-.595-.018-1.107-.202-1.47-.695-.283-.382-.377-.82-.33-1.285.063-.634.407-1.095.952-1.39.337-.183.706-.29 1.078-.374.316-.072.634-.136.946-.22.39-.106.605-.39.628-.794.004-.064.004-.13.004-.194V7.25c0-.203.017-.406.06-.605.06-.288.235-.486.513-.57.14-.04.283-.072.426-.098l5.452-1.1c.22-.045.442-.08.665-.106.378-.044.612.175.634.555.004.063.002.127.002.19v7.05z"/>
    </svg>
  ),
  SOUNDCLOUD: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M7 14.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-5c0-.28.22-.5.5-.5s.5.22.5.5v5zm2 2c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-9c0-.28.22-.5.5-.5s.5.22.5.5v9zm2 0c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-11c0-.28.22-.5.5-.5s.5.22.5.5v11zm2-.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V6c0-.28.22-.5.5-.5s.5.22.5.5v10zm2 .5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V8c0-.28.22-.5.5-.5s.5.22.5.5v8.5zm2-1c0 .28-.22.5-.5.5s-.5-.22-.5-.5V9c0-.28.22-.5.5-.5s.5.22.5.5v6.5zm2 .5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-8c0-.28.22-.5.5-.5s.5.22.5.5v8zm2-2c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-4c0-.28.22-.5.5-.5s.5.22.5.5v4z"/>
    </svg>
  ),
  YOUTUBE_MUSIC: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228 18.228 15.432 18.228 12 15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
    </svg>
  ),
  LASTFM: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.649-3.244-4.288 0-3.382 1.704-4.591 3.381-4.591 2.42 0 3.189 1.567 3.849 3.574l.88 2.749c.88 2.666 2.529 4.81 7.284 4.81 3.409 0 5.718-1.044 5.718-3.793 0-2.227-1.265-3.381-3.627-3.932l-1.758-.385c-1.21-.275-1.567-.77-1.567-1.595 0-.934.742-1.484 1.952-1.484 1.32 0 2.034.495 2.144 1.677l2.749-.33c-.22-2.474-1.924-3.492-4.729-3.492-2.474 0-4.893.935-4.893 3.932 0 1.87.907 3.051 3.189 3.601l1.87.44c1.402.33 1.87.825 1.87 1.68 0 1.044-.962 1.484-2.773 1.484-2.695 0-3.822-1.402-4.454-3.327l-.907-2.749c-1.155-3.574-2.997-4.894-6.653-4.894C2.144 5.497 0 7.836 0 12.17c0 4.097 2.144 6.232 5.993 6.232 3.11 0 4.591-1.21 4.591-1.21z"/>
    </svg>
  ),
  DEEZER: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38H6.27zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.594v3.027h5.189v-3.027H6.27zm6.271 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19zM0 16.81v3.029h5.19v-3.03H0zm6.27 0v3.029h5.189v-3.03H6.27zm6.271 0v3.029h5.19v-3.03h-5.19zm6.27 0v3.029H24v-3.03h-5.19z"/>
    </svg>
  ),
};

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
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: info.color }}
                  >
                    {ProviderIcons[key] ?? info.name.charAt(0)}
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
