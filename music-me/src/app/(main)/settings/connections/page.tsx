"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Star,
  Unplug,
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
        Connect your music services to import playlists, show what you're
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
    </div>
  );
}
