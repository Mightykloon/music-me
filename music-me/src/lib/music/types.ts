export interface MusicProviderConfig {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  supportsPlayback: boolean;
  supportsNowPlaying: boolean;
  supportsPlaylists: boolean;
  supportsLyrics: boolean;
}

export interface MusicTrackResult {
  provider: string;
  providerTrackId: string;
  title: string;
  artist: string;
  album: string | null;
  albumArtUrl: string | null;
  previewUrl: string | null;
  duration: number | null;
  isrc: string | null;
  externalUrl: string | null;
}

export interface PlaylistResult {
  providerPlaylistId: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  trackCount: number;
  externalUrl: string | null;
}

export interface PlaylistTrackResult {
  track: MusicTrackResult;
  position: number;
  addedAt: Date;
}

export interface NowPlayingResult {
  track: MusicTrackResult;
  startedAt: Date;
  isPlaying: boolean;
}

export interface MusicProvider {
  readonly config: MusicProviderConfig;

  /** Exchange OAuth code for tokens */
  connect(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
    providerUserId: string | null;
    providerUsername: string | null;
    scopes: string | null;
  }>;

  /** Refresh an expired access token */
  refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  }>;

  /** Search tracks */
  searchTracks(
    accessToken: string,
    query: string,
    limit?: number
  ): Promise<MusicTrackResult[]>;

  /** Get a single track by provider ID */
  getTrack(accessToken: string, trackId: string): Promise<MusicTrackResult>;

  /** Get user's playlists */
  getUserPlaylists(accessToken: string): Promise<PlaylistResult[]>;

  /** Get tracks in a playlist */
  getPlaylistTracks(
    accessToken: string,
    playlistId: string
  ): Promise<PlaylistTrackResult[]>;

  /** Get currently playing track */
  getNowPlaying(accessToken: string): Promise<NowPlayingResult | null>;

  /** Get user's top tracks */
  getTopTracks(
    accessToken: string,
    timeRange?: string
  ): Promise<MusicTrackResult[]>;

  /** Get user's top artists */
  getTopArtists(
    accessToken: string,
    timeRange?: string
  ): Promise<string[]>;

  /** Get embed URL for a track */
  getEmbedUrl(trackId: string): string;

  /** Get embed URL for a playlist */
  getEmbedPlaylistUrl(playlistId: string): string;
}
