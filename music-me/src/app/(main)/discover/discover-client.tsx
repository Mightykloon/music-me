"use client";

import Link from "next/link";
import { TrendingUp, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PostCard, type PostCardData } from "@/components/feed/post-card";

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string | null;
  isVerified: boolean;
  bio: string | null;
  profile: { profilePictureUrl: string | null } | null;
  _count: { followers: number; posts: number };
}

interface DiscoverClientProps {
  trendingPosts: PostCardData[];
  suggestedUsers: SuggestedUser[];
}

export function DiscoverClient({
  trendingPosts,
  suggestedUsers,
}: DiscoverClientProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="px-4 py-4 border-b border-border/50">
        <h1 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
          Discover
        </h1>
      </div>

      {/* Suggested Users */}
      {suggestedUsers.length > 0 && (
        <section className="px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">People to Follow</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {suggestedUsers.map((user) => (
              <Link
                key={user.id}
                href={`/${user.username}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors text-center"
              >
                <Avatar
                  src={user.profile?.profilePictureUrl}
                  alt={user.displayName ?? user.username}
                  size="lg"
                />
                <div className="min-w-0 w-full">
                  <p className="font-medium text-sm truncate">
                    {user.displayName ?? user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{user.username}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user._count.followers} followers · {user._count.posts} posts
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Posts */}
      <section>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Trending</h2>
        </div>
        {trendingPosts.length > 0 ? (
          trendingPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-20 px-4">
            <p className="text-muted-foreground text-sm">
              Nothing trending yet. Be the first to post!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
