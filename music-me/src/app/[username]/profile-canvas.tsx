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

export function ProfileCanvas({ user, posts, isOwn }: Props) {
  const profile = user.profile;
  const layoutStyle = profile?.layoutStyle ?? "CLASSIC";
  const LayoutComponent = layouts[layoutStyle] ?? ClassicLayout;

  // CSS custom properties for theming
  const themeVars: React.CSSProperties & Record<string, string> = {
    "--profile-bg": profile?.backgroundColor ?? "#0a0a0a",
    "--profile-primary": profile?.primaryColor ?? "#8b5cf6",
    "--profile-secondary": profile?.secondaryColor ?? "#6d28d9",
    "--profile-accent": profile?.accentColor ?? "#a78bfa",
    "--profile-font": profile?.fontFamily
      ? `"${profile.fontFamily}", sans-serif`
      : '"Inter", sans-serif',
    "--profile-heading-font": profile?.headingFont
      ? `"${profile.headingFont}", sans-serif`
      : '"Space Grotesk", sans-serif',
  };

  return (
    <div
      className="min-h-[100dvh] relative"
      style={{
        ...themeVars,
        fontFamily: "var(--profile-font)",
        backgroundColor: profile?.backgroundColor ?? "#0a0a0a",
      }}
    >
      {/* Background layer - fills entire viewport */}
      <div className="fixed inset-0 -z-10" style={{ backgroundColor: profile?.backgroundColor ?? "#0a0a0a" }}>
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
        {(profile?.backgroundImageUrl || profile?.bannerVideoUrl) && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: profile?.backgroundColor ?? "#0a0a0a",
              opacity: 0.85,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 pt-4 pb-20 sm:px-6 sm:pt-8 sm:pb-12">
        <LayoutComponent user={user} posts={posts} isOwn={isOwn} />
      </div>
    </div>
  );
}
