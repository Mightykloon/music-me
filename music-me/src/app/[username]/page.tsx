import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fixS3Url } from "@/lib/storage";
import { ProfileCanvas } from "./profile-canvas";
import { MainNav } from "@/components/layout/main-nav";
import { GuestNotice } from "@/components/auth/guest-notice";
import { isGuest } from "@/lib/guest";
import type { ProfileLayoutProps } from "@/components/profile/layouts/types";
import { readCustomization } from "@/lib/profile/customization";
import { recentThreads } from "@/lib/profile/threads";

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

  // Only public fields: everything here is sent to the visitor's browser, so
  // never the email, password hash or other account data.
  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      pronouns: true,
      location: true,
      website: true,
      isVerified: true,
      role: true,
      createdAt: true,
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
  const viewerId = session?.user?.id ?? null;
  const isOwn = viewerId === user.id;
  const custom = readCustomization(user.profile?.customization);

  // Top 8, the first page of the comment wall, and whether the visitor follows them
  const [top8, wallRows, viewerFollow, threads] = await Promise.all([
    custom.showTop8
      ? db.bestFriend.findMany({
          where: { userId: user.id },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          take: 8,
          select: {
            friend: {
              select: { id: true, username: true, displayName: true, profile: { select: { profilePictureUrl: true } } },
            },
          },
        })
      : [],
    custom.showWall
      ? db.wallComment.findMany({
          where: { profileUserId: user.id },
          orderBy: { createdAt: "desc" },
          take: 21,
          include: {
            author: {
              select: { id: true, username: true, displayName: true, profile: { select: { profilePictureUrl: true } } },
            },
          },
        })
      : [],
    viewerId && !isOwn
      ? db.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
          select: { createdAt: true },
        })
      : null,
    recentThreads(user.id),
  ]);
  const wall = {
    comments: wallRows.slice(0, 20).map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      author: { ...c.author, profile: c.author.profile && { profilePictureUrl: fixS3Url(c.author.profile.profilePictureUrl) } },
    })),
    nextCursor: wallRows.length > 20 ? wallRows[19].id : null,
  };

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
    isFollowedByViewer: !!viewerFollow,
    threads,
    top8: top8.map(({ friend }) => ({
      id: friend.id,
      username: friend.username,
      displayName: friend.displayName,
      profilePictureUrl: fixS3Url(friend.profile?.profilePictureUrl ?? null),
    })),
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

  // signed-in visitors and guests keep the site nav; strangers from a shared link see just the profile
  const guest = !session?.user && (await isGuest());
  const withNav = !!session?.user || guest;

  const postsData = posts.map((p: (typeof posts)[number]) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <>
      {withNav && <MainNav user={session?.user ?? null} />}
      {guest && <GuestNotice />}
      <div className={withNav ? "pb-16 sm:pb-0 sm:pt-16" : undefined}>
        <ProfileCanvas
          user={profileData as unknown as ProfileLayoutProps["user"]}
          posts={postsData as unknown as ProfileLayoutProps["posts"]}
          isOwn={isOwn}
          viewerId={viewerId}
          custom={custom}
          wall={wall}
          genres={topArtistGenres}
        />
      </div>
    </>
  );
}
