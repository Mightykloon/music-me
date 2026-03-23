import type {
  MusicProvider,
  MusicProviderConfig,
  MusicTrackResult,
  PlaylistResult,
  PlaylistTrackResult,
  NowPlayingResult,
} from "../types";

const APPLE_API = "https://api.music.apple.com/v1";

export class AppleMusicProvider implements MusicProvider {
  readonly config: MusicProviderConfig = {
    name: "APPLE_MUSIC",
    displayName: "Apple Music",
    icon: "apple",
    color: "#FC3C44",
    supportsPlayback: true,
    supportsNowPlaying: false,
    supportsPlaylists: true,
    supportsLyrics: false,
  };

  async connect(code: string, redirectUri: string) {
    // Apple Music uses MusicKit JS on the client to get a music user token
    // The "code" here is the music user token from MusicKit
    void redirectUri;
    return {
      accessToken: code, // music user token
      refreshToken: null,
      expiresAt: null, // Apple music user tokens don't expire in the same way
      providerUserId: null,
      providerUsername: null,
      scopes: null,
    };
  }

  async refreshToken(_refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  }> {
    // Apple Music user tokens are obtained client-side via MusicKit
    throw new Error("Apple Music tokens must be refreshed client-side via MusicKit");
  }

  async searchTracks(
    accessToken: string,
    query: string,
    limit = 20
  ): Promise<MusicTrackResult[]> {
    const data = await this.fetchApi(
      accessToken,
      `/catalog/us/search?types=songs&term=${encodeURIComponent(query)}&limit=${limit}`
    );

    const songs = data?.results?.songs?.data ?? [];
    return songs.map(this.mapTrack);
  }

  async getTrack(
    accessToken: string,
    trackId: string
  ): Promise<MusicTrackResult> {
    const data = await this.fetchApi(
      accessToken,
      `/catalog/us/songs/${trackId}`
    );
    return this.mapTrack(data.data[0]);
  }

  async getUserPlaylists(accessToken: string): Promise<PlaylistResult[]> {
    const data = await this.fetchApi(
      accessToken,
      "/me/library/playlists?limit=100"
    );

    return (data.data ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any): PlaylistResult => ({
        providerPlaylistId: p.id,
        name: p.attributes?.name ?? "Untitled",
        description: p.attributes?.description?.standard ?? null,
        coverImageUrl: p.attributes?.artwork
          ? p.attributes.artwork.url
              .replace("{w}", "300")
              .replace("{h}", "300")
          : null,
        trackCount: p.attributes?.trackCount ?? 0,
        externalUrl: null,
      })
    );
  }

  async getPlaylistTracks(
    accessToken: string,
    playlistId: string
  ): Promise<PlaylistTrackResult[]> {
    const data = await this.fetchApi(
      accessToken,
      `/me/library/playlists/${playlistId}/tracks?limit=100`
    );

    return (data.data ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any, i: number): PlaylistTrackResult => ({
        track: this.mapTrack(item),
        position: i,
        addedAt: new Date(item.attributes?.dateAdded ?? Date.now()),
      })
    );
  }

  async getNowPlaying(
    _accessToken: string
  ): Promise<NowPlayingResult | null> {
    // Apple Music doesn't have a server-side now playing API
    // This would be handled client-side via MusicKit
    return null;
  }

  async getTopTracks(
    accessToken: string,
    _timeRange?: string
  ): Promise<MusicTrackResult[]> {
    // Apple Music doesn't have a top tracks endpoint
    // Use recently played as a proxy
    const data = await this.fetchApi(
      accessToken,
      "/me/recent/played/tracks?limit=50"
    );
    return (data.data ?? []).map(this.mapTrack);
  }

  async getTopArtists(
    _accessToken: string,
    _timeRange?: string
  ): Promise<string[]> {
    return [];
  }

  getEmbedUrl(trackId: string): string {
    return `https://embed.music.apple.com/us/song/${trackId}`;
  }

  getEmbedPlaylistUrl(playlistId: string): string {
    return `https://embed.music.apple.com/us/playlist/${playlistId}`;
  }

  private async fetchApi(accessToken: string, endpoint: string) {
    const developerToken = await this.getDeveloperToken();
    const res = await fetch(`${APPLE_API}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${developerToken}`,
        "Music-User-Token": accessToken,
      },
    });

    if (!res.ok) throw new Error(`Apple Music API error: ${res.status}`);
    return res.json();
  }

  private async getDeveloperToken(): Promise<string> {
    // In production, generate a JWT signed with Apple's private key
    // For now, return the env value directly
    return process.env.APPLE_MUSIC_DEVELOPER_TOKEN ?? "";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTrack(t: any): MusicTrackResult {
    const attrs = t.attributes ?? {};
    return {
      provider: "APPLE_MUSIC",
      providerTrackId: t.id,
      title: attrs.name ?? "",
      artist: attrs.artistName ?? "",
      album: attrs.albumName ?? null,
      albumArtUrl: attrs.artwork
        ? attrs.artwork.url.replace("{w}", "300").replace("{h}", "300")
        : null,
      previewUrl: attrs.previews?.[0]?.url ?? null,
      duration: attrs.durationInMillis ?? null,
      isrc: attrs.isrc ?? null,
      externalUrl: attrs.url ?? null,
    };
  }
}
