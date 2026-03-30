import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Username can only contain lowercase letters, numbers, hyphens, and underscores"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  pronouns: z.string().max(30).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().max(200).optional().or(z.literal("")),
  profilePictureUrl: z.string().optional().or(z.literal("")),
  bannerUrl: z.string().optional().or(z.literal("")),
  bannerVideoUrl: z.string().url().optional().or(z.literal("")),
  backgroundColor: z.string().max(20).optional(),
  backgroundImageUrl: z.string().optional().or(z.literal("")),
  backgroundOpacity: z.number().min(0).max(1).optional(),
  primaryColor: z.string().max(20).optional(),
  secondaryColor: z.string().max(20).optional(),
  accentColor: z.string().max(20).optional(),
  fontFamily: z.string().max(50).optional(),
  fontWeight: z.string().max(10).optional(),
  headingFont: z.string().max(50).optional(),
  bioFontSize: z.enum(["sm", "base", "lg", "xl"]).optional(),
  textEffects: z.record(z.string(), z.unknown()).optional(),
  layoutStyle: z.enum(["CLASSIC", "BENTO", "MINIMAL", "MAGAZINE", "MYSPACE"]).optional(),
  profileSongId: z.string().optional().or(z.literal("")),
  autoplayProfileSong: z.boolean().optional(),
  vibeBoard: z.array(z.unknown()).optional(),
});

export const linkSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().url().max(500),
  iconType: z.string().max(30).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
