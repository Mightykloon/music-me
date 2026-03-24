"use client";

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSong } from "@/components/profile/profile-song";
import { LinkSection } from "@/components/profile/link-section";
import { PostGrid } from "@/components/profile/post-grid";
import { NowPlayingBadge } from "@/components/profile/now-playing-badge";
import { FavoritesSection } from "@/components/profile/favorites-section";
import type { ProfileLayoutProps } from "./types";

export function MinimalLayout({ user, posts, isOwn }: ProfileLayoutProps) {
  return (
    <div className="max-w-lg mx-auto w-full space-y-8 text-center">
      {user.nowPlaying?.track && (
        <div className="flex justify-center">
          <NowPlayingBadge track={user.nowPlaying.track} />
        </div>
      )}

      <ProfileHeader user={user} isOwn={isOwn} className="text-center [&_*]:justify-center" />

      {user.profileSong && (
        <ProfileSong
          track={user.profileSong}
          autoplay={user.profile?.autoplayProfileSong}
        />
      )}

      <FavoritesSection favorites={(user.profile?.favorites as { books?: string[]; games?: string[]; hobbies?: string[]; interests?: string[] }) ?? null} />

      <LinkSection links={user.links ?? []} />

      <PostGrid posts={posts} />
    </div>
  );
}
