"use client";

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

// Values the database fills in when someone hasn't customised their profile.
// Those profiles get the site's Metro look: its font, and the halftone
// backdrop showing through instead of a flat colour.
const DEFAULT_BG = "#0a0a0a";
const DEFAULT_FONTS = new Set(["Inter", "Space Grotesk"]);
const fontVar = (name: string | null | undefined) =>
  name && !DEFAULT_FONTS.has(name) ? `"${name}", var(--metro-font)` : "var(--metro-font)";

export function ProfileCanvas({ user, posts, isOwn }: Props) {
  const profile = user.profile;
  const layoutStyle = profile?.layoutStyle ?? "CLASSIC";
  const LayoutComponent = layouts[layoutStyle] ?? ClassicLayout;
  const background = profile?.backgroundColor ?? DEFAULT_BG;

  // CSS custom properties for theming
  const themeVars: React.CSSProperties & Record<string, string> = {
    "--profile-bg": background,
    "--profile-primary": profile?.primaryColor ?? "#8b5cf6",
    "--profile-secondary": profile?.secondaryColor ?? "#6d28d9",
    "--profile-accent": profile?.accentColor ?? "#a78bfa",
    "--profile-font": fontVar(profile?.fontFamily),
    "--profile-heading-font": fontVar(profile?.headingFont),
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        ...themeVars,
        fontFamily: "var(--profile-font)",
      }}
    >
      {/* Background layer */}
      <div className="fixed inset-0 -z-10">
        {/* Base color, unless it's the untouched default: then the site's
            halftone backdrop (rendered further back) shows through */}
        {background.toLowerCase() !== DEFAULT_BG && (
          <div className="absolute inset-0" style={{ backgroundColor: background }} />
        )}
        {/* Image / video on top, opacity controlled by user slider */}
        {profile?.backgroundImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${profile.backgroundImageUrl})`,
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

      {/* Content */}
      <div className="relative z-10 px-4 py-8 sm:px-6 sm:py-12">
        <LayoutComponent user={user} posts={posts} isOwn={isOwn} />
      </div>
    </div>
  );
}
