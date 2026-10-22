"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/utils";
import {
  MapPin,
  LinkIcon,
  BadgeCheck,
  UserPlus,
  UserCheck,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { FollowListModal } from "@/components/profile/follow-list-modal";
import { SocialLinks } from "@/components/profile/social-links";
import { RankBadge } from "@/components/rank-badge";
import { readCustomization } from "@/lib/profile/customization";

// effects renamed when they were redone; older profiles keep a close match
const EFFECT_ALIASES: Record<string, string> = {
  "animated-gradient": "gradient",
  flicker: "neon",
  pulse: "glow",
  "shadow-pop": "retro",
};

/** letters as the reader sees them (keeps emoji and accents in one piece) */
function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].map((s) => s.segment);
  }
  return [...text];
}

interface ProfileHeaderProps {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    pronouns: string | null;
    location: string | null;
    website: string | null;
    isVerified: boolean;
    forumRank?: string | null;
    forumRankColor?: string | null;
    isFollowedByViewer?: boolean;
    profile: {
      profilePictureUrl: string | null;
      textEffects: Record<string, unknown> | null;
      bioFontSize: string | null;
      customization?: unknown;
    } | null;
    links?: {
      id: string;
      title: string;
      url: string;
      iconType: string | null;
      clickCount: number;
    }[];
    _count: {
      followers: number;
      following: number;
      posts: number;
    };
  };
  isOwn: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  className?: string;
}

export function ProfileHeader({
  user,
  isOwn,
  isFollowing,
  onFollow,
  className,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [sendingMessage, setSendingMessage] = useState(false);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  // Follow state lives here unless a parent manages it
  const [following, setFollowing] = useState(!!user.isFollowedByViewer);
  const [followers, setFollowers] = useState(user._count.followers);
  const [followBusy, setFollowBusy] = useState(false);
  const isFollowingNow = isFollowing ?? following;
  const toggleFollow = async () => {
    if (onFollow) return onFollow();
    setFollowBusy(true);
    try {
      const res = await fetch(`/api/users/${user.username}/follow`, { method: "POST" });
      if (res.status === 401) return router.push("/login");
      if (!res.ok) return;
      const data = await res.json();
      const now = data.action === "followed";
      setFollowing(now);
      setFollowers((n) => n + (now ? 1 : -1));
    } finally {
      setFollowBusy(false);
    }
  };
  const te = (user.profile?.textEffects as { type?: string; color?: string; color2?: string; color3?: string; speed?: number; brightness?: number; displayEmoji?: string }) ?? {};
  const textEffect = te.type ? EFFECT_ALIASES[te.type] ?? te.type : "";
  const socialStyle = readCustomization(user.profile?.customization).socialStyle;
  const bioSize = user.profile?.bioFontSize ?? "base";
  const displayName = user.displayName ?? user.username;

  const teStyle: React.CSSProperties = textEffect ? {
    ["--te-color" as string]: te.color,
    ["--te-color2" as string]: te.color2,
    ["--te-color3" as string]: te.color3,
    ["--te-speed" as string]: te.speed ? `${te.speed}s` : undefined,
    ["--chars" as string]: textEffect === "typewriter" ? String(Math.max(1, graphemes(displayName).length)) : undefined,
  } : {};

  const bioSizeClass = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  }[bioSize] ?? "text-base";

  const handleMessage = async () => {
    setSendingMessage(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: user.id, content: "\ud83d\udc4b" }),
      });
      if (res.ok) router.push("/community?tab=messages");
    } catch { /* ignore */ } finally { setSendingMessage(false); }
  };

  return (
    <div className={className}>
      {/* photo beside the name when there is room, above it in a narrow box */}
      <div className="flex flex-col items-start gap-3 @sm:flex-row @sm:gap-4 @2xl:gap-5">
        <Avatar
          src={user.profile?.profilePictureUrl}
          alt={user.displayName ?? user.username}
          size="2xl"
          className="profile-avatar h-24 w-24 @2xl:h-32 @2xl:w-32"
        />
        <div className="flex-1 min-w-0 pt-2">
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
            <h1
              className={`profile-name min-w-0 max-w-full text-3xl @md:text-4xl @2xl:text-5xl font-light lowercase tracking-tight leading-none font-[family-name:var(--profile-heading-font)] [overflow-wrap:anywhere] ${
                textEffect ? `text-effect-${textEffect}` : ""
              }`}
              style={teStyle}
              {...(textEffect === "glitch" ? { "data-text": displayName } : {})}
            >
              {textEffect === "wave" ? (
                graphemes(displayName).map((ch, i) => (
                  <span key={i} className="text-effect-wave-char" style={{ ["--char-index" as string]: i }}>
                    {ch === " " ? "\u00A0" : ch}
                  </span>
                ))
              ) : textEffect === "typewriter" ? (
                <span className="te-typed">{displayName}</span>
              ) : (
                displayName
              )}
            </h1>
            {te.displayEmoji && (
              <span className="profile-name-emoji flex-shrink-0 text-3xl @md:text-4xl @2xl:text-5xl leading-none" aria-hidden>
                {te.displayEmoji}
              </span>
            )}
            {user.isVerified && <BadgeCheck className="h-[1.6rem] w-[1.6rem] text-[var(--profile-primary)] flex-shrink-0" aria-label="verified" />}
            <RankBadge user={user} className="self-center" />
          </div>
          <div className="flex items-center gap-2 mt-1 opacity-70 text-sm">
            <span>@{user.username}</span>
            {user.pronouns && (<><span className="text-border">&middot;</span><span>{user.pronouns}</span></>)}
          </div>
          <SocialLinks links={user.links ?? []} style={socialStyle} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isOwn ? (
              <Link href="/settings/profile" className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">Edit profile</Link>
            ) : (
              <>
                <Button variant={isFollowingNow ? "outline" : "primary"} size="sm" onClick={toggleFollow} disabled={followBusy}>
                  {isFollowingNow ? (<><UserCheck className="w-4 h-4 mr-1.5" />Following</>) : (<><UserPlus className="w-4 h-4 mr-1.5" />Follow</>)}
                </Button>
                <Button variant="outline" size="sm" onClick={handleMessage} disabled={sendingMessage}>
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageCircle className="w-4 h-4 mr-1.5" />Message</>}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {user.bio && <p className={`profile-bio mt-4 ${bioSizeClass} whitespace-pre-wrap break-words`}>{user.bio}</p>}
      <div className="mt-3 flex items-center gap-4 text-sm opacity-70 flex-wrap">
        {user.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{user.location}</span>}
        {user.website && (
          <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[var(--profile-primary)] hover:underline">
            <LinkIcon className="w-3.5 h-3.5" />{new URL(user.website).hostname}
          </a>
        )}
      </div>
      <div className="mt-4 flex items-center gap-6 text-sm">
        <button className="hover:underline" onClick={() => setFollowModal("followers")}><span className="font-semibold">{formatCount(followers)}</span>{" "}<span className="opacity-70">followers</span></button>
        <button className="hover:underline" onClick={() => setFollowModal("following")}><span className="font-semibold">{formatCount(user._count.following)}</span>{" "}<span className="opacity-70">following</span></button>
        <span><span className="font-semibold">{formatCount(user._count.posts)}</span>{" "}<span className="opacity-70">posts</span></span>
      </div>
      {followModal && (
        <FollowListModal
          username={user.username}
          type={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
}
