import type {
  MusicProvider,
  MusicProviderConfig,
  MusicTrackResult,
  PlaylistResult,
  PlaylistTrackResult,
  NowPlayingResult,
} from "../types";

const DEEZER_API = "https://api.deezer.com";

export class DeezerProvider implements MusicProvider {
  readonly config: MusicProviderConfig = {
    name: "DEEZER",
    displayName: "Deezer",
    icon: "music",
    color: "#A238FF",
    supportsPlayback: true,
    supportsNowPlaying: false,
    supportsPlaylists: true,
    supportsLyrics: false,
  };

  async connect(code: string, redirectUri: string) {
    const res = await fetch(
      `https://connect.deezer.com/oauth/access_token.php?app_id=${process.env.DEEZER_APP_ID}&secret=${process.env.DEEZER_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      { method: "POST" }
    );

    if (!res.ok) throw new Error("Failed to exchange Deezer code");
    const text = await res.text();
    const params = new URLSearchParams(text);
    const accessToken = params.get("access_token");
    if (!accessToken) throw new Error("No access token received from Deezer");

    const profile = await this.fetchApi(accessToken, "/user/me");

    return {
      accessToken,
      refreshToken: null,
      expiresAt: null,
      providerUserId: String(profile.id),
      providerUsername: profile.name ?? null,
      scopes: null,
    };
  }

  async refreshToken(_refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  }> {
    throw new Error("Deezer tokens do not use refresh flow");
  }

  async searchTracks(
    accessToken: string,
    query: string,
    limit = 20
  ): Promise<MusicTrackResult[]> {
    const data = await this.fetchApi(
      accessToken,
      `/search/track?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return (data.data ?? []).map(this.mapTrack);
  }

  async getTrack(
    accessToken: string,
    trackId: string
  ): Promise<MusicTrackResult> {
    const data = await this.fetchApi(accessToken, `/track/${trackId}`);
    return this.mapTrack(data);
  }

  async getUserPlaylists(accessToken: string): Promise<PlaylistResult[]> {
    const data = await this.fetchApi(accessToken, "/user/me/playlists");
    return (data.data ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any): PlaylistResult => ({
        providerPlaylistId: String(p.id),
        name: p.title ?? "Untitled",
        description: p.description ?? null,
        coverImageUrl: p.picture_big ?? p.picture ?? null,
        trackCount: p.nb_tracks ?? 0,
        externalUrl: p.link ?? null,
      })
    );
  }

  async getPlaylistTracks(
    accessToken: string,
    playlistId: string
  ): Promise<PlaylistTrackResult[]> {
    const data = await this.fetchApi(
      accessToken,
      `/playlist/${playlistId}/tracks`
    );
    return (data.data ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any, i: number): PlaylistTrackResult => ({
        track: this.mapTrack(t),
        position: i,
        addedAt: new Date(t.time_add ? t.time_add * 1000 : Date.now()),
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
    const data = await this.fetchApi(
      accessToken,
      "/user/me/tracks?limit=50"
    );
    return (data.data ?? []).map(this.mapTrack);
  }

  async getTopArtists(accessToken: string): Promise<string[]> {
    const data = await this.fetchApi(
      accessToken,
      "/user/me/artists?limit=50"
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.data ?? []).map((a: any) => a.name);
  }

  getEmbedUrl(trackId: string): string {
    return `https://widget.deezer.com/widget/dark/track/${trackId}`;
  }

  getEmbedPlaylistUrl(playlistId: string): string {
    return `https://widget.deezer.com/widget/dark/playlist/${playlistId}`;
  }

  private async fetchApi(accessToken: string, endpoint: string) {
    const separator = endpoint.includes("?") ? "&" : "?";
    const res = await fetch(
      `${DEEZER_API}${endpoint}${separator}access_token=${accessToken}`
    );
    if (!res.ok) throw new Error(`Deezer API error: ${res.status}`);
    return res.json();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTrack(t: any): MusicTrackResult {
    return {
      provider: "DEEZER",
      providerTrackId: String(t.id),
      title: t.title ?? "",
      artist: t.artist?.name ?? "",
      album: t.album?.title ?? null,
      albumArtUrl: t.album?.cover_big ?? t.album?.cover ?? null,
      previewUrl: t.preview ?? null,
      duration: t.duration ? t.duration * 1000 : null,
      isrc: t.isrc ?? null,
      externalUrl: t.link ?? null,
    };
  }
}
