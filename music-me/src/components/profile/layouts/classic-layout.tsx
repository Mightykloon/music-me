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

export function ClassicLayout({ user, posts, isOwn, genres }: ProfileLayoutProps) {
  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 sm:space-y-8">
      {user.profile?.bannerUrl && (
        <div className="relative h-40 sm:h-64 rounded-2xl overflow-hidden -mx-4 sm:mx-0">
          <img src={user.profile.bannerUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--profile-bg)] via-[var(--profile-bg)]/40 to-transparent" />
        </div>
      )}
      {user.nowPlaying?.track && <NowPlayingBadge track={user.nowPlaying.track} />}
      {user.profileSong && <ProfileSong track={user.profileSong} autoplay={user.profile?.autoplayProfileSong} />}
      <ProfileHeader user={user} isOwn={isOwn} />
      <div className="space-y-6 sm:space-y-8">
        {(genres?.length ?? 0) > 0 && (
          <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
            <GenreWidget genres={genres ?? []} />
          </div>
        )}
        <FavoritesSection favorites={(user.profile?.favorites as { books?: string[]; games?: string[]; hobbies?: string[]; interests?: string[] }) ?? null} />
        <LinkSection links={user.links ?? []} />
        <PlaylistDisplay playlists={user.playlists ?? []} />
        <VibeBoard items={(user.profile?.vibeBoard as never[]) ?? []} />
        <PostGrid posts={posts} />
      </div>
    </div>
  );
}
