"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Heart, Repeat2, Music, Film, LayoutList } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/avatar";

interface PostGridItem {
  id: string;
  type: string;
  content: string | null;
  mediaUrls: string[];
  videoUrl: string | null;
  thumbnailUrl: string | null;
  attachedTrack: { title: string; artist: string; albumArtUrl: string | null } | null;
  createdAt: string;
  author: { username: string; displayName: string | null; profile: { profilePictureUrl: string | null } | null };
  _count: { comments: number; reactions: number; reposts: number };
}

interface PostGridProps {
  posts: PostGridItem[];
  className?: string;
}

export function PostGrid({ posts, className }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className={`text-center py-16 ${className ?? ""}`}>
        <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
          <Music className="w-5 h-5 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">No posts yet</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <LayoutList className="w-4 h-4 text-[var(--profile-primary)]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Posts</h2>
        <span className="text-xs text-muted-foreground/60 ml-auto">{posts.length}</span>
      </div>
      <div className="flex flex-col gap-3">
        {posts.map((post) => (
          <Link href={`/post/${post.id}`} key={post.id} className="block p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--profile-primary)]/20 transition-all duration-300">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Avatar src={post.author.profile?.profilePictureUrl} alt={post.author.displayName ?? post.author.username} size="sm" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{post.author.displayName ?? post.author.username}</span>
                <span className="text-xs text-muted-foreground ml-2">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
            {post.content && <p className="text-sm mb-3 whitespace-pre-wrap break-words line-clamp-4 text-foreground/90">{post.content}</p>}
            {post.mediaUrls.length > 0 && (
              <div className={`grid gap-1.5 rounded-lg overflow-hidden mb-3 ${post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {post.mediaUrls.slice(0, 4).map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden"><Image src={url} alt="" fill className="object-cover" /></div>
                ))}
              </div>
            )}
            {post.videoUrl && <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-black/20"><Film className="absolute top-2 right-2 w-4 h-4 text-white/60" /></div>}
            {post.attachedTrack && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04] mb-3">
                {post.attachedTrack.albumArtUrl && <Image src={post.attachedTrack.albumArtUrl} alt="" width={40} height={40} className="rounded-md" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{post.attachedTrack.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{post.attachedTrack.artist}</p>
                </div>
                <Music className="w-4 h-4 text-[var(--profile-primary)]/60 flex-shrink-0" />
              </div>
            )}
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" />{post._count.reactions}</span>
              <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" />{post._count.comments}</span>
              <span className="flex items-center gap-1.5"><Repeat2 className="w-3.5 h-3.5" />{post._count.reposts}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
