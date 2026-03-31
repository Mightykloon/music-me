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

const FONT_OPTIONS = [
  "Inter",
  "Space Grotesk",
  "JetBrains Mono",
  "Playfair Display",
  "Outfit",
  "Syne",
  "DM Sans",
  "Instrument Serif",
  "Bebas Neue",
  "system-ui",
];

const LAYOUT_OPTIONS = [
  { value: "CLASSIC", label: "Classic", desc: "Traditional top-to-bottom" },
  { value: "BENTO", label: "Bento", desc: "Grid card layout" },
  { value: "MINIMAL", label: "Minimal", desc: "Clean and centered" },
  { value: "MAGAZINE", label: "Magazine", desc: "Editorial two-column" },
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
  bioFontSize: string;
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
  bioFontSize: "base",
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
          bioFontSize: user.profile?.bioFontSize ?? "base",
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

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
            Edit Profile
          </h1>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor panel */}
          <div className="space-y-8">
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

              <div className="grid grid-cols-2 gap-4">
                <Field label="Body Font">
                  <select
                    value={form.fontFamily}
                    onChange={(e) => update("fontFamily", e.target.value)}
                    className="input-field"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Heading Font">
                  <select
                    value={form.headingFont}
                    onChange={(e) => update("headingFont", e.target.value)}
                    className="input-field"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

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
                    <label className="text-xs text-muted-foreground w-20">Color</label>
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
                      <label className="text-xs text-muted-foreground w-20">Brightness</label>
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
                    <label className="text-xs text-muted-foreground w-20">Start</label>
                    <input
                      type="color"
                      value={form.textEffects.color ?? "#8b5cf6"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <input type="text" value={form.textEffects.color ?? "#8b5cf6"} onChange={(e) => update("textEffects", { ...form.textEffects, color: e.target.value })} className="input-field flex-1 text-xs" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground w-20">Middle</label>
                    <input
                      type="color"
                      value={form.textEffects.color2 ?? "#ec4899"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color2: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <input type="text" value={form.textEffects.color2 ?? "#ec4899"} onChange={(e) => update("textEffects", { ...form.textEffects, color2: e.target.value })} className="input-field flex-1 text-xs" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground w-20">End</label>
                    <input
                      type="color"
                      value={form.textEffects.color3 ?? "#f59e0b"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color3: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <input type="text" value={form.textEffects.color3 ?? "#f59e0b"} onChange={(e) => update("textEffects", { ...form.textEffects, color3: e.target.value })} className="input-field flex-1 text-xs" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground w-20">Speed</label>
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
                    <label className="text-xs text-muted-foreground w-20">Speed</label>
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
                    <label className="text-xs text-muted-foreground w-20">Color 1</label>
                    <input
                      type="color"
                      value={form.textEffects.color ?? "#ff0000"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground w-20">Color 2</label>
                    <input
                      type="color"
                      value={form.textEffects.color2 ?? "#00ffff"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color2: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground w-20">Speed</label>
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
                    <label className="text-xs text-muted-foreground w-20">Color</label>
                    <input
                      type="color"
                      value={form.textEffects.color ?? "#8b5cf6"}
                      onChange={(e) => update("textEffects", { ...form.textEffects, color: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground w-20">Speed</label>
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
                    <label className="text-xs text-muted-foreground w-20">Speed</label>
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

          {/* Live preview panel */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                Live Preview
              </h2>
              <div
                className="rounded-2xl border border-border overflow-hidden"
                style={{
                  ["--profile-bg" as string]:
                    form.backgroundColor,
                  ["--profile-primary" as string]:
                    form.primaryColor,
                  ["--profile-secondary" as string]:
                    form.secondaryColor,
                  ["--profile-accent" as string]:
                    form.accentColor,
                  ["--profile-font" as string]: `"${form.fontFamily}", sans-serif`,
                  ["--profile-heading-font" as string]: `"${form.headingFont}", sans-serif`,
                  backgroundColor: form.backgroundColor,
                  fontFamily: `"${form.fontFamily}", sans-serif`,
                }}
              >
                <div className="p-6 min-h-[500px]">
                  {/* Preview banner */}
                  {form.bannerUrl && (
                    <div className="relative h-32 rounded-xl overflow-hidden mb-4 -mx-2 -mt-2">
                      <img
                        src={form.bannerUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Preview header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      src={form.profilePictureUrl || null}
                      alt={form.displayName || "Preview"}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-bold text-lg ${
                          form.textEffects.type
                            ? `text-effect-${form.textEffects.type}`
                            : ""
                        }`}
                        style={{
                          fontFamily: `"${form.headingFont}", sans-serif`,
                          ["--te-color" as string]: form.textEffects.color ?? "#8b5cf6",
                          ["--te-color2" as string]: form.textEffects.color2 ?? "#ec4899",
                          ["--te-color3" as string]: form.textEffects.color3 ?? "#f59e0b",
                          ["--te-speed" as string]: `${form.textEffects.speed ?? 4}s`,
                          ["--te-brightness" as string]: `${form.textEffects.brightness ?? 1}`,
                        }}
                        {...(form.textEffects.type === "glitch" ? { "data-text": form.displayName || "Your Name" } : {})}
                      >
                        {form.textEffects.type === "wave"
                          ? (form.displayName || "Your Name").split("").map((ch, i) => (
                              <span key={i} className="text-effect-wave-char" style={{ ["--char-index" as string]: i }}>
                                {ch === " " ? "\u00A0" : ch}
                              </span>
                            ))
                          : (form.displayName || "Your Name")}
                        {form.textEffects.displayEmoji && (
                          <span className="ml-1">{form.textEffects.displayEmoji}</span>
                        )}
                      </p>
                      <p className="text-xs opacity-60">
                        @
                        {(session?.user as { username?: string })?.username ??
                          "username"}
                        {form.pronouns && ` · ${form.pronouns}`}
                      </p>
                    </div>
                  </div>

                  {/* Preview bio */}
                  {form.bio && (
                    <p
                      className={`mt-2 opacity-80 ${
                        {
                          sm: "text-xs",
                          base: "text-sm",
                          lg: "text-base",
                          xl: "text-lg",
                        }[form.bioFontSize] ?? "text-sm"
                      }`}
                    >
                      {form.bio}
                    </p>
                  )}

                  {/* Preview meta */}
                  <div className="mt-3 flex gap-3 text-xs opacity-50">
                    {form.location && <span>{form.location}</span>}
                    {form.website && (
                      <span style={{ color: form.primaryColor }}>
                        {form.website.replace(/https?:\/\//, "")}
                      </span>
                    )}
                  </div>

                  {/* Preview layout label */}
                  <div
                    className="mt-6 p-3 rounded-lg text-center text-xs opacity-40 border border-dashed"
                    style={{ borderColor: form.primaryColor }}
                  >
                    {form.layoutStyle} layout
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          border-radius: 0.5rem;
          background: var(--muted);
          border: 1px solid var(--border);
          color: var(--foreground);
          font-size: 0.875rem;
        }
        .input-field:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--primary);
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
      <h2 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)] mb-4 pb-2 border-b border-border">
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
      <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
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
