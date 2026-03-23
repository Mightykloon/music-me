"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PostCard, type PostCardData } from "@/components/feed/post-card";
import { Avatar } from "@/components/ui/avatar";
import { EmbedPlayer } from "@/components/music/embed-player";
import type { TrackInfo } from "@/types";

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    isVerified: boolean;
    profile: { profilePictureUrl: string | null } | null;
  };
  attachedTrack: TrackInfo | null;
  _count: { replies: number; reactions: number };
}

interface PostDetailClientProps {
  post: PostCardData;
  initialComments: CommentData[];
  currentUserId: string | null;
}

export function PostDetailClient({
  post,
  initialComments,
  currentUserId,
}: PostDetailClientProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [replies, setReplies] = useState<Record<string, CommentData[]>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const handleComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim(), parentId }),
      });
      if (!res.ok) throw new Error("Failed");
      const reply = await res.json();
      setReplies((prev) => ({
        ...prev,
        [parentId]: [...(prev[parentId] ?? []), reply],
      }));
      setReplyContent("");
      setReplyingTo(null);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const loadReplies = async (commentId: string) => {
    if (loadingReplies[commentId]) return;
    setLoadingReplies((p) => ({ ...p, [commentId]: true }));

    try {
      const res = await fetch(
        `/api/posts/${post.id}/comments?parentId=${commentId}&limit=20`
      );
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setReplies((prev) => ({ ...prev, [commentId]: data.items }));
    } catch {
      // ignore
    } finally {
      setLoadingReplies((p) => ({ ...p, [commentId]: false }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">Post</h1>
      </div>

      {/* Post */}
      <PostCard post={post} />

      {/* Comment composer */}
      {currentUserId && (
        <div className="border-t border-border/50 p-4 flex items-start gap-3">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              maxLength={2000}
              className="w-full bg-transparent resize-none text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button
            onClick={handleComment}
            disabled={!newComment.trim() || submitting}
            className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Comments */}
      <div className="border-t border-border/50">
        <p className="px-4 py-3 text-sm font-medium text-muted-foreground">
          {post._count.comments} comment{post._count.comments !== 1 ? "s" : ""}
        </p>

        {comments.map((comment) => (
          <div key={comment.id} className="px-4 py-3 border-t border-border/30">
            <CommentItem
              comment={comment}
              onReply={() => {
                setReplyingTo(comment.id);
                setReplyContent("");
              }}
            />

            {/* Replies */}
            {comment._count.replies > 0 && !replies[comment.id] && (
              <button
                onClick={() => loadReplies(comment.id)}
                className="ml-10 mt-2 text-xs text-primary hover:underline"
              >
                {loadingReplies[comment.id] ? (
                  <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                ) : null}
                View {comment._count.replies} repl{comment._count.replies === 1 ? "y" : "ies"}
              </button>
            )}

            {replies[comment.id]?.map((reply) => (
              <div key={reply.id} className="ml-10 mt-2">
                <CommentItem comment={reply} onReply={() => {
                  setReplyingTo(comment.id);
                  setReplyContent("");
                }} />
              </div>
            ))}

            {/* Reply input */}
            {replyingTo === comment.id && currentUserId && (
              <div className="ml-10 mt-2 flex items-center gap-2">
                <input
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  maxLength={2000}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReply(comment.id);
                    }
                    if (e.key === "Escape") setReplyingTo(null);
                  }}
                  className="flex-1 bg-muted/30 rounded-lg px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyContent.trim() || submitting}
                  className="p-1.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: CommentData;
  onReply: () => void;
}) {
  return (
    <div className="flex gap-2.5">
      <Link href={`/${comment.author.username}`}>
        <Avatar
          src={comment.author.profile?.profilePictureUrl}
          alt={comment.author.displayName ?? comment.author.username}
          size="sm"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/${comment.author.username}`}
            className="font-medium text-xs hover:underline"
          >
            {comment.author.displayName ?? comment.author.username}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
          {comment.editedAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        {comment.attachedTrack && (
          <div className="mt-1.5">
            <EmbedPlayer track={comment.attachedTrack} compact />
          </div>
        )}
        <button
          onClick={onReply}
          className="text-xs text-muted-foreground hover:text-foreground mt-1"
        >
          Reply
        </button>
      </div>
    </div>
  );
}
