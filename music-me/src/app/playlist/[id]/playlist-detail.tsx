"use client";

import { useState, useRef, useEffect } from "react";
// Using native <img> for external CDN cover art (Spotify uses many subdomains)
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Music, Play, Pause, ExternalLink, Clock, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/ui/avatar";

interface Track {
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

interface PlaylistTrack {
  position: number;
  addedAt: string | null;
  track: Track;
}

interface PlaylistData {
  id: string;
  providerPlaylistId: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  trackCount: number;
  provider: string;
  tracks: PlaylistTrack[];
  user: {
    id: string;
    username: string;
    displayName: string | null;
    profile: { profilePictureUrl: string | null } | null;
  };
}

function formatDuration(ms: number | null) {
  if (!ms) return "";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PlaylistDetail({ playlist }: { playlist: PlaylistData }) {
  const router = useRouter();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-sync tracks if playlist has 0 tracks loaded
  useEffect(() => {
    if (playlist.tracks.length === 0) {
      handleResync();
    }
    return () => {
      audioRef.current?.pause();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Map a Spotify track to our ingest format
  function mapSpotifyTrack(t: Record<string, unknown>) {
    const artists = t.artists as { name: string }[] | undefined;
    const album = t.album as { name?: string; images?: { url: string }[] } | undefined;
    const extIds = t.external_ids as { isrc?: string } | undefined;
    const extUrls = t.external_urls as { spotify?: string } | undefined;
    return {
      provider: "SPOTIFY",
      providerTrackId: t.id as string,
      title: t.name as string,
      artist: artists?.map(a => a.name).join(", ") ?? "",
      album: album?.name ?? null,
      albumArtUrl: album?.images?.[0]?.url ?? null,
      previewUrl: (t.preview_url as string) ?? null,
      duration: (t.duration_ms as number) ?? null,
      isrc: extIds?.isrc ?? null,
      externalUrl: extUrls?.spotify ?? null,
    };
  }

  const handleResync = async () => {
    setSyncing(true);
    setSyncStatus("Fetching tracks from Spotify...");
    try {
      // Go straight to browser-direct Spotify (server-side is always blocked by Dev Mode)
      const tokenRes = await fetch("/api/music/token");
      if (!tokenRes.ok) throw new Error("Failed to get Spotify token");
      const { accessToken } = await tokenRes.json();

      // Use fields param to request only what we need — lighter response
      const fields = "tracks(items(added_at,track(id,name,type,artists(name),album(name,images),preview_url,duration_ms,external_ids,external_urls)),total,next)";
      const plRes = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.providerPlaylistId}?fields=${encodeURIComponent(fields)}&market=US`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log(`[Spotify browser] GET /playlists/${playlist.providerPlaylistId} → ${plRes.status}`);

      if (!plRes.ok) throw new Error(`Spotify: ${plRes.status}`);
      const plData = await plRes.json();
      const items = (plData.tracks?.items ?? []) as Record<string, unknown>[];
      const total = plData.tracks?.total ?? 0;
      console.log(`[Spotify browser] ${items.length} items, total=${total}`);

      if (items.length === 0) {
        toast.error(
          playlist.tracks.length > 0
            ? `Spotify rate-limited. You already have ${playlist.tracks.length} tracks synced. Try again in a few minutes.`
            : "Spotify returned 0 tracks. Dev Mode is blocking. Try again in a minute.",
          { duration: 6000 }
        );
        return;
      }

      // NOTE: Don't follow pagination — the `next` URL uses /tracks endpoint
      // which returns 403 in Spotify Dev Mode. We take what we get (up to 100).
      if (total > items.length) {
        console.log(`[Spotify browser] Got ${items.length}/${total} — pagination blocked by Dev Mode`);
      }

      // Map and ingest in batches of 25 (smaller batches to avoid ingest timeout)
      const tracks = items
        .filter((item) => {
          const t = item.track as Record<string, unknown> | null;
          return t && t.type === "track" && t.id;
        })
        .map((item, i) => ({
          track: mapSpotifyTrack(item.track as Record<string, unknown>),
          position: i,
          addedAt: (item.added_at as string) || new Date().toISOString(),
        }));

      let totalSynced = 0;
      for (let i = 0; i < tracks.length; i += 25) {
        const batch = tracks.slice(i, i + 25);
        setSyncStatus(`Saving tracks ${i + 1}–${Math.min(i + 25, tracks.length)} of ${tracks.length}...`);
        const ingestRes = await fetch(`/api/music/playlists/${playlist.id}/ingest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracks: batch, total }),
        });
        if (ingestRes.ok) {
          const r = await ingestRes.json();
          totalSynced += r.synced ?? 0;
        }
      }

      if (totalSynced > 0) {
        const msg = total > totalSynced + playlist.tracks.length
          ? `Synced ${totalSynced} tracks (${Math.min(totalSynced + playlist.tracks.length, total)}/${total} — Spotify Dev Mode caps at 100 per request)`
          : `Synced ${totalSynced} tracks!`;
        toast.success(msg, { duration: 5000 });
      } else {
        toast.error("All fetched tracks were already synced.");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
      setSyncStatus("");
    }
  };

  /** Search Deezer for a playable 30s preview, trying multiple query strategies */
  async function findDeezerPreview(artist: string, title: string): Promise<string | null> {
    const mainArtist = artist.split(",")[0].trim();
    const mainTitle = title.replace(/\s*\(.*?\)\s*/g, "").trim();

    const queries = [
      `${mainArtist} ${mainTitle}`,
      `${mainTitle} ${mainArtist}`,
      mainTitle,
    ];

    for (const q of queries) {
      try {
        const dRes = await fetch(`/api/music/deezer-search?q=${encodeURIComponent(q)}&limit=5`);
        if (!dRes.ok) continue;
        const dData = await dRes.json();
        const hit = (dData.data ?? []).find((d: { preview?: string }) => d.preview && d.preview.length > 0);
        if (hit?.preview) {
          console.log(`[Deezer] Found preview for "${mainTitle}" via query: "${q}"`);
          return hit.preview;
        }
      } catch { /* try next query */ }
    }
    console.log(`[Deezer] No preview found for "${mainArtist} - ${mainTitle}" after ${queries.length} queries`);
    return null;
  }

  const handlePlay = async (track: Track) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    let previewUrl = track.previewUrl;

    // If no Spotify preview, try Deezer as fallback
    if (!previewUrl) {
      previewUrl = await findDeezerPreview(track.artist, track.title);
    }

    if (!previewUrl) {
      toast.error("No preview available for this track");
      return;
    }

    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(track.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/my-music"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <button
          onClick={handleResync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Re-sync"}
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 mx-auto sm:mx-0">
          {playlist.coverImageUrl ? (
            <img
              src={playlist.coverImageUrl}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Music className="w-16 h-16 text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-end text-center sm:text-left">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Playlist
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            <Link
              href={`/${playlist.user.username}`}
              className="flex items-center gap-2 hover:underline"
            >
              <Avatar
                src={playlist.user.profile?.profilePictureUrl}
                alt={playlist.user.displayName ?? playlist.user.username}
                size="sm"
              />
              <span className="text-sm font-medium">
                {playlist.user.displayName ?? playlist.user.username}
              </span>
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              {playlist.tracks.length || playlist.trackCount} tracks
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {playlist.provider.toLowerCase().replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_3rem] sm:grid-cols-[2rem_1fr_1fr_4rem] gap-3 px-4 py-2 border-b border-border/50 text-xs text-muted-foreground">
          <span>#</span>
          <span>Title</span>
          <span className="hidden sm:block">Album</span>
          <span className="text-right">
            <Clock className="w-3 h-3 inline" />
          </span>
        </div>

        {playlist.tracks.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {syncing ? (
              <>
                <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="font-medium text-foreground">{syncStatus || "Syncing tracks..."}</p>
                <p className="text-xs mt-1">Large playlists are synced in batches</p>
              </>
            ) : (
              <>
                <p className="mb-3">No tracks synced yet.</p>
                <button
                  onClick={handleResync}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Tracks Now
                </button>
              </>
            )}
          </div>
        ) : (
          playlist.tracks.map((pt, i) => {
            const t = pt.track;
            const isPlaying = playingId === t.id;
            const hasPreview = !!t.previewUrl;

            return (
              <div
                key={`${t.id}-${i}`}
                className={`group grid grid-cols-[2rem_1fr_3rem] sm:grid-cols-[2rem_1fr_1fr_4rem] gap-3 px-4 py-2 items-center hover:bg-muted/30 transition-colors ${isPlaying ? "bg-primary/5" : ""}`}
              >
                <div className="text-center">
                  <button
                    onClick={() => handlePlay(t)}
                    className="w-6 h-6 flex items-center justify-center"
                  >
                    <span className="group-hover:hidden text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 text-primary hidden group-hover:block" />
                    ) : (
                      <Play className={`w-3.5 h-3.5 hidden group-hover:block ${hasPreview ? "text-foreground" : "text-muted-foreground"}`} />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  {t.albumArtUrl ? (
                    <img
                      src={t.albumArtUrl}
                      alt=""
                      className="w-9 h-9 rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Music className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm truncate ${isPlaying ? "text-primary font-medium" : ""}`}
                    >
                      {t.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.artist}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                  {t.album ?? ""}
                </p>

                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(t.duration)}
                  </span>
                  {t.externalUrl && (
                    <a
                      href={t.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
