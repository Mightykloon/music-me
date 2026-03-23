"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Image as ImageIcon,
  Video,
  Music,
  BarChart3,
  Quote,
  ListMusic,
  X,
  Loader2,
  Send,
  Globe,
  Lock,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { TrackSearchInput } from "@/components/music/track-search-input";
import type { MusicTrackResult } from "@/lib/music/types";

interface PostComposerProps {
  user: {
    username: string;
    displayName: string | null;
    profile?: { profilePictureUrl: string | null } | null;
  };
  onPost?: (post: unknown) => void;
}

type PostMode = "text" | "image" | "video" | "music" | "poll" | "lyric_card" | "playlist_drop";
type Visibility = "PUBLIC" | "FOLLOWERS" | "PRIVATE";

const VISIBILITY_OPTIONS: { value: Visibility; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { value: "PUBLIC", icon: Globe, label: "Everyone" },
  { value: "FOLLOWERS", icon: Users, label: "Followers" },
  { value: "PRIVATE", icon: Lock, label: "Only me" },
];

export function PostComposer({ user, onPost }: PostComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<PostMode>("text");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [attachedTrack, setAttachedTrack] = useState<MusicTrackResult | null>(null);
  const [showTrackSearch, setShowTrackSearch] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollHours, setPollHours] = useState(24);
  const [lyricLines, setLyricLines] = useState([""]);
  const [lyricTemplate, setLyricTemplate] = useState("gradient");
  const [submitting, setSubmitting] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    !submitting &&
    (content.trim().length > 0 ||
      mediaUrls.length > 0 ||
      videoUrl ||
      attachedTrack ||
      (mode === "poll" && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2) ||
      (mode === "lyric_card" && lyricLines.some((l) => l.trim())));

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    for (const file of files.slice(0, 4 - mediaUrls.length)) {
      // Convert to base64 data URL for storage (works without S3)
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setMediaPreviews((prev) => [...prev, dataUrl].slice(0, 4));
        setMediaUrls((prev) => [...prev, dataUrl].slice(0, 4));
      };
      reader.readAsDataURL(file);
    }
    setMode("image");
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          category: "post",
        }),
      });
      if (!res.ok) return;
      const { uploadUrl, publicUrl } = await res.json();
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setVideoUrl(publicUrl);
      setMode("video");
    } catch {
      // ignore
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      let type: string = "TEXT";
      const payload: Record<string, unknown> = {
        content: content.trim() || null,
        visibility,
      };

      if (mode === "image" && mediaUrls.length > 0) {
        type = "IMAGE";
        payload.mediaUrls = mediaUrls;
      } else if (mode === "video" && videoUrl) {
        type = "VIDEO";
        payload.videoUrl = videoUrl;
      } else if (mode === "poll") {
        type = "POLL";
        payload.poll = {
          question: pollQuestion.trim(),
          options: pollOptions
            .filter((o) => o.trim())
            .map((text) => ({ text: text.trim() })),
          expiresInHours: pollHours,
        };
      } else if (mode === "lyric_card") {
        type = "LYRIC_CARD";
        payload.lyricCardData = {
          lines: lyricLines.filter((l) => l.trim()),
          template: lyricTemplate,
          trackTitle: attachedTrack?.title ?? null,
          trackArtist: attachedTrack?.artist ?? null,
          albumArtUrl: attachedTrack?.albumArtUrl ?? null,
        };
      } else if (mode === "playlist_drop") {
        type = "PLAYLIST_DROP";
      }

      if (attachedTrack) {
        payload.track = {
          provider: attachedTrack.provider,
          providerTrackId: attachedTrack.providerTrackId,
          title: attachedTrack.title,
          artist: attachedTrack.artist,
          album: attachedTrack.album,
          albumArtUrl: attachedTrack.albumArtUrl,
          previewUrl: attachedTrack.previewUrl,
          duration: attachedTrack.duration,
          isrc: attachedTrack.isrc,
          externalUrl: attachedTrack.externalUrl,
        };
      }

      payload.type = type;

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create post");
      const post = await res.json();

      // Reset
      setContent("");
      setMode("text");
      setMediaUrls([]);
      setMediaPreviews([]);
      setVideoUrl(null);
      setAttachedTrack(null);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setLyricLines([""]);

      onPost?.(post);
      router.refresh();
    } catch {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  const VisIcon = VISIBILITY_OPTIONS.find((v) => v.value === visibility)!.icon;

  return (
    <div className="border-b border-border/50 p-4">
      <div className="flex gap-3">
        <Avatar
          src={user.profile?.profilePictureUrl}
          alt={user.displayName ?? user.username}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What are you listening to?"
            rows={2}
            maxLength={5000}
            className="w-full bg-transparent resize-none text-sm placeholder:text-muted-foreground focus:outline-none leading-relaxed"
          />

          {/* Media previews */}
          {mediaPreviews.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
              {mediaPreviews.map((url, i) => (
                <div key={i} className="relative aspect-square">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    onClick={() => {
                      setMediaPreviews((p) => p.filter((_, j) => j !== i));
                      setMediaUrls((p) => p.filter((_, j) => j !== i));
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Attached track */}
          {attachedTrack && (
            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
              {attachedTrack.albumArtUrl && (
                <Image
                  src={attachedTrack.albumArtUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{attachedTrack.title}</p>
                <p className="text-xs text-muted-foreground truncate">{attachedTrack.artist}</p>
              </div>
              <button
                onClick={() => {
                  setAttachedTrack(null);
                  setShowTrackSearch(false);
                }}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Track search */}
          {showTrackSearch && !attachedTrack && (
            <div className="mt-2">
              <TrackSearchInput
                onSelect={(track) => {
                  setAttachedTrack(track);
                  setShowTrackSearch(false);
                }}
              />
            </div>
          )}

          {/* Poll builder */}
          {mode === "poll" && (
            <div className="mt-2 space-y-2 p-3 rounded-xl border border-border bg-muted/20">
              <input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question..."
                maxLength={300}
                className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground focus:outline-none"
              />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${i + 1}`}
                    maxLength={100}
                    className="flex-1 bg-transparent text-sm border-b border-border/50 py-1 placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => setPollOptions((p) => p.filter((_, j) => j !== i))}
                      className="p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button
                  onClick={() => setPollOptions((p) => [...p, ""])}
                  className="text-xs text-primary hover:underline"
                >
                  + Add option
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Expires in:</span>
                <select
                  value={pollHours}
                  onChange={(e) => setPollHours(Number(e.target.value))}
                  className="bg-transparent border border-border rounded px-1.5 py-0.5 text-xs"
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                </select>
              </div>
            </div>
          )}

          {/* Lyric card builder */}
          {mode === "lyric_card" && (
            <div className="mt-2 space-y-2 p-3 rounded-xl border border-border bg-muted/20">
              {lyricLines.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={line}
                    onChange={(e) => {
                      const next = [...lyricLines];
                      next[i] = e.target.value;
                      setLyricLines(next);
                    }}
                    placeholder={`Lyric line ${i + 1}`}
                    className="flex-1 bg-transparent text-sm italic border-b border-border/50 py-1 placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  {lyricLines.length > 1 && (
                    <button
                      onClick={() => setLyricLines((l) => l.filter((_, j) => j !== i))}
                      className="p-0.5 text-muted-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {lyricLines.length < 6 && (
                <button
                  onClick={() => setLyricLines((l) => [...l, ""])}
                  className="text-xs text-primary hover:underline"
                >
                  + Add line
                </button>
              )}
              <div className="flex gap-2">
                {["gradient", "album_blur", "minimal", "neon"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setLyricTemplate(t)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      lyricTemplate === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions bar */}
          <div className="mt-3 flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoSelect}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Add image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Add video"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTrackSearch(!showTrackSearch)}
              className={`p-2 rounded-lg hover:bg-muted transition-colors ${
                showTrackSearch || attachedTrack
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Attach track"
            >
              <Music className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode(mode === "poll" ? "text" : "poll")}
              className={`p-2 rounded-lg hover:bg-muted transition-colors ${
                mode === "poll"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Create poll"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode(mode === "lyric_card" ? "text" : "lyric_card")}
              className={`p-2 rounded-lg hover:bg-muted transition-colors ${
                mode === "lyric_card"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Lyric card"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode(mode === "playlist_drop" ? "text" : "playlist_drop")}
              className={`p-2 rounded-lg hover:bg-muted transition-colors ${
                mode === "playlist_drop"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Playlist drop"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            <div className="ml-auto flex items-center gap-2">
              {/* Visibility */}
              <div className="relative">
                <button
                  onClick={() => setShowVisibility(!showVisibility)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <VisIcon className="w-4 h-4" />
                </button>
                {showVisibility && (
                  <div className="absolute bottom-full right-0 mb-1 p-1 bg-background border border-border rounded-lg shadow-lg z-10">
                    {VISIBILITY_OPTIONS.map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setVisibility(value);
                          setShowVisibility(false);
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded hover:bg-muted ${
                          visibility === value ? "text-primary" : ""
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
