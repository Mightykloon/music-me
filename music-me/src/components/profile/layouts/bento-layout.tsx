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

export function BentoLayout({ user, posts, isOwn, genres, custom, wall, viewerId }: ProfileLayoutProps) {
  const hasGenres = (genres?.length ?? 0) > 0;
  const showWall = custom.showWall && !!wall;
  return (
    <div className="max-w-4xl mx-auto w-full">
      {user.nowPlaying?.track && (
        <div className="mb-4">
          <NowPlayingBadge track={user.nowPlaying.track} />
        </div>
      )}

      <div className="grid grid-cols-1 @3xl:grid-cols-3 gap-4">
        <Card className="@3xl:col-span-2">
          <ProfileHeader user={user} isOwn={isOwn} />
          <div className="mt-3"><Mood custom={custom} /></div>
        </Card>

        <div className="flex flex-col justify-center">
          {user.profileSong ? (
            <ProfileSong track={user.profileSong} autoplay={user.profile?.autoplayProfileSong} skin={custom.songSkin} />
          ) : (
            <Card className="text-center text-sm opacity-60">No profile song set</Card>
          )}
        </div>

        {hasGenres && <Card><GenreWidget genres={genres ?? []} /></Card>}

        {(user.links?.length ?? 0) > 0 && (
          <Card className={hasGenres ? "@3xl:col-span-2" : "@3xl:col-span-3"}>
            <LinkSection links={user.links} />
          </Card>
        )}

        {custom.showTop8 && (
          <div className="@3xl:col-span-2">
            <Top8 friends={user.top8 ?? []} title={custom.top8Title} isOwn={isOwn} />
          </div>
        )}

        {(user.playlists?.length ?? 0) > 0 && (
          <Card className={custom.showTop8 ? "" : "@3xl:col-span-3"}>
            <PlaylistDisplay playlists={user.playlists} />
          </Card>
        )}

        {hasFavorites(user) && (
          <Card className="@3xl:col-span-3">
            <FavoritesSection favorites={favoritesOf(user)} />
          </Card>
        )}

        {vibeItemsOf(user).length > 0 && (
          <Card className="@3xl:col-span-3">
            <VibeBoard items={vibeItemsOf(user)} />
          </Card>
        )}

        <Card className={showWall ? "@3xl:col-span-2" : "@3xl:col-span-3"}>
          <PostGrid posts={posts} />
        </Card>

        {showWall && wall && (
          <div>
            <Wall username={user.username} initial={wall} viewerId={viewerId} isOwn={isOwn} />
          </div>
        )}
      </div>
    </div>
  );
}
