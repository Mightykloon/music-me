import type { TrackInfo } from "@/types";
import type { Customization } from "@/lib/profile/customization";

export interface Top8Friend {
  id: string;
  username: string;
  displayName: string | null;
  profilePictureUrl: string | null;
}

export interface ThreadInfo {
  id: string;
  title: string;
  createdAt: string;
  categorySlug: string;
  categoryName: string;
  replies: number;
}

export interface WallCommentInfo {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    profile: { profilePictureUrl: string | null } | null;
  };
}

export interface ProfileLayoutProps {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    pronouns: string | null;
    location: string | null;
    website: string | null;
    isVerified: boolean;
    role: string;
    forumRank?: string | null;
    forumRankColor?: string | null;
    profile: {
      profilePictureUrl: string | null;
      bannerUrl: string | null;
      bannerVideoUrl: string | null;
      backgroundColor: string | null;
      backgroundImageUrl: string | null;
      backgroundOpacity: number | null;
      primaryColor: string | null;
      secondaryColor: string | null;
      accentColor: string | null;
      fontFamily: string | null;
      fontWeight: string | null;
      customCSS: string | null;
      customization: unknown;
      profileViews: number;
      headingFont: string | null;
      bioFontSize: string | null;
      textEffects: Record<string, unknown> | null;
      layoutStyle: string;
      autoplayProfileSong: boolean;
      vibeBoard: unknown[] | null;
      favorites: { books?: string[]; games?: string[]; hobbies?: string[]; interests?: string[]; covers?: Record<string, string> } | null;
    } | null;
    links: {
      id: string;
      title: string;
      url: string;
      iconType: string | null;
      clickCount: number;
    }[];
    playlists: {
      id: string;
      name: string;
      description: string | null;
      coverImageUrl: string | null;
      trackCount: number;
      provider: string;
      isPinned: boolean;
    }[];
    nowPlaying: {
      track: TrackInfo;
    } | null;
    profileSong: TrackInfo | null;
    /** whether the signed-in visitor follows this person */
    isFollowedByViewer?: boolean;
    top8?: Top8Friend[];
    /** forum threads they started, newest first */
    threads?: ThreadInfo[];
    _count: {
      followers: number;
      following: number;
      posts: number;
    };
  };
  posts: {
    id: string;
    type: string;
    content: string | null;
    mediaUrls: string[];
    videoUrl: string | null;
    thumbnailUrl: string | null;
    attachedTrack: {
      title: string;
      artist: string;
      albumArtUrl: string | null;
    } | null;
    createdAt: string;
    author: {
      username: string;
      displayName: string | null;
      profile: { profilePictureUrl: string | null } | null;
    };
    _count: {
      comments: number;
      reactions: number;
      reposts: number;
    };
  }[];
  isOwn: boolean;
  /** signed-in visitor's id, if any (for the wall) */
  viewerId?: string | null;
  custom: Customization;
  wall?: { comments: WallCommentInfo[]; nextCursor: string | null };
  genres?: { genre: string; count: number }[];
}
