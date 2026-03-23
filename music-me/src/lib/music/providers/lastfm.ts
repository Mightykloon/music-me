import type {
  MusicProvider,
  MusicProviderConfig,
  MusicTrackResult,
  PlaylistResult,
  PlaylistTrackResult,
  NowPlayingResult,
} from "../types";

const LASTFM_API = "https://ws.audioscrobbler.com/2.0/";

export class LastFmProvider implements MusicProvider {
  readonly config: MusicProviderConfig = {
    name: "LASTFM",
    displayName: "Last.fm",
    icon: "lastfm",
    color: "#D51007",
    supportsPlayback: false,
    supportsNowPlaying: true,
    supportsPlaylists: false,
    supportsLyrics: false,
  };

  async connect(code: string, _redirectUri: string) {
    // Last.fm uses a session key flow
    const key = process.env.LASTFM_API_KEY ?? "";
    const secret = process.env.LASTFM_API_SECRET ?? "";

    const res = await fetch(
      `${LASTFM_API}?method=auth.getSession&api_key=${key}&token=${code}&api_sig=${this.sign({ method: "auth.getSession", api_key: key, token: code }, secret)}&format=json`
    );

    if (!res.ok) throw new Error("Failed to get Last.fm session");
    const data = await res.json();
    const session = data.session;

    return {
      accessToken: session.key, // session key
      refreshToken: null,
      expiresAt: null, // Last.fm sessions don't expire
      providerUserId: session.name,
      providerUsername: session.name,
      scopes: null,
    };
  }

  async refreshToken(_refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  }> {
    // Last.fm sessions don't expire
    throw new Error("Last.fm sessions do not expire");
  }

  async searchTracks(
    _accessToken: string,
    query: string,
    limit = 20
  ): Promise<MusicTrackResult[]> {
    const data = await this.fetchApi(
      `method=track.search&track=${encodeURIComponent(query)}&limit=${limit}`
    );

    const tracks = data?.results?.trackmatches?.track ?? [];
    return tracks.map(this.mapTrack);
  }

  async getTrack(
    _accessToken: string,
    trackId: string
  ): Promise<MusicTrackResult> {
    // trackId format: "artist|track"
    const [artist, track] = trackId.split("|");
    const data = await this.fetchApi(
      `method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`
    );
    return this.mapTrackInfo(data.track);
  }

  async getUserPlaylists(
    _accessToken: string
  ): Promise<PlaylistResult[]> {
    return [];
  }

  async getPlaylistTracks(
    _accessToken: string,
    _playlistId: string
  ): Promise<PlaylistTrackResult[]> {
    return [];
  }

  async getNowPlaying(
    accessToken: string
  ): Promise<NowPlayingResult | null> {
    // accessToken is the username for Last.fm public endpoints
    const data = await this.fetchApi(
      `method=user.getRecentTracks&user=${accessToken}&limit=1`
    );

    const track = data?.recenttracks?.track?.[0];
    if (!track || !track["@attr"]?.nowplaying) return null;

    return {
      track: {
        provider: "LASTFM",
        providerTrackId: `${track.artist?.["#text"]}|${track.name}`,
        title: track.name ?? "",
        artist: track.artist?.["#text"] ?? "",
        album: track.album?.["#text"] ?? null,
        albumArtUrl: track.image?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (img: any) => img.size === "extralarge"
        )?.["#text"] ?? null,
        previewUrl: null,
        duration: null,
        isrc: null,
        externalUrl: track.url ?? null,
      },
      startedAt: new Date(),
      isPlaying: true,
    };
  }

  async getTopTracks(
    accessToken: string,
    timeRange = "overall"
  ): Promise<MusicTrackResult[]> {
    const period = {
      short_term: "1month",
      medium_term: "6month",
      long_term: "overall",
    }[timeRange] ?? "overall";

    const data = await this.fetchApi(
      `method=user.getTopTracks&user=${accessToken}&period=${period}&limit=50`
    );

    return (data?.toptracks?.track ?? []).map(this.mapTrack);
  }

  async getTopArtists(
    accessToken: string,
    timeRange = "overall"
  ): Promise<string[]> {
    const period = {
      short_term: "1month",
      medium_term: "6month",
      long_term: "overall",
    }[timeRange] ?? "overall";

    const data = await this.fetchApi(
      `method=user.getTopArtists&user=${accessToken}&period=${period}&limit=50`
    );

    return (data?.topartists?.artist ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => a.name
    );
  }

  getEmbedUrl(_trackId: string): string {
    return "";
  }

  getEmbedPlaylistUrl(_playlistId: string): string {
    return "";
  }

  private async fetchApi(params: string) {
    const key = process.env.LASTFM_API_KEY ?? process.env.MUSIXMATCH_API_KEY ?? "";
    const res = await fetch(
      `${LASTFM_API}?${params}&api_key=${key}&format=json`
    );
    if (!res.ok) throw new Error(`Last.fm API error: ${res.status}`);
    return res.json();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTrack(t: any): MusicTrackResult {
    return {
      provider: "LASTFM",
      providerTrackId: `${t.artist?.name ?? t.artist ?? ""}|${t.name}`,
      title: t.name ?? "",
      artist: t.artist?.name ?? t.artist ?? "",
      album: null,
      albumArtUrl:
        t.image?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (img: any) => img.size === "extralarge"
        )?.["#text"] ?? null,
      previewUrl: null,
      duration: t.duration ? Number(t.duration) * 1000 : null,
      isrc: null,
      externalUrl: t.url ?? null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTrackInfo(t: any): MusicTrackResult {
    return {
      provider: "LASTFM",
      providerTrackId: `${t.artist?.name ?? ""}|${t.name}`,
      title: t.name ?? "",
      artist: t.artist?.name ?? "",
      album: t.album?.title ?? null,
      albumArtUrl:
        t.album?.image?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (img: any) => img.size === "extralarge"
        )?.["#text"] ?? null,
      previewUrl: null,
      duration: t.duration ? Number(t.duration) : null,
      isrc: null,
      externalUrl: t.url ?? null,
    };
  }

  private sign(
    params: Record<string, string>,
    secret: string
  ): string {
    const keys = Object.keys(params).sort();
    let sig = "";
    for (const k of keys) sig += k + params[k];
    sig += secret;
    // In production, use MD5 hash; for now, return placeholder
    // import { createHash } from 'crypto'; return createHash('md5').update(sig).digest('hex');
    return sig;
  }
}
