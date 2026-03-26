import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fixS3Url } from "@/lib/storage";
import { ProfileCanvas } from "./profile-canvas";
import type { ProfileLayoutProps } from "@/components/profile/layouts/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { displayName: true, username: true, bio: true },
  });

  if (!user) return { title: "User not found" };

  return {
    title: `${user.displayName ?? user.username} on remixd`,
    description: user.bio ?? `Check out ${user.username}'s profile on remixd`,
    openGraph: {
      title: `${user.displayName ?? user.username}`,
      description: user.bio ?? `@${user.username} on remixd`,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      profile: true,
      links: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      },
      playlists: {
        where: { isPublic: true, isPinned: true },
        orderBy: { displayOrder: "asc" },
      },
      nowPlaying: {
        include: { track: true },
      },
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });

  if (!user) notFound();

  // Get profile song
  const profileSong = user.profile?.profileSongId
    ? await db.musicTrack.findUnique({
        where: { id: user.profile.profileSongId },
      })
    : null;

  // Get genre stats from user's playlist tracks
  const playlistTracks = await db.playlistTrack.findMany({
    where: { playlist: { userId: user.id, isPublic: true } },
    include: { track: { select: { album: true, artist: true } } },
    take: 500,
  });

  // Build genre map from artists (using artist names as genre proxies)
  const artistCounts: Record<string, number> = {};
  for (const pt of playlistTracks) {
    const artist = pt.track.artist?.trim();
    if (artist) {
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
    }
  }
  const topArtistGenres = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([genre, count]) => ({ genre, count }));

  // Get recent posts
  const posts = await db.post.findMany({
    where: { authorId: user.id, visibility: "PUBLIC" },
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          username: true,
          displayName: true,
          profile: { select: { profilePictureUrl: true } },
        },
      },
      attachedTrack: {
        select: { title: true, artist: true, albumArtUrl: true },
      },
      _count: {
        select: { comments: true, reactions: true, reposts: true },
      },
    },
  });

  const session = await auth();
  const isOwn = session?.user?.id === user.id;

  // Fix any broken S3 URLs from old "auto" region config
  if (user.profile) {
    user.profile.profilePictureUrl = fixS3Url(user.profile.profilePictureUrl);
    user.profile.bannerUrl = fixS3Url(user.profile.bannerUrl);
    user.profile.backgroundImageUrl = fixS3Url(user.profile.backgroundImageUrl);
    user.profile.bannerVideoUrl = fixS3Url(user.profile.bannerVideoUrl);
  }

  // Build the data object for the client component
  const profileData = {
    ...user,
    profileSong: profileSong
      ? {
          id: profileSong.id,
          provider: profileSong.provider,
          providerTrackId: profileSong.providerTrackId,
          title: profileSong.title,
          artist: profileSong.artist,
          album: profileSong.album,
          albumArtUrl: profileSong.albumArtUrl,
          previewUrl: profileSong.previewUrl,
          duration: profileSong.duration,
          externalUrl: profileSong.externalUrl,
        }
      : null,
    nowPlaying: user.nowPlaying?.isActive
      ? {
          track: {
            id: user.nowPlaying.track.id,
            provider: user.nowPlaying.track.provider,
            providerTrackId: user.nowPlaying.track.providerTrackId,
            title: user.nowPlaying.track.title,
            artist: user.nowPlaying.track.artist,
            album: user.nowPlaying.track.album,
            albumArtUrl: user.nowPlaying.track.albumArtUrl,
            previewUrl: user.nowPlaying.track.previewUrl,
            duration: user.nowPlaying.track.duration,
            externalUrl: user.nowPlaying.track.externalUrl,
          },
        }
      : null,
  };

  const postsData = posts.map((p: (typeof posts)[number]) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <ProfileCanvas
      user={profileData as unknown as ProfileLayoutProps["user"]}
      posts={postsData as unknown as ProfileLayoutProps["posts"]}
      isOwn={isOwn}
      genres={topArtistGenres}
    />
  );
}
