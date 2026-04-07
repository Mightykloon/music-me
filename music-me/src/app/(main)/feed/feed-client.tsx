"use client";

import { FeedContainer } from "@/components/feed/feed-container";
import { PostComposer } from "@/components/feed/post-composer";
import { TrendingSidebar } from "@/components/feed/trending-sidebar";

interface FeedPageClientProps {
  user: {
    username: string;
    displayName: string | null;
    profile: { profilePictureUrl: string | null } | null;
  } | null;
}

export function FeedPageClient({ user }: FeedPageClientProps) {
  return (
    <div className="max-w-6xl mx-auto flex gap-6 px-4">
      {/* Main feed */}
      <div className="flex-1 max-w-2xl mx-auto min-w-0">
        {user && <PostComposer user={user} />}
        <FeedContainer />
      </div>

      {/* Trending sidebar — hidden on mobile/tablet */}
      <aside className="hidden xl:block w-72 flex-shrink-0 sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto pb-8">
        <TrendingSidebar />
      </aside>
    </div>
  );
}
