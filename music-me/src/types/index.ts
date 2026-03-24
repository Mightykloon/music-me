export type FeedDisplayMode = "stream" | "grid" | "radio" | "magazine";
export type FeedSource = "foryou" | "following" | "discover";

export interface UserPublic {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  pronouns: string | null;
  location: string | null;
  website: string | null;
  isVerified: boolean;
  role: "USER" | "CREATOR" | "ADMIN";
  createdAt: string;
  profile: UserProfilePublic | null;
  _count?: {
    followers: number;
    following: number;
    posts: number;
  };
}

export interface UserProfilePublic {
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
  headingFont: string | null;
  bioFontSize: string | null;
  textEffects: Record<string, unknown> | null;
  layoutStyle: "CLASSIC" | "BENTO" | "MINIMAL" | "MAGAZINE" | "MYSPACE";
  profileSongId: string | null;
  autoplayProfileSong: boolean;
  vibeBoard: unknown[] | null;
  favorites: { books?: string[]; games?: string[]; hobbies?: string[]; interests?: string[] } | null;
}

export interface TrackInfo {
  id: string;
  provider: string;
  providerTrackId: string;
  title: string;
  artist: string;
  album: string | null;
  albumArtUrl: string | null;
  previewUrl: string | null;
  duration: number | null;
  externalUrl: string | null;
}

export interface PostInfo {
  id: string;
  authorId: string;
  type: string;
  content: string | null;
  mediaUrls: string[];
  videoUrl: string | null;
  thumbnailUrl: string | null;
  attachedTrack: TrackInfo | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: UserPublic;
  _count?: {
    comments: number;
    reactions: number;
    reposts: number;
  };
}
