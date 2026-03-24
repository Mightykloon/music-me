"use client";

import { useState } from "react";
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
    profile: {
      profilePictureUrl: string | null;
      textEffects: Record<string, unknown> | null;
      bioFontSize: string | null;
    } | null;
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
  const te = (user.profile?.textEffects as { type?: string; color?: string; color2?: string; color3?: string; speed?: number; brightness?: number; displayEmoji?: string }) ?? {};
  const textEffect = te.type;
  const bioSize = user.profile?.bioFontSize ?? "base";
  const displayName = user.displayName ?? user.username;

  const teStyle: React.CSSProperties = textEffect ? {
    ["--te-color" as string]: te.color,
    ["--te-color2" as string]: te.color2,
    ["--te-color3" as string]: te.color3,
    ["--te-speed" as string]: te.speed ? `${te.speed}s` : undefined,
    ["--te-brightness" as string]: te.brightness != null ? `${te.brightness}` : undefined,
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
      <div className="flex items-start gap-5">
        <Avatar src={user.profile?.profilePictureUrl} alt={user.displayName ?? user.username} size="2xl" className="ring-4 ring-[var(--profile-primary)]/20" />
        <div className="flex-1 min-w-0 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className={`text-2xl sm:text-3xl font-bold font-[family-name:var(--profile-heading-font)] truncate ${textEffect ? `text-effect-${textEffect}` : ""}`}
              style={teStyle}
              {...(textEffect === "glitch" ? { "data-text": displayName } : {})}
            >
              {textEffect === "wave"
                ? displayName.split("").map((ch, i) => (
                    <span key={i} className="text-effect-wave-char" style={{ ["--char-index" as string]: i }}>
                      {ch === " " ? "\u00A0" : ch}
                    </span>
                  ))
                : displayName}
            </h1>
            {te.displayEmoji && <span className="flex-shrink-0">{te.displayEmoji}</span>}
            {user.isVerified && <BadgeCheck className="w-5 h-5 text-[var(--profile-primary)] flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
            <span>@{user.username}</span>
            {user.pronouns && (<><span className="text-border">&middot;</span><span>{user.pronouns}</span></>)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {isOwn ? (
              <a href="/settings/profile" className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">Edit profile</a>
            ) : (
              <>
                <Button variant={isFollowing ? "outline" : "primary"} size="sm" onClick={onFollow}>
                  {isFollowing ? (<><UserCheck className="w-4 h-4 mr-1.5" />Tuned In</>) : (<><UserPlus className="w-4 h-4 mr-1.5" />Tune In</>)}
                </Button>
                <Button variant="outline" size="sm" onClick={handleMessage} disabled={sendingMessage}>
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageCircle className="w-4 h-4 mr-1.5" />Message</>}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {user.bio && <p className={`mt-4 ${bioSizeClass} whitespace-pre-wrap break-words`}>{user.bio}</p>}
      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        {user.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{user.location}</span>}
        {user.website && (
          <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[var(--profile-primary)] hover:underline">
            <LinkIcon className="w-3.5 h-3.5" />{new URL(user.website).hostname}
          </a>
        )}
      </div>
      <div className="mt-4 flex items-center gap-6 text-sm">
        <button className="hover:underline"><span className="font-semibold">{formatCount(user._count.followers)}</span>{" "}<span className="text-muted-foreground">Listeners</span></button>
        <button className="hover:underline"><span className="font-semibold">{formatCount(user._count.following)}</span>{" "}<span className="text-muted-foreground">Tuned In</span></button>
        <span><span className="font-semibold">{formatCount(user._count.posts)}</span>{" "}<span className="text-muted-foreground">Posts</span></span>
      </div>
    </div>
  );
}
