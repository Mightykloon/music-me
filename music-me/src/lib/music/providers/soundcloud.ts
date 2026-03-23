import type {
  MusicProvider,
  MusicProviderConfig,
  MusicTrackResult,
  PlaylistResult,
  PlaylistTrackResult,
  NowPlayingResult,
} from "../types";

const SC_API = "https://api.soundcloud.com";

export class SoundCloudProvider implements MusicProvider {
  readonly config: MusicProviderConfig = {
    name: "SOUNDCLOUD",
    displayName: "SoundCloud",
    icon: "soundcloud",
    color: "#FF5500",
    supportsPlayback: true,
    supportsNowPlaying: false,
    supportsPlaylists: true,
    supportsLyrics: false,
  };

  async connect(code: string, redirectUri: string) {
    const res = await fetch(`${SC_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.SOUNDCLOUD_CLIENT_ID ?? "",
        client_secret: process.env.SOUNDCLOUD_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!res.ok) throw new Error("Failed to exchange SoundCloud code");
    const data = await res.json();

    const profile = await this.fetchApi(data.access_token, "/me");

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
      providerUserId: String(profile.id),
      providerUsername: profile.username ?? null,
      scopes: data.scope ?? null,
    };
  }

  async refreshToken(refreshToken: string) {
    const res = await fetch(`${SC_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.SOUNDCLOUD_CLIENT_ID ?? "",
        client_secret: process.env.SOUNDCLOUD_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) throw new Error("Failed to refresh SoundCloud token");
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    };
  }

  async searchTracks(
    accessToken: string,
    query: string,
    limit = 20
  ): Promise<MusicTrackResult[]> {
    const data = await this.fetchApi(
      accessToken,
      `/tracks?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return (Array.isArray(data) ? data : []).map(this.mapTrack);
  }

  async getTrack(
    accessToken: string,
    trackId: string
  ): Promise<MusicTrackResult> {
    const data = await this.fetchApi(accessToken, `/tracks/${trackId}`);
    return this.mapTrack(data);
  }

  async getUserPlaylists(accessToken: string): Promise<PlaylistResult[]> {
    const data = await this.fetchApi(accessToken, "/me/playlists?limit=50");
    return (Array.isArray(data) ? data : []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any): PlaylistResult => ({
        providerPlaylistId: String(p.id),
        name: p.title ?? "Untitled",
        description: p.description ?? null,
        coverImageUrl: p.artwork_url ?? null,
        trackCount: p.track_count ?? 0,
        externalUrl: p.permalink_url ?? null,
      })
    );
  }

  async getPlaylistTracks(
    accessToken: string,
    playlistId: string
  ): Promise<PlaylistTrackResult[]> {
    const data = await this.fetchApi(
      accessToken,
      `/playlists/${playlistId}`
    );
    return (data.tracks ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any, i: number): PlaylistTrackResult => ({
        track: this.mapTrack(t),
        position: i,
        addedAt: new Date(t.created_at ?? Date.now()),
      })
    );
  }

  async getNowPlaying(
    _accessToken: string
  ): Promise<NowPlayingResult | null> {
    return null;
  }

  async getTopTracks(
    accessToken: string
  ): Promise<MusicTrackResult[]> {
    const data = await this.fetchApi(accessToken, "/me/tracks?limit=50");
    return (Array.isArray(data) ? data : []).map(this.mapTrack);
  }

  async getTopArtists(): Promise<string[]> {
    return [];
  }

  getEmbedUrl(trackId: string): string {
    return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${trackId}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
  }

  getEmbedPlaylistUrl(playlistId: string): string {
    return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/${playlistId}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
  }

  private async fetchApi(accessToken: string, endpoint: string) {
    const res = await fetch(`${SC_API}${endpoint}`, {
      headers: { Authorization: `OAuth ${accessToken}` },
    });
    if (!res.ok) throw new Error(`SoundCloud API error: ${res.status}`);
    return res.json();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTrack(t: any): MusicTrackResult {
    return {
      provider: "SOUNDCLOUD",
      providerTrackId: String(t.id),
      title: t.title ?? "",
      artist: t.user?.username ?? "",
      album: null,
      albumArtUrl: t.artwork_url?.replace("-large", "-t500x500") ?? null,
      previewUrl: t.stream_url ?? null,
      duration: t.duration ?? null,
      isrc: null,
      externalUrl: t.permalink_url ?? null,
    };
  }
}
