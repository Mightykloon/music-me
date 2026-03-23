"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  Flame,
  MessageCircle,
  Repeat2,
  AtSign,
  ListMusic,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface NotificationItem {
  id: string;
  type: string;
  referenceId: string | null;
  referenceType: string | null;
  read: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string | null;
    profile: { profilePictureUrl: string | null } | null;
  } | null;
}

const NOTIFICATION_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    getMessage: (actor: string) => string;
  }
> = {
  FOLLOW: {
    icon: UserPlus,
    color: "text-blue-400",
    getMessage: (a) => `${a} followed you`,
  },
  REACTION: {
    icon: Flame,
    color: "text-orange-400",
    getMessage: (a) => `${a} reacted to your post`,
  },
  COMMENT: {
    icon: MessageCircle,
    color: "text-green-400",
    getMessage: (a) => `${a} commented on your post`,
  },
  REPOST: {
    icon: Repeat2,
    color: "text-purple-400",
    getMessage: (a) => `${a} reposted your post`,
  },
  MENTION: {
    icon: AtSign,
    color: "text-cyan-400",
    getMessage: (a) => `${a} mentioned you`,
  },
  PLAYLIST_DROP: {
    icon: ListMusic,
    color: "text-pink-400",
    getMessage: (a) => `${a} dropped a new playlist`,
  },
};

export function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 py-4 border-b border-border/50">
        <h1 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
          Notifications
        </h1>
      </div>

      {initialNotifications.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p className="text-muted-foreground text-sm">
            No notifications yet.
          </p>
        </div>
      ) : (
        <div>
          {initialNotifications.map((notif) => {
            const config = NOTIFICATION_CONFIG[notif.type];
            if (!config || !notif.actor) return null;
            const Icon = config.icon;
            const actorName =
              notif.actor.displayName ?? notif.actor.username;

            const href =
              notif.type === "FOLLOW"
                ? `/${notif.actor.username}`
                : notif.referenceId && notif.referenceType === "post"
                  ? `/post/${notif.referenceId}`
                  : `/${notif.actor.username}`;

            return (
              <Link
                key={notif.id}
                href={href}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/30 ${
                  !notif.read ? "bg-primary/5" : ""
                }`}
              >
                <div className={`mt-0.5 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={notif.actor.profile?.profilePictureUrl}
                      alt={actorName}
                      size="sm"
                    />
                    <p className="text-sm">
                      <span className="font-medium">{actorName}</span>{" "}
                      <span className="text-muted-foreground">
                        {config
                          .getMessage(actorName)
                          .replace(actorName + " ", "")}
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
