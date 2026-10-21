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
import { Card, Mood, Top8, Wall } from "@/components/profile/profile-extras";
import { favoritesOf, hasFavorites, vibeItemsOf } from "./shared";
import type { ProfileLayoutProps } from "./types";

export function MagazineLayout({ user, posts, isOwn, genres, custom, wall, viewerId }: ProfileLayoutProps) {
  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* Full-width hero with banner */}
      <div className="relative mb-8">
        {user.profile?.bannerUrl && (
          <div className="profile-banner relative h-64 @2xl:h-80 overflow-hidden">
            <img src={user.profile.bannerUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--profile-bg)] via-transparent to-transparent" />
          </div>
        )}

        <Card className={`relative ${user.profile?.bannerUrl ? "-mt-16 mx-4 @2xl:mx-6" : ""}`}>
          {user.nowPlaying?.track && (
            <div className="mb-4">
              <NowPlayingBadge track={user.nowPlaying.track} />
            </div>
          )}
          <ProfileHeader user={user} isOwn={isOwn} />
          <div className="mt-3"><Mood custom={custom} /></div>
        </Card>
      </div>

      {/* Two-column editorial layout */}
      <div className="grid grid-cols-1 @3xl:grid-cols-3 gap-6 @3xl:gap-8">
        <div className="@3xl:col-span-2 space-y-6">
          {user.profileSong && (
            <ProfileSong track={user.profileSong} autoplay={user.profile?.autoplayProfileSong} skin={custom.songSkin} />
          )}
          {hasFavorites(user) && <Card><FavoritesSection favorites={favoritesOf(user)} /></Card>}
          {vibeItemsOf(user).length > 0 && <Card><VibeBoard items={vibeItemsOf(user)} /></Card>}
          <Card><PostGrid posts={posts} /></Card>
          {custom.showWall && wall && <Wall username={user.username} initial={wall} viewerId={viewerId} isOwn={isOwn} />}
        </div>

        <aside className="space-y-6">
          {custom.showTop8 && <Top8 friends={user.top8 ?? []} title={custom.top8Title} isOwn={isOwn} />}
          {(genres?.length ?? 0) > 0 && <Card><GenreWidget genres={genres ?? []} /></Card>}
          {(user.links?.length ?? 0) > 0 && <Card><LinkSection links={user.links} /></Card>}
          {(user.playlists?.length ?? 0) > 0 && <Card><PlaylistDisplay playlists={user.playlists} /></Card>}
        </aside>
      </div>
    </div>
  );
}
