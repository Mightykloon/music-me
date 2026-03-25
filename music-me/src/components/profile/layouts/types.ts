import type { TrackInfo } from "@/types";

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
      headingFont: string | null;
      bioFontSize: string | null;
      textEffects: Record<string, unknown> | null;
      layoutStyle: string;
      autoplayProfileSong: boolean;
      vibeBoard: unknown[] | null;
      favorites: { books?: string[]; games?: string[]; hobbies?: string[]; interests?: string[] } | null;
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
  genres?: { genre: string; count: number }[];
}
