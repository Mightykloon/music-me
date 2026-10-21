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
import { Card, Mood, SectionTitle, Top8, Wall } from "@/components/profile/profile-extras";
import { favoritesOf, hasFavorites, vibeItemsOf } from "./shared";
import type { ProfileLayoutProps } from "./types";

// The 2007 arrangement: you, your song and your links on the left; blurbs,
// Friend Space and the comment wall on the right.
export function MyspaceLayout({ user, posts, isOwn, genres, custom, wall, viewerId }: ProfileLayoutProps) {
  const name = user.displayName ?? user.username;
  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-1 @3xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <Card>
            {user.nowPlaying?.track && (
              <div className="mb-4">
                <NowPlayingBadge track={user.nowPlaying.track} />
              </div>
            )}
            <ProfileHeader user={user} isOwn={isOwn} />
            <div className="mt-3"><Mood custom={custom} /></div>
          </Card>

          {user.profileSong && (
            <ProfileSong track={user.profileSong} autoplay={user.profile?.autoplayProfileSong} skin={custom.songSkin} />
          )}

          {(user.links?.length ?? 0) > 0 && <Card><LinkSection links={user.links} /></Card>}
          {(genres?.length ?? 0) > 0 && <Card><GenreWidget genres={genres ?? []} /></Card>}
          {(user.playlists?.length ?? 0) > 0 && <Card><PlaylistDisplay playlists={user.playlists} /></Card>}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <SectionTitle>{name}&apos;s blurbs</SectionTitle>
            {hasFavorites(user) ? (
              <FavoritesSection favorites={favoritesOf(user)} />
            ) : (
              <p className="text-sm opacity-60">{isOwn ? "Add interests, hobbies and favorites in edit profile." : "Nothing here yet."}</p>
            )}
          </Card>

          {custom.showTop8 && (
            <Top8 friends={user.top8 ?? []} title={custom.top8Title === "Top 8" ? `${name}'s Friend Space` : custom.top8Title} isOwn={isOwn} />
          )}

          {vibeItemsOf(user).length > 0 && <Card><VibeBoard items={vibeItemsOf(user)} /></Card>}

          <Card>
            <SectionTitle>posts</SectionTitle>
            <PostGrid posts={posts} />
          </Card>

          {custom.showWall && wall && <Wall username={user.username} initial={wall} viewerId={viewerId} isOwn={isOwn} />}
        </div>
      </div>
    </div>
  );
}
