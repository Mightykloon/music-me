import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
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

  try {
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
      />
    );
  } catch (error) {
    console.error("[ProfilePage] Error:", error);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-purple-400 mb-2">Profile Error</h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Unknown error loading profile"}
          </p>
          <a href="/" className="text-purple-400 underline">Go home</a>
        </div>
      </div>
    );
  }
}
