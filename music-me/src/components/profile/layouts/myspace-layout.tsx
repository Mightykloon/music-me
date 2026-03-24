"use client";

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSong } from "@/components/profile/profile-song";
import { PlaylistDisplay } from "@/components/profile/playlist-display";
import { LinkSection } from "@/components/profile/link-section";
import { PostGrid } from "@/components/profile/post-grid";
import { NowPlayingBadge } from "@/components/profile/now-playing-badge";
import { FavoritesSection } from "@/components/profile/favorites-section";
import type { ProfileLayoutProps } from "./types";

export function MyspaceLayout({ user, posts, isOwn }: ProfileLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Classic bordered header */}
      <div className="border-2 border-[var(--profile-primary)]/40 rounded-lg p-6 mb-4 bg-black/30">
        {user.nowPlaying?.track && (
          <div className="mb-4">
            <NowPlayingBadge track={user.nowPlaying.track} />
          </div>
        )}

        <ProfileHeader user={user} isOwn={isOwn} />

        {user.profileSong && (
          <div className="mt-4">
            <ProfileSong
              track={user.profileSong}
              autoplay={user.profile?.autoplayProfileSong}
            />
          </div>
        )}
      </div>

      {/* Favorites */}
      <div className="border-2 border-[var(--profile-primary)]/40 rounded-lg p-4 mb-4 bg-black/30">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--profile-primary)] border-b border-[var(--profile-primary)]/30 pb-2 mb-3">About Me</h3>
        <FavoritesSection favorites={(user.profile?.favorites as { books?: string[]; games?: string[]; hobbies?: string[]; interests?: string[] }) ?? null} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column - "About Me" style */}
        <div className="space-y-4">
          <div className="border-2 border-[var(--profile-primary)]/40 rounded-lg p-4 bg-black/30">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--profile-primary)] border-b border-[var(--profile-primary)]/30 pb-2 mb-3">
              Top 8 Tracks
            </h3>
            <PlaylistDisplay playlists={user.playlists ?? []} />
            {(user.playlists?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                No playlists pinned yet
              </p>
            )}
          </div>

          <div className="border-2 border-[var(--profile-primary)]/40 rounded-lg p-4 bg-black/30">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--profile-primary)] border-b border-[var(--profile-primary)]/30 pb-2 mb-3">
              Links
            </h3>
            <LinkSection links={user.links ?? []} />
            {(user.links?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                No links added yet
              </p>
            )}
          </div>
        </div>

        {/* Right column - posts */}
        <div className="border-2 border-[var(--profile-primary)]/40 rounded-lg p-4 bg-black/30">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--profile-primary)] border-b border-[var(--profile-primary)]/30 pb-2 mb-3">
            Posts
          </h3>
          <PostGrid posts={posts} />
        </div>
      </div>
    </div>
  );
}
