"use client";

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSong } from "@/components/profile/profile-song";
import { PlaylistDisplay } from "@/components/profile/playlist-display";
import { LinkSection } from "@/components/profile/link-section";
import { VibeBoard } from "@/components/profile/vibe-board";
import { PostGrid } from "@/components/profile/post-grid";
import { NowPlayingBadge } from "@/components/profile/now-playing-badge";
import { FavoritesSection } from "@/components/profile/favorites-section";
import { GenreWidget } from "@/components/profile/genre-widget";
import { Card, Mood, ProfileExtras } from "@/components/profile/profile-extras";
import { favoritesOf, hasFavorites, vibeItemsOf } from "./shared";
import type { ProfileLayoutProps } from "./types";

export function ClassicLayout(props: ProfileLayoutProps) {
  const { user, posts, isOwn, genres, custom } = props;
  return (
    <div className="max-w-2xl mx-auto w-full space-y-5 @2xl:space-y-6">
      {user.profile?.bannerUrl && (
        <div className="profile-banner relative h-40 @2xl:h-64 overflow-hidden -mx-4 @2xl:mx-0">
          <img src={user.profile.bannerUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--profile-bg)] via-[var(--profile-bg)]/40 to-transparent" />
        </div>
      )}
      {user.nowPlaying?.track && <NowPlayingBadge track={user.nowPlaying.track} />}
      <Card>
        <ProfileHeader user={user} isOwn={isOwn} />
        <div className="mt-3"><Mood custom={custom} /></div>
      </Card>
      {user.profileSong && <ProfileSong track={user.profileSong} autoplay={user.profile?.autoplayProfileSong} skin={custom.songSkin} />}
      {(genres?.length ?? 0) > 0 && <Card><GenreWidget genres={genres ?? []} /></Card>}
      {hasFavorites(user) && <Card><FavoritesSection favorites={favoritesOf(user)} /></Card>}
      {(user.links?.length ?? 0) > 0 && <Card><LinkSection links={user.links} /></Card>}
      {(user.playlists?.length ?? 0) > 0 && <Card><PlaylistDisplay playlists={user.playlists} /></Card>}
      {vibeItemsOf(user).length > 0 && <Card><VibeBoard items={vibeItemsOf(user)} /></Card>}
      <ProfileExtras {...props} />
      <Card><PostGrid posts={posts} /></Card>
    </div>
  );
}
