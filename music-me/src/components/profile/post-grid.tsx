"use client";

import Image from "next/image";
import { MessageCircle, Flame, Repeat2, Music, Film } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/avatar";

interface PostGridItem {
  id: string;
  type: string;
  content: string | null;
  mediaUrls: string[];
  videoUrl: string | null;
  thumbnailUrl: string | null;
  attachedTrack: {
    title: string;
    artist: string;
    albumArtUrl: string | null;
  } | null;
  createdAt: string;
  author: {
    username: string;
    displayName: string | null;
    profile: { profilePictureUrl: string | null } | null;
  };
  _count: {
    comments: number;
    reactions: number;
    reposts: number;
  };
}

interface PostGridProps {
  posts: PostGridItem[];
  className?: string;
}

export function PostGrid({ posts, className }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className={`text-center py-12 text-muted-foreground ${className ?? ""}`}>
        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No posts yet</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold font-[family-name:var(--profile-heading-font)] mb-3">
        Posts
      </h2>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="p-4 rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm hover:bg-white/5 transition-colors"
          >
            {/* Author row */}
            <div className="flex items-center gap-2 mb-2">
              <Avatar
                src={post.author.profile?.profilePictureUrl}
                alt={post.author.displayName ?? post.author.username}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">
                  {post.author.displayName ?? post.author.username}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            {/* Content */}
            {post.content && (
              <p className="text-sm mb-3 whitespace-pre-wrap break-words">
                {post.content}
              </p>
            )}

            {/* Media */}
            {post.mediaUrls.length > 0 && (
              <div
                className={`grid gap-1 rounded-lg overflow-hidden mb-3 ${
                  post.mediaUrls.length === 1
                    ? "grid-cols-1"
                    : post.mediaUrls.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-2"
                }`}
              >
                {post.mediaUrls.slice(0, 4).map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Video */}
            {post.videoUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-black">
                <Film className="absolute top-2 right-2 w-4 h-4 text-white/60" />
              </div>
            )}

            {/* Attached track */}
            {post.attachedTrack && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 mb-3">
                {post.attachedTrack.albumArtUrl && (
                  <Image
                    src={post.attachedTrack.albumArtUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="rounded"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {post.attachedTrack.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {post.attachedTrack.artist}
                  </p>
                </div>
                <Music className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {post._count.reactions}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {post._count.comments}
              </span>
              <span className="flex items-center gap-1">
                <Repeat2 className="w-3.5 h-3.5" />
                {post._count.reposts}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
