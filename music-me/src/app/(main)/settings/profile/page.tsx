"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Save, Loader2, Upload, X, Plus, Trash2, GripVertical, ExternalLink, Globe, Twitter, Instagram, Youtube, Github, Music, Twitch, Linkedin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ImageCropEditor } from "@/components/ui/image-crop-editor";
import { useUpload } from "@/hooks/use-upload";
import { containsProfanity } from "@/lib/utils/profanity";
import { DEFAULT_CUSTOMIZATION, readCustomization, type Customization, type ThemePreset } from "@/lib/profile/customization";
import { CssEditor, ExtrasPanel, FontPicker, LivePreview, ProfileSongPicker, StylePanel, ThemePresets, Top8Picker } from "@/components/profile/editor/customize-panels";
import type { ProfileLayoutProps, Top8Friend } from "@/components/profile/layouts/types";
import type { TrackInfo } from "@/types";

const LAYOUT_OPTIONS = [
  { value: "CLASSIC", label: "Classic", desc: "Traditional, top to bottom" },
  { value: "BENTO", label: "Bento", desc: "Grid card layout" },
  { value: "MINIMAL", label: "Minimal", desc: "Clean and centered" },
  { value: "MAGAZINE", label: "Magazine", desc: "Editorial, in two columns" },
  { value: "MYSPACE", label: "MySpace", desc: "Throwback bordered sections" },
];

const TEXT_EFFECTS = [
  { value: "", label: "None" },
  { value: "glow", label: "Glow" },
  { value: "neon", label: "Neon" },
  { value: "animated-gradient", label: "Animated Gradient" },
  { value: "glitch", label: "Glitch (RGB Split)" },
  { value: "typewriter", label: "Typewriter" },
  { value: "wave", label: "Wave" },
  { value: "pulse", label: "Pulse" },
  { value: "flicker", label: "Flicker" },
  { value: "shadow-pop", label: "Shadow Pop" },
  { value: "rainbow", label: "Rainbow Cycle" },
];

const LINK_ICON_OPTIONS = [
  { value: "globe", label: "Website", icon: Globe },
  { value: "twitter", label: "Twitter / X", icon: Twitter },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "github", label: "GitHub", icon: Github },
  { value: "music", label: "Music", icon: Music },
  { value: "twitch", label: "Twitch", icon: Twitch },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "discord", label: "Discord", icon: MessageCircle },
  { value: "other", label: "Other", icon: ExternalLink },
];

const INTEREST_SUGGESTIONS = [
  "Music", "Gaming", "Art", "Photography", "Coding", "Anime", "Movies",
  "Reading", "Fashion", "Cooking", "Travel", "Fitness", "Nature", "Cats",
  "Dogs", "Technology", "Science", "Astronomy", "History", "Philosophy",
  "Psychology", "Design", "Film", "Theatre", "Dance", "Writing", "Poetry",
  "Cars", "Skateboarding", "Sneakers", "Vinyl", "Retro Gaming", "Cosplay",
  "Board Games", "Podcasts", "Investing", "Gardening", "DIY", "Streaming",
];

const HOBBY_SUGGESTIONS = [
  "Guitar", "Piano", "Singing", "Drawing", "Painting", "Hiking", "Running",
  "Cycling", "Swimming", "Yoga", "Meditation", "Cooking", "Baking", "Knitting",
  "Woodworking", "Photography", "Filmmaking", "DJing", "Producing Music",
  "3D Printing", "Rock Climbing", "Surfing", "Skiing", "Fishing", "Camping",
  "Journaling", "Calligraphy", "Pottery", "Archery", "Martial Arts",
  "Skateboarding", "Longboarding", "Chess", "Speedcubing", "Origami",
];

interface LinkFormItem {
  id?: string;
  title: string;
  url: string;
  iconType: string;
  isNew?: boolean;
}

const FONT_WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];

const BIO_SIZES = [
  { value: "sm", label: "Small" },
  { value: "base", label: "Normal" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

interface ProfileFormData {
  displayName: string;
  bio: string;
  pronouns: string;
  location: string;
  website: string;
  profilePictureUrl: string;
  bannerUrl: string;
  backgroundColor: string;
  backgroundImageUrl: string;
  backgroundOpacity: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headingFont: string;
  fontWeight: string;
  bioFontSize: string;
  customCSS: string;
  customization: Customization;
  textEffects: {
    type: string;
    color?: string;
    color2?: string;
    color3?: string;
    speed?: number;
    brightness?: number;
    displayEmoji?: string;
  };
  layoutStyle: string;
  autoplayProfileSong: boolean;
  favorites: {
    books: string[];
    games: string[];
    hobbies: string[];
    interests: string[];
  };
}

// the preview doesn't load real wall comments
const EMPTY_WALL = { comments: [], nextCursor: null };

const defaultForm: ProfileFormData = {
  displayName: "",
  bio: "",
  pronouns: "",
  location: "",
  website: "",
  profilePictureUrl: "",
  bannerUrl: "",
  backgroundColor: "#0a0a0a",
  backgroundImageUrl: "",
  backgroundOpacity: 1,
  primaryColor: "#8b5cf6",
  secondaryColor: "#6d28d9",
  accentColor: "#a78bfa",
  fontFamily: "Inter",
  headingFont: "Space Grotesk",
  fontWeight: "400",
  bioFontSize: "base",
  customCSS: "",
  customization: DEFAULT_CUSTOMIZATION,
  textEffects: { type: "", color: "#8b5cf6", color2: "#ec4899", color3: "#f59e0b", speed: 4, brightness: 1, displayEmoji: "" },
  layoutStyle: "CLASSIC",
  autoplayProfileSong: false,
  favorites: { books: [], games: [], hobbies: [], interests: [] },
};

export default function ProfileEditorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { upload, uploading, progress } = useUpload();
  const [form, setForm] = useState<ProfileFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [bgCropImage, setBgCropImage] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkFormItem[]>([]);
  const [loadedUser, setLoadedUser] = useState<ProfileLayoutProps["user"] | null>(null);
  const [profileSong, setProfileSong] = useState<TrackInfo | null>(null);
  const [top8, setTop8] = useState<Top8Friend[]>([]);
  const [mobilePreview, setMobilePreview] = useState(false);

  // Load current profile data
  useEffect(() => {
    if (!session?.user) return;
    const username = (session.user as { username?: string }).username;
    if (!username) return;

    fetch(`/api/users/${username}`)
      .then((r) => r.json())
      .then((user) => {
        setForm({
          displayName: user.displayName ?? "",
          bio: user.bio ?? "",
          pronouns: user.pronouns ?? "",
          location: user.location ?? "",
          website: user.website ?? "",
          profilePictureUrl: user.profile?.profilePictureUrl ?? "",
          bannerUrl: user.profile?.bannerUrl ?? "",
          backgroundColor: user.profile?.backgroundColor ?? "#0a0a0a",
          backgroundImageUrl: user.profile?.backgroundImageUrl ?? "",
          backgroundOpacity: user.profile?.backgroundOpacity ?? 1,
          primaryColor: user.profile?.primaryColor ?? "#8b5cf6",
          secondaryColor: user.profile?.secondaryColor ?? "#6d28d9",
          accentColor: user.profile?.accentColor ?? "#a78bfa",
          fontFamily: user.profile?.fontFamily ?? "Inter",
          headingFont: user.profile?.headingFont ?? "Space Grotesk",
          fontWeight: user.profile?.fontWeight ?? "400",
          bioFontSize: user.profile?.bioFontSize ?? "base",
          customCSS: user.profile?.customCSS ?? "",
          customization: readCustomization(user.profile?.customization),
          textEffects: {
            type: "",
            color: "#8b5cf6",
            color2: "#ec4899",
            color3: "#f59e0b",
            speed: 4,
            brightness: 1,
            ...(user.profile?.textEffects as Record<string, unknown> ?? {}),
          },
          layoutStyle: user.profile?.layoutStyle ?? "CLASSIC",
          autoplayProfileSong: user.profile?.autoplayProfileSong ?? false,
          favorites: {
            books: (user.profile?.favorites as Record<string, string[]>)?.books ?? [],
            games: (user.profile?.favorites as Record<string, string[]>)?.games ?? [],
            hobbies: (user.profile?.favorites as Record<string, string[]>)?.hobbies ?? [],
            interests: (user.profile?.favorites as Record<string, string[]>)?.interests ?? [],
          },
        });
        setLoadedUser(user);
        setProfileSong(user.profile?.profileSong ?? null);
        setLoaded(true);
      });

    // Load links separately
    fetch("/api/users/me/links")
      .then((r) => r.json())
      .then((data) => {
        setLinks(
          (data.links ?? []).map((l: LinkFormItem & { id: string }) => ({
            id: l.id,
            title: l.title,
            url: l.url,
            iconType: l.iconType || "globe",
          }))
        );
      });
  }, [session]);

  const update = useCallback(
    (key: keyof ProfileFormData, value: unknown) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const applyPreset = (p: ThemePreset) => {
    setForm((prev) => ({
      ...prev,
      ...p.colors,
      fontFamily: p.fontFamily,
      headingFont: p.headingFont,
      layoutStyle: p.layoutStyle,
      textEffects: { ...prev.textEffects, type: p.textEffect },
      customization: { ...prev.customization, ...p.customization },
    }));
    toast.success(`"${p.name}" applied. Save to keep it.`);
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadFileToStorage = async (file: File, category: "avatars" | "banners" | "backgrounds" | "posts"): Promise<string> => {
    // Get presigned URL
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, contentType: file.type, fileSize: file.size }),
    });
    if (!presignRes.ok) {
      const err = await presignRes.json();
      throw new Error(err.error || "Failed to get upload URL");
    }
    const { uploadUrl, publicUrl } = await presignRes.json();
    // Upload directly to storage
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");
    return publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setCropImage(dataUrl);
    } catch {
      toast.error("Upload failed");
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Uploading banner...", { id: "banner-upload" });
      const publicUrl = await uploadFileToStorage(file, "banners");
      update("bannerUrl", publicUrl);
      toast.success("Banner uploaded!", { id: "banner-upload" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id: "banner-upload" });
    }
  };

  const handleBackgroundUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Open crop editor with 9:16 portrait aspect ratio
    const reader = new FileReader();
    reader.onload = () => setBgCropImage(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleBgCropComplete = async (croppedDataUrl: string) => {
    setBgCropImage(null);
    try {
      toast.loading("Uploading background...", { id: "bg-upload" });
      // Convert data URL to File for upload
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "background.jpg", { type: "image/jpeg" });
      const publicUrl = await uploadFileToStorage(file, "backgrounds");
      update("backgroundImageUrl", publicUrl);
      toast.success("Background uploaded!", { id: "bg-upload" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id: "bg-upload" });
    }
  };

  const handleSave = async () => {
    // Client-side profanity check
    const allText = [
      form.displayName,
      form.bio,
      ...form.favorites.interests,
      ...form.favorites.hobbies,
      ...form.favorites.books,
      ...form.favorites.games,
      form.customization.marquee,
      form.customization.moodText,
      form.customization.top8Title,
    ].join(" ");
    if (containsProfanity(allText)) {
      toast.error("Please remove inappropriate language before saving");
      return;
    }

    setSaving(true);
    try {
      // Save profile
      const res = await fetch("/api/users/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      // Save links - delete removed, create new, update existing
      const existingLinks = links.filter((l) => l.id && !l.isNew);
      const newLinks = links.filter((l) => l.isNew || !l.id);

      // Create new links
      for (const link of newLinks) {
        if (!link.title.trim() || !link.url.trim()) continue;
        await fetch("/api/users/me/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: link.title,
            url: link.url,
            iconType: link.iconType || "globe",
          }),
        });
      }

      // Update existing links
      for (const link of existingLinks) {
        await fetch(`/api/users/me/links/${link.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: link.title,
            url: link.url,
            iconType: link.iconType || "globe",
          }),
        });
      }

      toast.success("Profile updated!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const previewUser: ProfileLayoutProps["user"] | null = loadedUser && {
    ...loadedUser,
    displayName: form.displayName || null,
    bio: form.bio || null,
    pronouns: form.pronouns || null,
    location: form.location || null,
    website: /^https?:\/\/./.test(form.website) ? form.website : null,
    links: links
      .filter((l) => l.title.trim() && /^https?:\/\//.test(l.url))
      .map((l, i) => ({ id: l.id ?? `new-${i}`, title: l.title, url: l.url, iconType: l.iconType, clickCount: 0 })),
    playlists: loadedUser.playlists ?? [],
    nowPlaying: null,
    profileSong,
    top8,
    profile: {
      ...(loadedUser.profile ?? ({} as NonNullable<ProfileLayoutProps["user"]["profile"]>)),
      profilePictureUrl: form.profilePictureUrl || null,
      bannerUrl: form.bannerUrl || null,
      backgroundColor: form.backgroundColor,
      backgroundImageUrl: form.backgroundImageUrl || null,
      backgroundOpacity: form.backgroundOpacity,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      accentColor: form.accentColor,
      fontFamily: form.fontFamily,
      headingFont: form.headingFont,
      fontWeight: form.fontWeight,
      bioFontSize: form.bioFontSize,
      textEffects: form.textEffects,
      layoutStyle: form.layoutStyle,
      autoplayProfileSong: false,
      customCSS: form.customCSS,
      customization: form.customization,
      favorites: form.favorites,
      profileViews: loadedUser.profile?.profileViews ?? 0,
      vibeBoard: loadedUser.profile?.vibeBoard ?? [],
    },
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="py-2">
        <div className="flex items-center justify-between mb-8">
          <h1 className="metro-header text-5xl">
            edit profile
          </h1>
          <div className="flex items-center gap-2">
          <Button variant="outline" className="xl:hidden" onClick={() => setMobilePreview(true)}>
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8">
          {/* Editor panel */}
          <div className="space-y-8">
            <Section title="Themes">
              <p className="text-sm text-muted-foreground -mt-2">One click starting points. They set colours, fonts, layout and style; tweak anything after.</p>
              <ThemePresets onApply={applyPreset} />
            </Section>

            {/* Basic Info */}
            <Section title="Basic Info">
              <div className="flex items-center gap-4 mb-4">
                <Avatar
                  src={form.profilePictureUrl || null}
                  alt={form.displayName || "You"}
                  size="xl"
                />
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      <Upload className="w-3.5 h-3.5" />
                      {uploading ? `Uploading ${progress}%` : "Upload avatar"}
                    </span>
                  </label>
                  {form.profilePictureUrl && (
                    <button
                      onClick={() => update("profilePictureUrl", "")}
                      className="block text-xs text-muted-foreground hover:text-destructive mt-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <Field label="Display Name">
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => update("displayName", e.target.value)}
                  maxLength={50}
                  className="input-field"
                />
              </Field>
              <Field label="Display Emoji">
                <div className="flex items-center gap-3">
                  {form.textEffects.displayEmoji && (
                    <span className="text-3xl">{form.textEffects.displayEmoji}</span>
                  )}
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {["🎵", "🎸", "🎤", "🎧", "🎹", "🥁", "🎺", "🎻", "🔥", "⚡", "💜", "💀", "👑", "🌟", "✨", "🦋", "🌙", "☀️", "🌈", "💎", "🎶", "🎼", "🎷", "🪗", "🎭", "🃏", "🏆", "💫", "🫧", "🍄"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => update("textEffects", {
                          ...form.textEffects,
                          displayEmoji: form.textEffects.displayEmoji === emoji ? "" : emoji,
                        })}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all ${
                          form.textEffects.displayEmoji === emoji
                            ? "bg-primary/20 ring-2 ring-primary scale-110"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                {form.textEffects.displayEmoji && (
                  <button
                    onClick={() => update("textEffects", { ...form.textEffects, displayEmoji: "" })}
                    className="text-xs text-muted-foreground hover:text-destructive mt-1"
                  >
                    Remove emoji
                  </button>
                )}
              </Field>
              <Field label="Bio">
                <textarea
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="input-field resize-none"
                />
                <span className="text-xs text-muted-foreground">
                  {form.bio.length}/500
                </span>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Pronouns">
                  <input
                    type="text"
                    value={form.pronouns}
                    onChange={(e) => update("pronouns", e.target.value)}
                    placeholder="e.g. they/them"
                    maxLength={30}
                    className="input-field"
                  />
                </Field>
                <Field label="Location">
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="City, Country"
                    maxLength={100}
                    className="input-field"
                  />
                </Field>
              </div>
              <Field label="Website">
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://"
                  className="input-field"
                />
              </Field>
            </Section>

            {/* Appearance */}
            <Section title="Appearance">
              <Field label="Banner">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      <Upload className="w-3.5 h-3.5" /> Upload banner
                    </span>
                  </label>
                  {form.bannerUrl && (
                    <button
                      onClick={() => update("bannerUrl", "")}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Field>

              <Field label="Background">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex-1">
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      <Upload className="w-3.5 h-3.5" /> Upload background
                    </span>
                  </label>
                  {form.backgroundImageUrl && (
                    <button
                      onClick={() => update("backgroundImageUrl", "")}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Background Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.backgroundColor}
                      onChange={(e) =>
                        update("backgroundColor", e.target.value)
                      }
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.backgroundColor}
                      onChange={(e) =>
                        update("backgroundColor", e.target.value)
                      }
                      className="input-field flex-1"
                    />
                  </div>
                </Field>
                <Field label="Background Opacity">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={form.backgroundOpacity}
                    onChange={(e) =>
                      update("backgroundOpacity", parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <ColorField
                  label="Primary"
                  value={form.primaryColor}
                  onChange={(v) => update("primaryColor", v)}
                />
                <ColorField
                  label="Secondary"
                  value={form.secondaryColor}
                  onChange={(v) => update("secondaryColor", v)}
                />
                <ColorField
                  label="Accent"
                  value={form.accentColor}
                  onChange={(v) => update("accentColor", v)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FontPicker title="Body Font" value={form.fontFamily} onChange={(v) => update("fontFamily", v)} />
                <FontPicker title="Heading Font" value={form.headingFont} onChange={(v) => update("headingFont", v)} />
              </div>

              <Field label="Body Weight">
                <div className="flex flex-wrap gap-2">
                  {FONT_WEIGHTS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => update("fontWeight", w.value)}
                      className={`border-2 px-3 py-1.5 text-sm transition-colors ${form.fontWeight === w.value ? "border-primary bg-primary/15" : "border-border hover:border-muted-foreground"}`}
                      style={{ fontWeight: Number(w.value) }}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Display Name Effect">
                <select
                  value={form.textEffects.type}
                  onChange={(e) =>
                    update("textEffects", { ...form.textEffects, type: e.target.value })
                  }
                  className="input-field"
                >
                  {TEXT_EFFECTS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Effect-specific controls */}
              {(form.textEffects.type === "glow" || form.textEffects.type === "neon" || form.textEffects.type === "shadow-pop") && (
                <div className="space-y-3 pl-3 border-l-2 border-primary/30">
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Color</label>
                    <input
                      type="color"
                      value={form.textEffects.color ?? "#8b5cf6"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.textEffects.color ?? "#8b5cf6"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color: e.target.value })}
                      className="input-field flex-1 text-xs"
                    />
                  </div>
                  {form.textEffects.type === "neon" && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs lowercase text-muted-foreground w-20">Brightness</label>
                      <input
                        type="range"
                        min={0.3}
                        max={2}
                        step={0.05}
                        value={form.textEffects.brightness ?? 1}
                        onChange={(e) => update("textEffects", { ...form.textEffects, brightness: parseFloat(e.target.value) })}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {((form.textEffects.brightness ?? 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {form.textEffects.type === "animated-gradient" && (
                <div className="space-y-3 pl-3 border-l-2 border-primary/30">
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Start</label>
                    <input
                      type="color"
                      value={form.textEffects.color ?? "#8b5cf6"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <input type="text" value={form.textEffects.color ?? "#8b5cf6"} onChange={(e) => update("textEffects", { ...form.textEffects, color: e.target.value })} className="input-field flex-1 text-xs" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Middle</label>
                    <input
                      type="color"
                      value={form.textEffects.color2 ?? "#ec4899"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color2: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <input type="text" value={form.textEffects.color2 ?? "#ec4899"} onChange={(e) => update("textEffects", { ...form.textEffects, color2: e.target.value })} className="input-field flex-1 text-xs" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">End</label>
                    <input
                      type="color"
                      value={form.textEffects.color3 ?? "#f59e0b"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color3: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <input type="text" value={form.textEffects.color3 ?? "#f59e0b"} onChange={(e) => update("textEffects", { ...form.textEffects, color3: e.target.value })} className="input-field flex-1 text-xs" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Speed</label>
                    <input
                      type="range"
                      min={0.5}
                      max={15}
                      step={0.5}
                      value={form.textEffects.speed ?? 4}
                      onChange={(e) => update("textEffects", { ...form.textEffects, speed: parseFloat(e.target.value) })}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {form.textEffects.speed ?? 4}s
                    </span>
                  </div>
                  {/* Gradient preview bar */}
                  <div
                    className="h-4 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${form.textEffects.color ?? "#8b5cf6"}, ${form.textEffects.color2 ?? "#ec4899"}, ${form.textEffects.color3 ?? "#f59e0b"})`,
                    }}
                  />
                </div>
              )}

              {form.textEffects.type === "rainbow" && (
                <div className="space-y-3 pl-3 border-l-2 border-primary/30">
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Speed</label>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      step={0.5}
                      value={form.textEffects.speed ?? 6}
                      onChange={(e) => update("textEffects", { ...form.textEffects, speed: parseFloat(e.target.value) })}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {form.textEffects.speed ?? 6}s
                    </span>
                  </div>
                </div>
              )}

              {form.textEffects.type === "glitch" && (
                <div className="space-y-3 pl-3 border-l-2 border-primary/30">
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Color 1</label>
                    <input
                      type="color"
                      value={form.textEffects.color ?? "#ff0000"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Color 2</label>
                    <input
                      type="color"
                      value={form.textEffects.color2 ?? "#00ffff"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color2: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Speed</label>
                    <input
                      type="range"
                      min={0.5}
                      max={5}
                      step={0.1}
                      value={form.textEffects.speed ?? 2}
                      onChange={(e) => update("textEffects", { ...form.textEffects, speed: parseFloat(e.target.value) })}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {form.textEffects.speed ?? 2}s
                    </span>
                  </div>
                </div>
              )}

              {(form.textEffects.type === "pulse" || form.textEffects.type === "flicker") && (
                <div className="space-y-3 pl-3 border-l-2 border-primary/30">
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Color</label>
                    <input
                      type="color"
                      value={form.textEffects.color ?? "#8b5cf6"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Speed</label>
                    <input
                      type="range"
                      min={0.5}
                      max={5}
                      step={0.1}
                      value={form.textEffects.speed ?? 2}
                      onChange={(e) => update("textEffects", { ...form.textEffects, speed: parseFloat(e.target.value) })}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {form.textEffects.speed ?? 2}s
                    </span>
                  </div>
                </div>
              )}

              {form.textEffects.type === "wave" && (
                <div className="space-y-3 pl-3 border-l-2 border-primary/30">
                  <div className="flex items-center gap-3">
                    <label className="text-xs lowercase text-muted-foreground w-20">Speed</label>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      step={0.5}
                      value={form.textEffects.speed ?? 3}
                      onChange={(e) => update("textEffects", { ...form.textEffects, speed: parseFloat(e.target.value) })}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {form.textEffects.speed ?? 3}s
                    </span>
                  </div>
                </div>
              )}

              <Field label="Bio Font Size">
                <div className="flex gap-2">
                  {BIO_SIZES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => update("bioFontSize", s.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.bioFontSize === s.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>
            </Section>

            {/* Layout */}
            <Section title="Layout">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {LAYOUT_OPTIONS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => update("layoutStyle", l.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.layoutStyle === l.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <p className="text-sm font-medium">{l.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {l.desc}
                    </p>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Style">
              <StylePanel value={form.customization} onChange={(v) => update("customization", v)} />
            </Section>

            <Section title="Profile Song">
              <ProfileSongPicker
                song={profileSong}
                onChange={setProfileSong}
                skin={form.customization.songSkin}
                onSkin={(v) => update("customization", { ...form.customization, songSkin: v })}
              />
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.autoplayProfileSong}
                  onChange={(e) => update("autoplayProfileSong", e.target.checked)}
                  className="h-4 w-4"
                />
                start playing when someone first clicks on my profile
              </label>
            </Section>

            <Section title="Mood & Extras">
              <ExtrasPanel value={form.customization} onChange={(v) => update("customization", v)} />
            </Section>

            <Section title="Top 8">
              <Top8Picker username={(session?.user as { username?: string })?.username ?? ""} onChange={setTop8} />
            </Section>

            <Section title="Custom CSS">
              <CssEditor value={form.customCSS} onChange={(v) => update("customCSS", v)} />
            </Section>

            {/* Favorites & Interests */}
            <Section title="Favorites & Interests">
              <TagInput
                label="Interests"
                placeholder="e.g. cats, programming, music..."
                tags={form.favorites.interests}
                onChange={(tags) => update("favorites", { ...form.favorites, interests: tags })}
                suggestions={INTEREST_SUGGESTIONS}
              />
              <TagInput
                label="Hobbies"
                placeholder="e.g. guitar, hiking, cooking..."
                tags={form.favorites.hobbies}
                onChange={(tags) => update("favorites", { ...form.favorites, hobbies: tags })}
                suggestions={HOBBY_SUGGESTIONS}
              />
              <SearchTagInput
                label="Favorite Books"
                placeholder="Search for a book title..."
                tags={form.favorites.books}
                onChange={(tags) => update("favorites", { ...form.favorites, books: tags })}
                searchEndpoint="/api/search/books"
              />
              <SearchTagInput
                label="Favorite Games"
                placeholder="Search for a game title..."
                tags={form.favorites.games}
                onChange={(tags) => update("favorites", { ...form.favorites, games: tags })}
                searchEndpoint="/api/search/games"
              />
            </Section>

            {/* Links */}
            <Section title="Links & Socials">
              <p className="text-xs text-muted-foreground -mt-2 mb-3">Add up to 20 links to your profile. Drag to reorder.</p>
              <div className="space-y-3">
                {links.map((link, index) => (
                  <div key={link.id ?? `new-${index}`} className="flex items-start gap-2 p-3 rounded-xl border border-border bg-muted/30">
                    <div className="pt-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={link.iconType}
                          onChange={(e) => {
                            const updated = [...links];
                            updated[index] = { ...updated[index], iconType: e.target.value };
                            setLinks(updated);
                          }}
                          className="input-field w-36 text-xs"
                        >
                          {LINK_ICON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => {
                            const updated = [...links];
                            updated[index] = { ...updated[index], title: e.target.value };
                            setLinks(updated);
                          }}
                          placeholder="Link title"
                          className="input-field flex-1 text-sm"
                        />
                      </div>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...links];
                          updated[index] = { ...updated[index], url: e.target.value };
                          setLinks(updated);
                        }}
                        placeholder="https://..."
                        className="input-field text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (link.id && !link.isNew) {
                          await fetch(`/api/users/me/links/${link.id}`, { method: "DELETE" });
                        }
                        setLinks(links.filter((_, i) => i !== index));
                      }}
                      className="pt-2 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {links.length < 20 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLinks([...links, { title: "", url: "", iconType: "globe", isNew: true }])}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Link
                </Button>
              )}
            </Section>
          </div>

          {/* Live preview: the real profile, rendered from the unsaved form */}
          <div className="hidden xl:block">
            <div className="sticky top-24">
              <h2 className="metro-header text-2xl text-muted-foreground mb-4">live preview</h2>
              {previewUser && <LivePreview user={previewUser} customization={form.customization} genres={[]} wall={EMPTY_WALL} viewerId={loadedUser?.id} />}
            </div>
          </div>
        </div>
      </div>

      {mobilePreview && previewUser && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background p-2 xl:hidden">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="metro-header text-2xl">preview</span>
            <Button variant="outline" onClick={() => setMobilePreview(false)}>Close</Button>
          </div>
          <LivePreview user={previewUser} customization={form.customization} genres={[]} wall={EMPTY_WALL} viewerId={loadedUser?.id} />
        </div>
      )}

      {/* Avatar crop editor modal */}
      {cropImage && (
        <ImageCropEditor
          imageSrc={cropImage}
          onComplete={(croppedUrl) => {
            update("profilePictureUrl", croppedUrl);
            setCropImage(null);
            toast.success("Avatar updated");
          }}
          onCancel={() => setCropImage(null)}
          aspectRatio={1}
          circular={true}
        />
      )}

      {/* Background crop editor modal */}
      {bgCropImage && (
        <ImageCropEditor
          imageSrc={bgCropImage}
          onComplete={handleBgCropComplete}
          onCancel={() => setBgCropImage(null)}
          aspectRatio={9 / 16}
          circular={false}
          outputWidth={1080}
          outputHeight={1920}
          title="Edit Background"
        />
      )}

      <style jsx global>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: var(--background);
          border: 2px solid var(--border);
          color: var(--foreground);
          font-size: 0.875rem;
        }
        /* Metro text box: the border takes the accent while focused */
        .input-field:focus {
          outline: none;
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="metro-header text-3xl mb-4">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm lowercase text-muted-foreground mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-border cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field flex-1 text-xs"
        />
      </div>
    </Field>
  );
}

function TagInput({
  label,
  placeholder,
  tags,
  onChange,
  suggestions,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = suggestions?.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !tags.includes(s)
  ).slice(0, 8) ?? [];

  const addTag = (value?: string) => {
    const v = (value ?? input).trim();
    if (!v) return;
    if (containsProfanity(v)) {
      toast.error("That contains inappropriate language");
      return;
    }
    if (!tags.includes(v)) {
      onChange([...tags, v]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative" ref={wrapperRef}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onFocus={() => input.length > 0 && setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={placeholder}
            className="input-field flex-1 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTag()}
            disabled={!input.trim()}
          >
            Add
          </Button>
        </div>
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full rounded-lg border border-border bg-background shadow-xl max-h-48 overflow-y-auto">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

interface SearchResult {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  year?: number | null;
  platforms?: string[];
}

function SearchTagInput({
  label,
  placeholder,
  tags,
  onChange,
  searchEndpoint,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  searchEndpoint: string;
}) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`${searchEndpoint}?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults(data.results ?? []);
          setShowDropdown(true);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      }, 400);
    },
    [searchEndpoint]
  );

  const addTag = (title: string) => {
    const v = title.trim();
    if (!v) return;
    if (containsProfanity(v)) {
      toast.error("That contains inappropriate language");
      return;
    }
    if (!tags.includes(v)) {
      onChange([...tags, v]);
    }
    setInput("");
    setResults([]);
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative" ref={wrapperRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                search(e.target.value);
              }}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(input);
                }
              }}
              placeholder={placeholder}
              className="input-field text-sm"
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTag(input)}
            disabled={!input.trim()}
          >
            Add
          </Button>
        </div>
        {showDropdown && results.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full rounded-lg border border-border bg-background shadow-xl max-h-64 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={`${r.title}-${i}`}
                type="button"
                onClick={() => addTag(r.title)}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-3"
              >
                {r.coverUrl ? (
                  <img
                    src={r.coverUrl}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0 bg-muted"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs flex-shrink-0">
                    ?
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.author && r.author}
                    {r.year && ` (${r.year})`}
                    {r.platforms && r.platforms.length > 0 && r.platforms.join(", ")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}
