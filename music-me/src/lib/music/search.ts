import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getMusicProvider } from "./index";
import { decrypt } from "@/lib/utils/encryption";
import type { MusicTrackResult } from "./types";
import type { MusicProviderType } from "@prisma/client";

const SEARCH_CACHE_TTL = 3600; // 1 hour

export interface UnifiedSearchResult extends MusicTrackResult {
  /** Merged results from multiple providers keyed by provider name */
  providers: string[];
}

/**
 * Search for tracks across all of a user's connected music services.
 * Results are deduplicated by ISRC or fuzzy title+artist match.
 */
export async function unifiedSearch(
  userId: string,
  query: string,
  limit = 20
): Promise<UnifiedSearchResult[]> {
  const cacheKey = `search:${userId}:${query}:${limit}`.toLowerCase();

  // Check cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Redis unavailable
  }

  // Get user's active connections
  const connections = await db.musicConnection.findMany({
    where: { userId, isActive: true },
  });

  if (connections.length === 0) return [];

  // Search all connected services in parallel
  const searchPromises = connections.map(async (conn) => {
    try {
      const provider = getMusicProvider(conn.provider);
      const token = decrypt(conn.accessToken);

      // Check if token is expired and refresh if needed
      let accessToken = token;
      if (conn.expiresAt && conn.expiresAt < new Date() && conn.refreshToken) {
        try {
          const refreshed = await provider.refreshToken(
            decrypt(conn.refreshToken)
          );
          accessToken = refreshed.accessToken;
          // Update token in DB (fire and forget)
          void updateConnectionToken(conn.id, refreshed);
        } catch {
          return [];
        }
      }

      return provider.searchTracks(accessToken, query, limit);
    } catch {
      return [];
    }
  });

  const allResults = await Promise.all(searchPromises);
  const flatResults = allResults.flat();

  // Deduplicate
  const deduplicated = deduplicateResults(flatResults);
  const limited = deduplicated.slice(0, limit);

  // Cache
  try {
    await redis.setex(cacheKey, SEARCH_CACHE_TTL, JSON.stringify(limited));
  } catch {
    // Redis unavailable
  }

  return limited;
}

/**
 * Deduplicate results: prefer ISRC match, fallback to fuzzy title+artist.
 */
function deduplicateResults(
  results: MusicTrackResult[]
): UnifiedSearchResult[] {
  const seen = new Map<string, UnifiedSearchResult>();

  for (const result of results) {
    // Try ISRC first
    if (result.isrc) {
      const existing = seen.get(`isrc:${result.isrc}`);
      if (existing) {
        if (!existing.providers.includes(result.provider)) {
          existing.providers.push(result.provider);
        }
        continue;
      }
      seen.set(`isrc:${result.isrc}`, {
        ...result,
        providers: [result.provider],
      });
      continue;
    }

    // Fuzzy match by normalized title + artist
    const key = normalizeKey(result.title, result.artist);
    const existing = seen.get(`fuzzy:${key}`);
    if (existing) {
      if (!existing.providers.includes(result.provider)) {
        existing.providers.push(result.provider);
      }
      continue;
    }
    seen.set(`fuzzy:${key}`, {
      ...result,
      providers: [result.provider],
    });
  }

  return Array.from(seen.values());
}

function normalizeKey(title: string, artist: string): string {
  return `${title}|${artist}`
    .toLowerCase()
    .replace(/[^a-z0-9|]/g, "")
    .replace(/\s+/g, "");
}

async function updateConnectionToken(
  connectionId: string,
  refreshed: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  }
) {
  const { encrypt } = await import("@/lib/utils/encryption");
  await db.musicConnection.update({
    where: { id: connectionId },
    data: {
      accessToken: encrypt(refreshed.accessToken),
      refreshToken: refreshed.refreshToken
        ? encrypt(refreshed.refreshToken)
        : undefined,
      expiresAt: refreshed.expiresAt,
    },
  });
}

/**
 * Search for a track and upsert it into the MusicTrack table.
 * Returns the database record.
 */
export async function findOrCreateTrack(track: MusicTrackResult) {
  return db.musicTrack.upsert({
    where: {
      provider_providerTrackId: {
        provider: track.provider as MusicProviderType,
        providerTrackId: track.providerTrackId,
      },
    },
    update: {
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArtUrl: track.albumArtUrl,
      previewUrl: track.previewUrl,
      duration: track.duration,
      isrc: track.isrc,
      externalUrl: track.externalUrl,
    },
    create: {
      provider: track.provider as MusicProviderType,
      providerTrackId: track.providerTrackId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArtUrl: track.albumArtUrl,
      previewUrl: track.previewUrl,
      duration: track.duration,
      isrc: track.isrc,
      externalUrl: track.externalUrl,
    },
  });
}
