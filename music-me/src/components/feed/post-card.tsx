"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Repeat2,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Music,
  BarChart3,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { EmbedPlayer } from "@/components/music/embed-player";
import type { TrackInfo } from "@/types";

export interface PostCardData {
  id: string;
  type: string;
  content: string | null;
  mediaUrls: string[];
  videoUrl: string | null;
  thumbnailUrl: string | null;
  lyricCardData: Record<string, unknown> | null;
  attachedTrack: TrackInfo | null;
  attachedPlaylist: {
    id: string;
    name: string;
    coverImageUrl: string | null;
    trackCount: number;
    provider: string;
  } | null;
  poll: {
    id: string;
    question: string;
    expiresAt: string;
    allowMultiple: boolean;
    options: {
      id: string;
      text: string;
      attachedTrack: TrackInfo | null;
      _count: { votes: number };
    }[];
    _count: { options: number };
  } | null;
  visibility: string;
  repostOf: PostCardData | null;
  createdAt: string;
  editedAt: string | null;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    isVerified: boolean;
    profile: { profilePictureUrl: string | null } | null;
  };
  _count: {
    comments: number;
    reactions: number;
    reposts: number;
  };
  userReactions?: string[];
}


interface PostCardProps {
  post: PostCardData;
  compact?: boolean;
  className?: string;
}

export function PostCard({ post, compact = false, className }: PostCardProps) {
  const [liked, setLiked] = useState(
    (post.userReactions ?? []).includes("HEART")
  );
  const [likeCount, setLikeCount] = useState(post._count.reactions);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));

    fetch(`/api/posts/${post.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "HEART" }),
    }).catch(() => {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount(post._count.reactions);
    });
  };

  // Repost wrapper
  if (post.type === "REPOST" && post.repostOf) {
    return (
      <div className={`${className ?? ""}`}>
        <div className="flex items-center gap-2 px-4 pt-3 text-xs text-muted-foreground">
          <Repeat2 className="w-3.5 h-3.5" />
          <Link href={`/${post.author.username}`} className="hover:underline font-medium">
            {post.author.displayName ?? post.author.username}
          </Link>
          <span>reposted</span>
        </div>
        <PostCard post={post.repostOf} />
      </div>
    );
  }

  return (
    <article
      className={`p-4 ${compact ? "" : "border-b border-border/50"} hover:bg-muted/20 transition-colors ${className ?? ""}`}
    >
      {/* Author row */}
      <div className="flex items-start gap-3">
        <Link href={`/${post.author.username}`}>
          <Avatar
            src={post.author.profile?.profilePictureUrl}
            alt={post.author.displayName ?? post.author.username}
            size="md"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/${post.author.username}`}
              className="font-semibold text-sm hover:underline truncate"
            >
              {post.author.displayName ?? post.author.username}
            </Link>
            <span className="text-xs text-muted-foreground">
              @{post.author.username}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
            {post.editedAt && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
            <button className="ml-auto p-1 rounded hover:bg-muted">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          {post.content && (
            <div className="mt-1 text-sm whitespace-pre-wrap break-words leading-relaxed">
              <FormattedContent text={post.content} />
            </div>
          )}

          {/* Media grid */}
          {post.mediaUrls.length > 0 && (
            <div
              className={`mt-3 grid gap-0.5 rounded-xl overflow-hidden ${
                post.mediaUrls.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-2"
              }`}
            >
              {post.mediaUrls.slice(0, 4).map((url, i) => (
                <div
                  key={i}
                  className={`relative ${
                    post.mediaUrls.length === 1
                      ? "aspect-[16/9]"
                      : post.mediaUrls.length === 3 && i === 0
                        ? "row-span-2 aspect-square"
                        : "aspect-square"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  {post.mediaUrls.length > 4 && i === 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                      +{post.mediaUrls.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Video */}
          {post.videoUrl && (
            <div className="mt-3 rounded-xl overflow-hidden bg-black">
              <video
                src={post.videoUrl}
                controls
                preload="metadata"
                poster={post.thumbnailUrl ?? undefined}
                className="w-full max-h-[400px]"
              />
            </div>
          )}

          {/* Lyric card */}
          {post.type === "LYRIC_CARD" && post.lyricCardData && (
            <div className="mt-3">
              <LyricCard data={post.lyricCardData} />
            </div>
          )}

          {/* Attached track */}
          {post.attachedTrack && (
            <div className="mt-3">
              <EmbedPlayer track={post.attachedTrack} compact />
            </div>
          )}

          {/* Playlist drop */}
          {post.type === "PLAYLIST_DROP" && post.attachedPlaylist && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
              {post.attachedPlaylist.coverImageUrl ? (
                <Image
                  src={post.attachedPlaylist.coverImageUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Music className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {post.attachedPlaylist.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {post.attachedPlaylist.trackCount} tracks ·{" "}
                  {post.attachedPlaylist.provider.toLowerCase().replace("_", " ")}
                </p>
              </div>
            </div>
          )}

          {/* Poll */}
          {post.poll && (
            <div className="mt-3">
              <PollDisplay poll={post.poll} postId={post.id} />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-1 -ml-2">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-xs ${
                liked
                  ? "text-red-500 hover:text-red-400"
                  : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-colors text-xs"
            >
              <MessageCircle className="w-4 h-4" />
              {post._count.comments > 0 && <span>{post._count.comments}</span>}
            </Link>

            <button className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-colors text-xs">
              <Repeat2 className="w-4 h-4" />
              {post._count.reposts > 0 && <span>{post._count.reposts}</span>}
            </button>

            <button className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors text-xs ml-auto">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FormattedContent({ text }: { text: string }) {
  // Simple @mention and #hashtag highlighting
  const parts = text.split(/(@\w+|#\w+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          return (
            <Link
              key={i}
              href={`/${part.slice(1)}`}
              className="text-primary hover:underline"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith("#")) {
          return (
            <Link
              key={i}
              href={`/search?q=${encodeURIComponent(part)}`}
              className="text-primary hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function LyricCard({ data }: { data: Record<string, unknown> }) {
  const lines = (data.lines as string[]) ?? [];
  const trackTitle = data.trackTitle as string;
  const trackArtist = data.trackArtist as string;
  const albumArtUrl = data.albumArtUrl as string;
  const template = (data.template as string) ?? "gradient";

  const bgStyle =
    template === "album_blur" && albumArtUrl
      ? { backgroundImage: `url(${albumArtUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
      : {};

  return (
    <div
      className="relative rounded-xl overflow-hidden p-6 min-h-[160px] flex flex-col items-center justify-center text-center"
      style={bgStyle}
    >
      {template === "album_blur" && (
        <div className="absolute inset-0 backdrop-blur-2xl bg-black/60" />
      )}
      {template === "gradient" && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-secondary/60 to-accent/40" />
      )}
      {template === "minimal" && (
        <div className="absolute inset-0 bg-muted" />
      )}
      {template === "neon" && (
        <div className="absolute inset-0 bg-black" />
      )}

      <div className="relative z-10 space-y-2">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`text-lg font-medium italic leading-relaxed ${
              template === "neon" ? "text-effect-glow" : "text-white"
            }`}
          >
            &ldquo;{line}&rdquo;
          </p>
        ))}
        {trackTitle && (
          <p className="text-xs text-white/60 mt-3 flex items-center justify-center gap-1">
            <Music className="w-3 h-3" />
            {trackTitle} — {trackArtist}
          </p>
        )}
      </div>
    </div>
  );
}

function PollDisplay({
  poll,
  postId,
}: {
  poll: PostCardData["poll"];
  postId: string;
}) {
  const [voted, setVoted] = useState(false);

  if (!poll) return null;

  const totalVotes = poll.options.reduce((sum, o) => sum + o._count.votes, 0);
  const expired = new Date(poll.expiresAt) < new Date();

  const handleVote = async (optionId: string) => {
    if (voted || expired) return;
    setVoted(true);
    await fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
  };

  return (
    <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/30">
      <p className="font-medium text-sm">{poll.question}</p>
      {poll.options.map((option) => {
        const pct = totalVotes > 0 ? (option._count.votes / totalVotes) * 100 : 0;
        return (
          <button
            key={option.id}
            onClick={() => handleVote(option.id)}
            disabled={voted || expired}
            className="w-full relative overflow-hidden rounded-lg border border-border p-2.5 text-left text-sm hover:border-primary/50 transition-colors"
          >
            {(voted || expired) && (
              <div
                className="absolute inset-0 bg-primary/10 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                {option.attachedTrack?.albumArtUrl && (
                  <Image
                    src={option.attachedTrack.albumArtUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="rounded"
                  />
                )}
                <span>{option.text}</span>
              </div>
              {(voted || expired) && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(pct)}%
                </span>
              )}
            </div>
          </button>
        );
      })}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BarChart3 className="w-3 h-3" />
        <span>{totalVotes} votes</span>
        {expired ? (
          <span>· Final results</span>
        ) : (
          <span>
            · Ends{" "}
            {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}
