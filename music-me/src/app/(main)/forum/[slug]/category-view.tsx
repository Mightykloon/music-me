"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Plus,
  Pin,
  Lock,
  MessageSquare,
  Eye,
  Loader2,
  Music,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface ThreadItem {
  id: string;
  title: string;
  content: string;
  audioUrl: string | null;
  audioTitle: string | null;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  lastReplyAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    profile: { profilePictureUrl: string | null } | null;
  };
  _count: { replies: number };
}

interface CategoryViewProps {
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
    description: string | null;
    isLocked: boolean;
    parent: { name: string; slug: string } | null;
  };
  threads: ThreadItem[];
}

export function CategoryView({ category, threads }: CategoryViewProps) {
  const router = useRouter();
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: category.id,
          title: title.trim(),
          content: content.trim(),
          audioUrl: audioUrl.trim() || null,
          audioTitle: audioTitle.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      setTitle("");
      setContent("");
      setAudioUrl("");
      setAudioTitle("");
      setShowComposer(false);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/forum" className="hover:text-foreground transition-colors">
            Forum
          </Link>
          {category.parent && (
            <>
              <span>/</span>
              <Link
                href={`/forum/${category.parent.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {category.parent.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{category.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/forum"
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-xl">{category.icon}</span>
            <h1 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
              {category.name}
            </h1>
          </div>
          {!category.isLocked && (
            <button
              onClick={() => setShowComposer(!showComposer)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Thread
            </button>
          )}
        </div>
        {category.description && (
          <p className="text-sm text-muted-foreground mt-2 ml-10">
            {category.description}
          </p>
        )}
      </div>

      {/* New thread composer */}
      {showComposer && (
        <div className="border-b border-border/50 p-4 bg-muted/10">
          <div className="space-y-3 max-w-2xl">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thread title..."
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post..."
              rows={4}
              maxLength={10000}
              className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
            {/* Audio attachment (for indie submissions) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAudioUrl(audioUrl ? "" : " ")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  audioUrl
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                Attach Audio
              </button>
              {audioUrl && audioUrl !== " " && (
                <button
                  onClick={() => {
                    setAudioUrl("");
                    setAudioTitle("");
                  }}
                  className="p-1 rounded hover:bg-muted"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {audioUrl && (
              <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-muted/20">
                <input
                  value={audioTitle}
                  onChange={(e) => setAudioTitle(e.target.value)}
                  placeholder="Track title (e.g. My Song - Artist Name)"
                  className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <input
                  value={audioUrl === " " ? "" : audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="Audio URL (paste a direct link to mp3/wav/ogg)"
                  className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowComposer(false)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim() || submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Post Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thread list */}
      {threads.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p className="text-muted-foreground text-sm">
            No threads yet. Start the conversation!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/forum/${category.slug}/${thread.id}`}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors group"
            >
              <Avatar
                src={thread.author.profile?.profilePictureUrl}
                alt={thread.author.displayName ?? thread.author.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {thread.isPinned && (
                    <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                  {thread.isLocked && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                    {thread.title}
                  </h3>
                  {thread.audioUrl && (
                    <Music className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {thread.content}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>
                    by{" "}
                    <span className="text-foreground/80">
                      {thread.author.displayName ?? thread.author.username}
                    </span>
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(thread.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground flex-shrink-0">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {thread._count.replies}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {thread.viewCount}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
