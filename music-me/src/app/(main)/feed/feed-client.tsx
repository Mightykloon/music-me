"use client";

import { FeedContainer } from "@/components/feed/feed-container";
import { PostComposer } from "@/components/feed/post-composer";

interface FeedPageClientProps {
  user: {
    username: string;
    displayName: string | null;
    profile: { profilePictureUrl: string | null } | null;
  } | null;
}

export function FeedPageClient({ user }: FeedPageClientProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {user && <PostComposer user={user} />}
      <FeedContainer />
    </div>
  );
}
