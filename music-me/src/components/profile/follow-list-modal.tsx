"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Loader2, UserPlus, UserCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface FollowUser {
  id: string;
  username: string;
  displayName: string | null;
  profile: { profilePictureUrl: string | null } | null;
}

interface FollowListModalProps {
  username: string;
  type: "followers" | "following";
  onClose: () => void;
}

export function FollowListModal({
  username,
  type,
  onClose,
}: FollowListModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch list + current session in parallel
    Promise.all([
      fetch(`/api/users/${username}/${type}`).then((r) => r.json()),
      fetch("/api/auth/session").then((r) => r.json()).catch(() => null),
    ]).then(([listData, session]) => {
      setUsers(Array.isArray(listData) ? listData : []);
      setCurrentUserId(session?.user?.id ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [username, type]);

  // Check which users in the list we're following
  useEffect(() => {
    if (!currentUserId || users.length === 0) return;
    Promise.all(
      users.map((u) =>
        fetch(`/api/users/${u.username}/follow`)
          .then((r) => r.json())
          .then((d) => (d.isFollowing ? u.id : null))
          .catch(() => null)
      )
    ).then((results) => {
      setFollowingSet(new Set(results.filter(Boolean) as string[]));
    });
  }, [users, currentUserId]);

  const handleFollow = useCallback(
    async (user: FollowUser) => {
      setTogglingId(user.id);
      try {
        const res = await fetch(`/api/users/${user.username}/follow`, {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          setFollowingSet((prev) => {
            const next = new Set(prev);
            if (data.action === "followed") next.add(user.id);
            else next.delete(user.id);
            return next;
          });
        }
      } catch {
        /* ignore */
      } finally {
        setTogglingId(null);
      }
    },
    []
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold capitalize">{type}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              No {type} yet
            </p>
          ) : (
            <div className="space-y-1">
              {users.map((user) => {
                const isMe = user.id === currentUserId;
                const isFollowing = followingSet.has(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors"
                  >
                    <Link href={`/${user.username}`} onClick={onClose}>
                      <Avatar
                        src={user.profile?.profilePictureUrl}
                        alt={user.displayName ?? user.username}
                        size="md"
                      />
                    </Link>
                    <Link
                      href={`/${user.username}`}
                      onClick={onClose}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-sm font-medium truncate">
                        {user.displayName ?? user.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </Link>
                    {!isMe && currentUserId && (
                      <Button
                        variant={isFollowing ? "outline" : "primary"}
                        size="sm"
                        onClick={() => handleFollow(user)}
                        disabled={togglingId === user.id}
                        className="flex-shrink-0"
                      >
                        {togglingId === user.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
