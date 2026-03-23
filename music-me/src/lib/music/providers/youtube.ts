import type {
  MusicProvider,
  MusicProviderConfig,
  MusicTrackResult,
  PlaylistResult,
  PlaylistTrackResult,
  NowPlayingResult,
} from "../types";

const YT_API = "https://www.googleapis.com/youtube/v3";

export class YouTubeMusicProvider implements MusicProvider {
  readonly config: MusicProviderConfig = {
    name: "YOUTUBE_MUSIC",
    displayName: "YouTube Music",
    icon: "youtube",
    color: "#FF0000",
    supportsPlayback: true,
    supportsNowPlaying: false,
    supportsPlaylists: true,
    supportsLyrics: false,
  };

  async connect(code: string, redirectUri: string) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!res.ok) throw new Error("Failed to exchange Google code");
    const data = await res.json();

    const profile = await this.fetchApiWithToken(
      data.access_token,
      "/channels?part=snippet&mine=true"
    );
    const channel = profile.items?.[0];

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      providerUserId: channel?.id ?? null,
      providerUsername: channel?.snippet?.title ?? null,
      scopes: data.scope ?? null,
    };
  }

  async refreshToken(refreshToken: string) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) throw new Error("Failed to refresh Google token");
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async searchTracks(
    _accessToken: string,
    query: string,
    limit = 20
  ): Promise<MusicTrackResult[]> {
    const data = await this.fetchApiWithKey(
      `/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=${limit}`
    );

    return (data.items ?? []).map(this.mapSearchResult);
  }

  async getTrack(
    _accessToken: string,
    trackId: string
  ): Promise<MusicTrackResult> {
    const data = await this.fetchApiWithKey(
      `/videos?part=snippet,contentDetails&id=${trackId}`
    );
    const item = data.items?.[0];
    if (!item) throw new Error("Track not found");
    return this.mapVideo(item);
  }

  async getUserPlaylists(accessToken: string): Promise<PlaylistResult[]> {
    const data = await this.fetchApiWithToken(
      accessToken,
      "/playlists?part=snippet,contentDetails&mine=true&maxResults=50"
    );

    return (data.items ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any): PlaylistResult => ({
        providerPlaylistId: p.id,
        name: p.snippet?.title ?? "Untitled",
        description: p.snippet?.description ?? null,
        coverImageUrl:
          p.snippet?.thumbnails?.high?.url ??
          p.snippet?.thumbnails?.default?.url ??
          null,
        trackCount: p.contentDetails?.itemCount ?? 0,
        externalUrl: `https://www.youtube.com/playlist?list=${p.id}`,
      })
    );
  }

  async getPlaylistTracks(
    _accessToken: string,
    playlistId: string
  ): Promise<PlaylistTrackResult[]> {
    const data = await this.fetchApiWithKey(
      `/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`
    );

    return (data.items ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any, i: number): PlaylistTrackResult => ({
        track: {
          provider: "YOUTUBE_MUSIC",
          providerTrackId:
            item.snippet?.resourceId?.videoId ?? "",
          title: item.snippet?.title ?? "",
          artist: item.snippet?.videoOwnerChannelTitle ?? "",
          album: null,
          albumArtUrl:
            item.snippet?.thumbnails?.high?.url ?? null,
          previewUrl: null,
          duration: null,
          isrc: null,
          externalUrl: `https://www.youtube.com/watch?v=${item.snippet?.resourceId?.videoId}`,
        },
        position: i,
        addedAt: new Date(
          item.snippet?.publishedAt ?? Date.now()
        ),
      })
    );
  }

  async getNowPlaying(
    _accessToken: string
  ): Promise<NowPlayingResult | null> {
    return null;
  }

  async getTopTracks(): Promise<MusicTrackResult[]> {
    return [];
  }

  async getTopArtists(): Promise<string[]> {
    return [];
  }

  getEmbedUrl(trackId: string): string {
    return `https://www.youtube.com/embed/${trackId}`;
  }

  getEmbedPlaylistUrl(playlistId: string): string {
    return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
  }

  private async fetchApiWithToken(accessToken: string, endpoint: string) {
    const res = await fetch(`${YT_API}${endpoint}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    return res.json();
  }

  private async fetchApiWithKey(endpoint: string) {
    const key = process.env.YOUTUBE_API_KEY ?? "";
    const separator = endpoint.includes("?") ? "&" : "?";
    const res = await fetch(`${YT_API}${endpoint}${separator}key=${key}`);
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    return res.json();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapSearchResult(item: any): MusicTrackResult {
    return {
      provider: "YOUTUBE_MUSIC",
      providerTrackId: item.id?.videoId ?? "",
      title: item.snippet?.title ?? "",
      artist: item.snippet?.channelTitle ?? "",
      album: null,
      albumArtUrl:
        item.snippet?.thumbnails?.high?.url ?? null,
      previewUrl: null,
      duration: null,
      isrc: null,
      externalUrl: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapVideo(item: any): MusicTrackResult {
    return {
      provider: "YOUTUBE_MUSIC",
      providerTrackId: item.id,
      title: item.snippet?.title ?? "",
      artist: item.snippet?.channelTitle ?? "",
      album: null,
      albumArtUrl:
        item.snippet?.thumbnails?.high?.url ?? null,
      previewUrl: null,
      duration: null,
      isrc: null,
      externalUrl: `https://www.youtube.com/watch?v=${item.id}`,
    };
  }
}
