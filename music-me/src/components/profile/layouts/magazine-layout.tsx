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
import type { ProfileLayoutProps } from "./types";

export function MagazineLayout({ user, posts, isOwn, genres }: ProfileLayoutProps) {
  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* Full-width hero with banner */}
      <div className="relative mb-8">
        {user.profile?.bannerUrl && (
          <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden">
            <img
              src={user.profile.bannerUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--profile-bg)] via-transparent to-transparent" />
          </div>
        )}

        <div className="relative -mt-16 px-6">
          {user.nowPlaying?.track && (
            <div className="mb-4">
              <NowPlayingBadge track={user.nowPlaying.track} />
            </div>
          )}
          <ProfileHeader user={user} isOwn={isOwn} />
        </div>
      </div>

      {/* Two-column editorial layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="md:col-span-2 space-y-6">
          {user.profileSong && (
            <ProfileSong
              track={user.profileSong}
              autoplay={user.profile?.autoplayProfileSong}
            />
          )}

          <FavoritesSection favorites={(user.profile?.favorites as { books?: string[]; games?: string[]; hobbies?: string[]; interests?: string[] }) ?? null} />

          <VibeBoard items={(user.profile?.vibeBoard as never[]) ?? []} />

          <PostGrid posts={posts} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {(genres?.length ?? 0) > 0 && (
            <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
              <GenreWidget genres={genres ?? []} />
            </div>
          )}

          <LinkSection links={user.links ?? []} />

          <PlaylistDisplay playlists={user.playlists ?? []} />
        </div>
      </div>
    </div>
  );
}
