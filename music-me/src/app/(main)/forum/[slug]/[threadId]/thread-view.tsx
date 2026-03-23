"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Pin,
  Lock,
  Eye,
  MessageSquare,
  Loader2,
  Play,
  Pause,
  Volume2,
  SmilePlus,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ForumEditor } from "@/components/forum/forum-editor";
import { ForumContent } from "@/components/forum/forum-content";

const EMOJI_PICKER = ["👍", "👎", "❤️", "😂", "🔥", "🎵", "🎸", "🤘", "👏", "💯", "😮", "😢"];

interface ReactionData {
  emoji: string;
  userId: string;
}

interface Author {
  id: string;
  username: string;
  displayName: string | null;
  isVerified?: boolean;
  bio?: string | null;
  createdAt?: string;
  profile: { profilePictureUrl: string | null } | null;
  _count?: { posts?: number; forumThreads?: number; forumReplies?: number };
}

interface Reply {
  id: string;
  content: string;
  mediaUrls?: string[];
  audioUrl: string | null;
  createdAt: string;
  editedAt: string | null;
  author: Author;
  reactions?: ReactionData[];
}

interface Thread {
  id: string;
  title: string;
  content: string;
  mediaUrls?: string[];
  audioUrl: string | null;
  audioTitle: string | null;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  author: Author;
  category: { name: string; slug: string; icon: string | null; color: string | null };
  replies: Reply[];
  reactions?: ReactionData[];
  _count: { replies: number };
}

function AudioPlayer({
  src,
  title,
}: {
  src: string;
  title?: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() =>
          setProgress(audioRef.current?.currentTime ?? 0)
        }
        onLoadedMetadata={() =>
          setDuration(audioRef.current?.duration ?? 0)
        }
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-400 transition-colors flex-shrink-0"
      >
        {playing ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-xs font-medium truncate">{title}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <div
            className="flex-1 h-1.5 rounded-full bg-muted/50 cursor-pointer overflow-hidden"
            onClick={(e) => {
              if (!audioRef.current || !duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = pct * duration;
            }}
          >
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{
                width: duration ? `${(progress / duration) * 100}%` : "0%",
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTime(progress)} / {formatTime(duration)}
          </span>
        </div>
      </div>
      <Volume2 className="w-4 h-4 text-green-400 flex-shrink-0" />
    </div>
  );
}

// --- Reaction Bar (Discord-style) ---

function ReactionBar({
  reactions,
  currentUserId,
  threadId,
  replyId,
  onReact,
}: {
  reactions: ReactionData[];
  currentUserId: string | null;
  threadId?: string;
  replyId?: string;
  onReact: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [reacting, setReacting] = useState<string | null>(null);

  // Group reactions by emoji
  const grouped = new Map<string, { count: number; userReacted: boolean }>();
  for (const r of reactions) {
    const existing = grouped.get(r.emoji);
    if (existing) {
      existing.count++;
      if (r.userId === currentUserId) existing.userReacted = true;
    } else {
      grouped.set(r.emoji, {
        count: 1,
        userReacted: r.userId === currentUserId,
      });
    }
  }

  const handleReact = async (emoji: string) => {
    if (!currentUserId || reacting) return;
    setReacting(emoji);
    try {
      await fetch("/api/forum/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          emoji,
          ...(threadId ? { threadId } : { replyId }),
        }),
      });
      onReact();
    } catch {
      // ignore
    } finally {
      setReacting(null);
      setShowPicker(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-3">
      {/* Existing reactions */}
      {Array.from(grouped.entries()).map(([emoji, { count, userReacted }]) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          disabled={!currentUserId || reacting === emoji}
          className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
            transition-all duration-150 select-none
            ${
              userReacted
                ? "bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30"
                : "bg-muted/40 border border-border/50 text-muted-foreground hover:bg-muted/60 hover:border-border"
            }
          `}
        >
          <span className="text-sm leading-none">{emoji}</span>
          <span>{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      {currentUserId && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className={`
              inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs
              transition-all duration-150
              ${
                showPicker
                  ? "bg-muted/60 border border-border text-foreground"
                  : "bg-transparent border border-dashed border-border/40 text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/30"
              }
            `}
          >
            <SmilePlus className="w-3.5 h-3.5" />
          </button>

          {/* Emoji picker dropdown */}
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-1.5 p-1.5 rounded-lg border border-border bg-background shadow-xl z-50 flex gap-0.5 flex-wrap w-[200px]">
              {EMOJI_PICKER.map((emoji) => {
                const already = grouped.get(emoji);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`
                      w-8 h-8 rounded-md flex items-center justify-center text-base
                      transition-colors hover:bg-muted
                      ${already?.userReacted ? "bg-primary/20" : ""}
                    `}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Forum Post Block ---

function ForumPostBlock({
  author,
  content,
  mediaUrls,
  audioUrl,
  audioTitle,
  createdAt,
  editedAt,
  isOP,
  reactions,
  currentUserId,
  threadId,
  replyId,
  onReact,
}: {
  author: Author;
  content: string;
  mediaUrls?: string[];
  audioUrl?: string | null;
  audioTitle?: string | null;
  createdAt: string;
  editedAt?: string | null;
  isOP?: boolean;
  reactions?: ReactionData[];
  currentUserId: string | null;
  threadId?: string;
  replyId?: string;
  onReact: () => void;
}) {
  const name = author.displayName ?? author.username;
  return (
    <div className="flex gap-0 border-b border-border/30">
      {/* Author sidebar (XenForo-style) */}
      <div className="hidden sm:flex flex-col items-center w-36 px-3 py-4 border-r border-border/20 bg-muted/10 flex-shrink-0">
        <Link href={`/${author.username}`}>
          <Avatar
            src={author.profile?.profilePictureUrl}
            alt={name}
            size="lg"
          />
        </Link>
        <Link
          href={`/${author.username}`}
          className="mt-2 text-sm font-medium text-center hover:text-primary transition-colors"
        >
          {name}
        </Link>
        <span className="text-xs text-muted-foreground">@{author.username}</span>
        {author._count && (
          <div className="mt-2 text-xs text-muted-foreground text-center space-y-0.5">
            {author._count.forumThreads !== undefined && (
              <p>Threads: {author._count.forumThreads}</p>
            )}
            {author._count.forumReplies !== undefined && (
              <p>Replies: {author._count.forumReplies}</p>
            )}
            {author._count.posts !== undefined && (
              <p>Posts: {author._count.posts}</p>
            )}
          </div>
        )}
        {author.createdAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Joined {format(new Date(author.createdAt), "MMM yyyy")}
          </p>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0 p-4">
        {/* Mobile author header */}
        <div className="flex items-center gap-2 sm:hidden mb-3">
          <Avatar
            src={author.profile?.profilePictureUrl}
            alt={name}
            size="sm"
          />
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Post meta (desktop) */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span>
            {format(new Date(createdAt), "MMM d, yyyy 'at' h:mm a")}
          </span>
          {editedAt && <span>(edited)</span>}
          {isOP && (
            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium">
              OP
            </span>
          )}
        </div>

        {/* Rendered content with BBCode formatting */}
        <ForumContent content={content} mediaUrls={mediaUrls} />

        {/* Audio player */}
        {audioUrl && (
          <div className="mt-4">
            <AudioPlayer src={audioUrl} title={audioTitle} />
          </div>
        )}

        {/* Reactions */}
        <ReactionBar
          reactions={reactions ?? []}
          currentUserId={currentUserId}
          threadId={threadId}
          replyId={replyId}
          onReact={onReact}
        />
      </div>
    </div>
  );
}

export function ThreadView({
  thread,
  categorySlug,
  currentUserId,
}: {
  thread: Thread;
  categorySlug: string;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [replyContent, setReplyContent] = useState("");
  const [replyMediaUrls, setReplyMediaUrls] = useState<string[]>([]);
  const [replyAudioUrl, setReplyAudioUrl] = useState("");
  const [replyAudioTitle, setReplyAudioTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forum/threads/${thread.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent.trim(),
          mediaUrls: replyMediaUrls.length > 0 ? replyMediaUrls : undefined,
          audioUrl: replyAudioUrl.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      setReplyContent("");
      setReplyMediaUrls([]);
      setReplyAudioUrl("");
      setReplyAudioTitle("");
      router.refresh();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const refreshReactions = () => router.refresh();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/forum" className="hover:text-foreground transition-colors">
            Forum
          </Link>
          <span>/</span>
          <Link
            href={`/forum/${categorySlug}`}
            className="hover:text-foreground transition-colors"
          >
            {thread.category.icon} {thread.category.name}
          </Link>
        </div>
        <div className="flex items-start gap-2">
          <Link
            href={`/forum/${categorySlug}`}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors mt-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-[family-name:var(--font-space-grotesk)] flex items-center gap-2">
              {thread.isPinned && <Pin className="w-4 h-4 text-primary" />}
              {thread.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
              {thread.title}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {thread._count.replies} replies
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {thread.viewCount} views
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* OP post */}
      <ForumPostBlock
        author={thread.author}
        content={thread.content}
        mediaUrls={thread.mediaUrls}
        audioUrl={thread.audioUrl}
        audioTitle={thread.audioTitle}
        createdAt={thread.createdAt}
        isOP
        reactions={thread.reactions}
        currentUserId={currentUserId}
        threadId={thread.id}
        onReact={refreshReactions}
      />

      {/* Replies */}
      {thread.replies.map((reply) => (
        <ForumPostBlock
          key={reply.id}
          author={reply.author}
          content={reply.content}
          mediaUrls={reply.mediaUrls}
          audioUrl={reply.audioUrl}
          createdAt={reply.createdAt}
          editedAt={reply.editedAt}
          reactions={reply.reactions}
          currentUserId={currentUserId}
          replyId={reply.id}
          onReact={refreshReactions}
        />
      ))}

      {/* Reply composer */}
      {!thread.isLocked && (
        <div className="p-4 border-t border-border/50">
          <h3 className="text-sm font-semibold mb-3">Reply to this thread</h3>
          <ForumEditor
            value={replyContent}
            onChange={setReplyContent}
            placeholder="Write your reply... Use formatting tools above or type BBCode."
            rows={4}
            mediaUrls={replyMediaUrls}
            onMediaUrlsChange={setReplyMediaUrls}
            audioUrl={replyAudioUrl}
            onAudioUrlChange={setReplyAudioUrl}
            audioTitle={replyAudioTitle}
            onAudioTitleChange={setReplyAudioTitle}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleReply}
              disabled={!replyContent.trim() || submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Post Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
