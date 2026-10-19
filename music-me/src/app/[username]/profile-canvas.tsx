"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClassicLayout } from "@/components/profile/layouts/classic-layout";
import { MinimalLayout } from "@/components/profile/layouts/minimal-layout";
import { BentoLayout } from "@/components/profile/layouts/bento-layout";
import { MagazineLayout } from "@/components/profile/layouts/magazine-layout";
import { MyspaceLayout } from "@/components/profile/layouts/myspace-layout";
import type { ProfileLayoutProps } from "@/components/profile/layouts/types";

type Props = ProfileLayoutProps;

const layouts: Record<string, React.ComponentType<ProfileLayoutProps>> = {
  CLASSIC: ClassicLayout,
  MINIMAL: MinimalLayout,
  BENTO: BentoLayout,
  MAGAZINE: MagazineLayout,
  MYSPACE: MyspaceLayout,
};

// Google Fonts link for custom profile fonts
const GOOGLE_FONTS_BASE = "https://fonts.googleapis.com/css2?display=swap&family=";

// Values the database fills in when someone hasn't customised their profile.
// Those profiles get the site's Metro look: its font, and the halftone
// backdrop showing through instead of a flat colour.
const DEFAULT_BG = "#0a0a0a";
const DEFAULT_FONTS = new Set(["Inter", "Space Grotesk"]);
const fontVar = (name: string | null | undefined) =>
  name && !DEFAULT_FONTS.has(name) ? `"${name}", var(--metro-font)` : "var(--metro-font)";

export function ProfileCanvas({ user, posts, isOwn, genres }: Props) {
  const profile = user.profile;
  const layoutStyle = profile?.layoutStyle ?? "CLASSIC";
  const LayoutComponent = layouts[layoutStyle] ?? ClassicLayout;
  const background = profile?.backgroundColor ?? DEFAULT_BG;

  const fontFamily = profile?.fontFamily || "Inter";
  const headingFont = profile?.headingFont || "Space Grotesk";

  // CSS custom properties for theming
  const themeVars: React.CSSProperties & Record<string, string> = {
    "--profile-bg": background,
    "--profile-primary": profile?.primaryColor ?? "#8b5cf6",
    "--profile-secondary": profile?.secondaryColor ?? "#6d28d9",
    "--profile-accent": profile?.accentColor ?? "#a78bfa",
    "--profile-font": fontVar(profile?.fontFamily),
    "--profile-heading-font": fontVar(profile?.headingFont),
  };

  // Build Google Fonts URLs for custom fonts
  const fontsToLoad = new Set<string>();
  if (fontFamily !== "Inter") fontsToLoad.add(fontFamily);
  if (headingFont !== "Space Grotesk" && headingFont !== fontFamily) fontsToLoad.add(headingFont);

  return (
    <div
      className="min-h-[100dvh] relative"
      style={{
        ...themeVars,
        fontFamily: "var(--profile-font)",
        backgroundColor: background.toLowerCase() !== DEFAULT_BG ? background : undefined,
      }}
    >
      {/* Load custom Google Fonts */}
      {fontsToLoad.size > 0 && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link
          rel="stylesheet"
          href={`${GOOGLE_FONTS_BASE}${Array.from(fontsToLoad).map(f => f.replace(/\s+/g, "+") + ":wght@300;400;500;600;700").join("&family=")}`}
        />
      )}

      {/* Background layer - fills entire viewport */}
      <div className="fixed inset-0 -z-10">
        {/* Base color, unless it's the untouched default: then the site's
            halftone backdrop (rendered further back) shows through */}
        {background.toLowerCase() !== DEFAULT_BG && (
          <div className="absolute inset-0" style={{ backgroundColor: background }} />
        )}
        {/* Image/video on top with user-controlled opacity */}
        {profile?.backgroundImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url("${profile.backgroundImageUrl}")`,
              opacity: profile.backgroundOpacity ?? 1,
            }}
          />
        ) : profile?.bannerVideoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: profile.backgroundOpacity ?? 0.3 }}
          >
            <source src={profile.bannerVideoUrl} type="video/mp4" />
          </video>
        ) : null}
      </div>

      {/* Discreet back button */}
      <Link
        href="/feed"
        className="fixed top-4 left-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm text-white/60 hover:text-white transition-all duration-200"
        title="Back to remixd"
      >
        <ArrowLeft className="w-4 h-4" />
      </Link>

      {/* Content */}
      <div className="relative z-10 px-4 pt-12 pb-20 sm:px-6 sm:pt-14 sm:pb-12">
        <LayoutComponent user={user} posts={posts} isOwn={isOwn} genres={genres} />
      </div>
    </div>
  );
}
