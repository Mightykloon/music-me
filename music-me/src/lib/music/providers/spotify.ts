import type {
  MusicProvider,
  MusicProviderConfig,
  MusicTrackResult,
  PlaylistResult,
  PlaylistTrackResult,
  NowPlayingResult,
} from "../types";

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";

export class SpotifyProvider implements MusicProvider {
  readonly config: MusicProviderConfig = {
    name: "SPOTIFY",
    displayName: "Spotify",
    icon: "spotify",
    color: "#1DB954",
    supportsPlayback: true,
    supportsNowPlaying: true,
    supportsPlaylists: true,
    supportsLyrics: false,
  };

  async connect(code: string, redirectUri: string) {
    const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) throw new Error("Failed to exchange Spotify code");
    const data = await res.json();

    // Get user profile
    const profile = await this.fetchApi(data.access_token, "/me");

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      providerUserId: profile.id,
      providerUsername: profile.display_name ?? profile.id,
      scopes: data.scope ?? null,
    };
  }

  async refreshToken(refreshToken: string) {
    const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) throw new Error("Failed to refresh Spotify token");
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async searchTracks(
    accessToken: string,
    query: string,
    limit = 20
  ): Promise<MusicTrackResult[]> {
    const data = await this.fetchApi(
      accessToken,
      `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
    );

    return (data.tracks?.items ?? []).map(this.mapTrack);
  }

  async getTrack(
    accessToken: string,
    trackId: string
  ): Promise<MusicTrackResult> {
    const data = await this.fetchApi(accessToken, `/tracks/${trackId}`);
    return this.mapTrack(data);
  }

  async getUserPlaylists(accessToken: string): Promise<PlaylistResult[]> {
    const data = await this.fetchApi(
      accessToken,
      "/me/playlists?limit=50"
    );

    return (data.items ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any): PlaylistResult => ({
        providerPlaylistId: p.id,
        name: p.name,
        description: p.description,
        coverImageUrl: p.images?.[0]?.url ?? null,
        trackCount: p.tracks?.total ?? 0,
        externalUrl: p.external_urls?.spotify ?? null,
      })
    );
  }

  async getPlaylistTracks(
    accessToken: string,
    playlistId: string
  ): Promise<PlaylistTrackResult[]> {
    const allItems: PlaylistTrackResult[] = [];
    let url: string | null = `/playlists/${playlistId}/tracks?limit=100&additional_types=track&market=US`;

    while (url) {
      const data = await this.fetchApi(accessToken, url);
      const items = (data.items ?? [])
        .filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => item.track && item.track.type === "track"
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any): PlaylistTrackResult => ({
          track: this.mapTrack(item.track),
          position: allItems.length + (data.items ?? []).indexOf(item),
          addedAt: new Date(item.added_at),
        }));

      // Fix positions to be sequential
      for (const item of items) {
        item.position = allItems.length;
        allItems.push(item);
      }

      // Spotify returns a `next` URL for pagination
      url = data.next ?? null;
    }

    return allItems;
  }

  /**
   * Fetch a single page of playlist tracks (for incremental sync).
   * Returns tracks + total count + whether there are more pages.
   */
  async getPlaylistTracksPage(
    accessToken: string,
    playlistId: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<{ tracks: PlaylistTrackResult[]; total: number; hasMore: boolean }> {
    // Use additional_types and market params to avoid 403 on some playlists
    const data = await this.fetchApi(
      accessToken,
      `/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}&additional_types=track&market=US`
    );

    const total: number = data.total ?? 0;
    const tracks = (data.items ?? [])
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => item.track && item.track.type === "track"
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any, i: number): PlaylistTrackResult => ({
        track: this.mapTrack(item.track),
        position: offset + i,
        addedAt: new Date(item.added_at),
      }));

    return {
      tracks,
      total,
      hasMore: (offset + limit) < total,
    };
  }

  async getNowPlaying(
    accessToken: string
  ): Promise<NowPlayingResult | null> {
    try {
      const data = await this.fetchApi(
        accessToken,
        "/me/player/currently-playing"
      );
      if (!data || !data.item || data.currently_playing_type !== "track") {
        return null;
      }
      return {
        track: this.mapTrack(data.item),
        startedAt: new Date(data.timestamp),
        isPlaying: data.is_playing,
      };
    } catch {
      return null;
    }
  }

  async getTopTracks(
    accessToken: string,
    timeRange = "medium_term"
  ): Promise<MusicTrackResult[]> {
    const data = await this.fetchApi(
      accessToken,
      `/me/top/tracks?time_range=${timeRange}&limit=50`
    );
    return (data.items ?? []).map(this.mapTrack);
  }

  async getTopArtists(
    accessToken: string,
    timeRange = "medium_term"
  ): Promise<string[]> {
    const data = await this.fetchApi(
      accessToken,
      `/me/top/artists?time_range=${timeRange}&limit=50`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.items ?? []).map((a: any) => a.name);
  }

  getEmbedUrl(trackId: string): string {
    return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
  }

  getEmbedPlaylistUrl(playlistId: string): string {
    return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
  }

  // --- Helpers ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetchApi(accessToken: string, endpoint: string): Promise<any> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${SPOTIFY_API}${endpoint}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 204) return null;
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? 1);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return this.fetchApi(accessToken, endpoint);
    }
    if (!res.ok) {
      // Log the actual error body for debugging
      const errorBody = await res.text().catch(() => "");
      console.error(`Spotify API error ${res.status} for ${endpoint}:`, errorBody);

      // Parse Spotify error message if possible
      let detail = "";
      try {
        const parsed = JSON.parse(errorBody);
        detail = parsed?.error?.message || parsed?.error_description || "";
      } catch { /* not JSON */ }

      throw new Error(`Spotify API error: ${res.status}${detail ? ` - ${detail}` : ""}`);
    }

    return res.json();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTrack(t: any): MusicTrackResult {
    return {
      provider: "SPOTIFY",
      providerTrackId: t.id,
      title: t.name,
      artist: t.artists?.map((a: { name: string }) => a.name).join(", ") ?? "",
      album: t.album?.name ?? null,
      albumArtUrl: t.album?.images?.[0]?.url ?? null,
      previewUrl: t.preview_url ?? null,
      duration: t.duration_ms ?? null,
      isrc: t.external_ids?.isrc ?? null,
      externalUrl: t.external_urls?.spotify ?? null,
    };
  }
}

/** Get an app-level access token using Client Credentials flow.
 *  Works for public playlist data without needing a user's OAuth token. */
export async function getSpotifyClientToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  }
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`Spotify client credentials failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

/** Build the Spotify OAuth URL for connecting a user's account */
export function getSpotifyConnectUrl(redirectUri: string, state: string): string {
  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-top-read",
    "user-read-recently-played",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID ?? "",
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  return `${SPOTIFY_ACCOUNTS}/authorize?${params}`;
}
