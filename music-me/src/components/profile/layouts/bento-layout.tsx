"use client";

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSong } from "@/components/profile/profile-song";
import { PlaylistDisplay } from "@/components/profile/playlist-display";
import { LinkSection } from "@/components/profile/link-section";
import { VibeBoard } from "@/components/profile/vibe-board";
import { PostGrid } from "@/components/profile/post-grid";
import { NowPlayingBadge } from "@/components/profile/now-playing-badge";
import type { ProfileLayoutProps } from "./types";

export function BentoLayout({ user, posts, isOwn }: ProfileLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto w-full">
      {user.nowPlaying?.track && (
        <div className="mb-4">
          <NowPlayingBadge track={user.nowPlaying.track} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main header - spans 2 cols */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
          <ProfileHeader user={user} isOwn={isOwn} />
        </div>

        {/* Profile song - 1 col */}
        <div className="p-4 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm flex flex-col justify-center">
          {user.profileSong ? (
            <ProfileSong
              track={user.profileSong}
              autoplay={user.profile?.autoplayProfileSong}
              className="!bg-transparent !border-0 !p-0"
            />
          ) : (
            <div className="text-center text-muted-foreground text-sm">
              No profile song set
            </div>
          )}
        </div>

        {/* Links - 1 col */}
        {(user.links?.length ?? 0) > 0 && (
          <div className="p-4 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
            <LinkSection links={user.links ?? []} />
          </div>
        )}

        {/* Playlists - 2 cols */}
        {(user.playlists?.length ?? 0) > 0 && (
          <div className="md:col-span-2 p-4 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
            <PlaylistDisplay playlists={user.playlists ?? []} />
          </div>
        )}

        {/* Vibe board - full width */}
        {((user.profile?.vibeBoard as unknown[]) ?? []).length > 0 && (
          <div className="md:col-span-3 p-4 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
            <VibeBoard items={(user.profile?.vibeBoard as never[]) ?? []} />
          </div>
        )}

        {/* Posts - full width */}
        <div className="md:col-span-3 p-4 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
          <PostGrid posts={posts} />
        </div>
      </div>
    </div>
  );
}
