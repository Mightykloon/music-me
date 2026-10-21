import { z } from "zod";
import { FONT_NAME, MAX_CSS_LENGTH, customizationSchema } from "@/lib/profile/customization";

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

/**
 * A web link. z.string().url() on its own also accepts javascript: and data:
 * URLs, which must never end up in an href.
 */
export const httpUrl = z
  .string()
  .url()
  .refine((v) => /^https?:\/\//i.test(v), { message: "Links must start with http:// or https://" });

// Images: a web URL, or an inline image (older avatars were saved that way).
// Inline ones must really be images and are capped, since they're sent with
// every page that shows them.
const MAX_INLINE_IMAGE = 1_500_000;
const urlOrDataUrl = z
  .string()
  .refine(
    (v) =>
      v === "" ||
      /^https?:\/\//i.test(v) ||
      (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length <= MAX_INLINE_IMAGE),
    { message: "Images must be a web link or an image under 1MB" }
  )
  .optional()
  .or(z.literal(""));

export const profileUpdateSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  pronouns: z.string().max(30).optional(),
  location: z.string().max(100).optional(),
  website: httpUrl.max(200).optional().or(z.literal("")),
  profilePictureUrl: urlOrDataUrl,
  bannerUrl: urlOrDataUrl,
  bannerVideoUrl: urlOrDataUrl,
  backgroundColor: z.string().max(20).optional(),
  backgroundImageUrl: urlOrDataUrl,
  backgroundOpacity: z.number().min(0).max(1).optional(),
  primaryColor: z.string().max(20).optional(),
  secondaryColor: z.string().max(20).optional(),
  accentColor: z.string().max(20).optional(),
  fontFamily: z.string().regex(FONT_NAME, "Font names can only use letters, numbers and spaces").optional(),
  fontWeight: z.enum(["300", "400", "500", "600", "700"]).optional(),
  customCSS: z.string().max(MAX_CSS_LENGTH, "Custom CSS is too long").optional(),
  customization: customizationSchema.optional(),
  headingFont: z.string().regex(FONT_NAME, "Font names can only use letters, numbers and spaces").optional(),
  bioFontSize: z.enum(["sm", "base", "lg", "xl"]).optional(),
  textEffects: z.record(z.string(), z.unknown()).optional(),
  layoutStyle: z.enum(["CLASSIC", "BENTO", "MINIMAL", "MAGAZINE", "MYSPACE"]).optional(),
  profileSongId: z.string().optional().or(z.literal("")),
  autoplayProfileSong: z.boolean().optional(),
  vibeBoard: z.array(z.unknown()).optional(),
  favorites: z.object({
    books: z.array(z.string()).optional(),
    games: z.array(z.string()).optional(),
    hobbies: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
});

export const linkSchema = z.object({
  title: z.string().min(1).max(100),
  url: httpUrl.max(500),
  iconType: z.string().max(30).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
