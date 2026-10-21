"use client";

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSong } from "@/components/profile/profile-song";
import { PlaylistDisplay } from "@/components/profile/playlist-display";
import { LinkSection } from "@/components/profile/link-section";
import { PostGrid } from "@/components/profile/post-grid";
import { NowPlayingBadge } from "@/components/profile/now-playing-badge";
import { FavoritesSection } from "@/components/profile/favorites-section";
import { GenreWidget } from "@/components/profile/genre-widget";
import { Mood, ProfileExtras } from "@/components/profile/profile-extras";
import { favoritesOf } from "./shared";
import type { ProfileLayoutProps } from "./types";

// Minimal keeps boxes to a minimum: only the extras sit in cards.
export function MinimalLayout(props: ProfileLayoutProps) {
  const { user, posts, isOwn, genres, custom } = props;
  return (
    <div className="max-w-lg mx-auto w-full space-y-8">
      {user.nowPlaying?.track && (
        <div className="flex justify-center">
          <NowPlayingBadge track={user.nowPlaying.track} />
        </div>
      )}

      <div className="text-center">
        <ProfileHeader user={user} isOwn={isOwn} className="text-center [&_*]:justify-center" />
        <div className="mt-3"><Mood custom={custom} /></div>
      </div>

      {user.profileSong && (
        <ProfileSong track={user.profileSong} autoplay={user.profile?.autoplayProfileSong} skin={custom.songSkin} />
      )}

      {(genres?.length ?? 0) > 0 && <GenreWidget genres={genres ?? []} />}
      <FavoritesSection favorites={favoritesOf(user)} />
      <LinkSection links={user.links ?? []} />
      <PlaylistDisplay playlists={user.playlists ?? []} />
      <ProfileExtras {...props} />
      <PostGrid posts={posts} />
    </div>
  );
}
