import type { MusicProvider } from "./types";
import { SpotifyProvider } from "./providers/spotify";
import { AppleMusicProvider } from "./providers/apple-music";
import { SoundCloudProvider } from "./providers/soundcloud";
import { YouTubeMusicProvider } from "./providers/youtube";
import { LastFmProvider } from "./providers/lastfm";
import { DeezerProvider } from "./providers/deezer";

export type ProviderName =
  | "SPOTIFY"
  | "APPLE_MUSIC"
  | "SOUNDCLOUD"
  | "YOUTUBE_MUSIC"
  | "LASTFM"
  | "DEEZER"
  | "TIDAL";

const providers: Partial<Record<ProviderName, MusicProvider>> = {
  SPOTIFY: new SpotifyProvider(),
  APPLE_MUSIC: new AppleMusicProvider(),
  SOUNDCLOUD: new SoundCloudProvider(),
  YOUTUBE_MUSIC: new YouTubeMusicProvider(),
  LASTFM: new LastFmProvider(),
  DEEZER: new DeezerProvider(),
};

export function getMusicProvider(name: string): MusicProvider {
  const provider = providers[name as ProviderName];
  if (!provider) throw new Error(`Unknown music provider: ${name}`);
  return provider;
}

export function getAllProviders(): Partial<Record<ProviderName, MusicProvider>> {
  return providers;
}

export function getProviderConfig(name: ProviderName) {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown music provider: ${name}`);
  return provider.config;
}
