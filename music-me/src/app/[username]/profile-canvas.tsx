"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClassicLayout } from "@/components/profile/layouts/classic-layout";
import { MinimalLayout } from "@/components/profile/layouts/minimal-layout";
import { BentoLayout } from "@/components/profile/layouts/bento-layout";
import { MagazineLayout } from "@/components/profile/layouts/magazine-layout";
import { MyspaceLayout } from "@/components/profile/layouts/myspace-layout";
import { BlocksLayout, type ArrangeControls } from "@/components/profile/layouts/blocks-layout";
import { Marquee, VisitorCounter } from "@/components/profile/profile-extras";
import { CursorTrail, ProfileOverlay } from "@/components/profile/profile-effects";
import { SITE_DEFAULT_FONTS, buildProfileCss, cursorCss, googleFontHref } from "@/lib/profile/customization";
import type { ProfileLayoutProps } from "@/components/profile/layouts/types";

type Props = ProfileLayoutProps & {
  /** rendering inside the profile editor: no back button, no view counting */
  preview?: boolean;
  /** the editor's drag/resize controls for block layouts */
  arrange?: ArrangeControls;
};

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
const fontVar = (name: string | null | undefined) =>
  name && !SITE_DEFAULT_FONTS.has(name) ? `"${name}", var(--metro-font)` : "var(--metro-font)";

const RADIUS = { sharp: "0px", soft: "12px", round: "24px" } as const;

export function ProfileCanvas({ preview = false, arrange, ...props }: Props) {
  const { user, custom } = props;
  const profile = user.profile;
  const LayoutComponent = layouts[profile?.layoutStyle ?? "CLASSIC"] ?? ClassicLayout;
  const background = profile?.backgroundColor ?? DEFAULT_BG;
  const customBg = background.toLowerCase() !== DEFAULT_BG;
  const primary = profile?.primaryColor ?? "#8b5cf6";

  const themeVars: React.CSSProperties & Record<string, string> = {
    "--profile-bg": background,
    "--profile-primary": primary,
    "--profile-secondary": profile?.secondaryColor ?? "#6d28d9",
    "--profile-accent": profile?.accentColor ?? "#a78bfa",
    "--profile-font": fontVar(profile?.fontFamily),
    "--profile-heading-font": fontVar(profile?.headingFont),
    "--profile-radius": RADIUS[custom.corners],
  };
  if (custom.textColor) themeVars["--profile-text"] = custom.textColor;

  const fontHref = googleFontHref([profile?.fontFamily, profile?.headingFont]);
  const userCss = buildProfileCss(profile?.customCSS);

  return (
    <div
      className="profile-root min-h-[100dvh] relative isolate"
      data-card={custom.cardStyle}
      data-layout={profile?.layoutStyle ?? "CLASSIC"}
      style={{
        ...themeVars,
        fontFamily: "var(--profile-font)",
        // body weight shifts every weight on the profile (see profile.css)
        ["--weight-shift" as string]: String((Number(profile?.fontWeight) || 400) - 400),
        color: custom.textColor || undefined,
        cursor: cursorCss(custom),
        backgroundColor: customBg ? background : undefined,
      }}
    >
      {fontHref && (
        <link rel="stylesheet" href={fontHref} />
      )}
      {userCss && <style>{userCss}</style>}

      {/* Background layer - fills entire viewport */}
      <div className="profile-background fixed inset-0 -z-10">
        {/* Base color, unless it's the untouched default: then the site's
            halftone backdrop (rendered further back) shows through */}
        {customBg && <div className="absolute inset-0" style={{ backgroundColor: background }} />}
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

      <ProfileOverlay overlay={custom.overlay} strength={custom.overlayStrength} />
      <CursorTrail trail={custom.trail} color={primary} />

      {!preview && (
        <Link
          href="/feed"
          className="fixed top-4 left-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm text-white/60 hover:text-white transition-all duration-200"
          title="Back to remixd"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      )}

      <div className="@container relative z-10 px-4 pt-12 pb-20 sm:px-6 sm:pt-14 sm:pb-12">
        <div className="mx-auto max-w-5xl">
          <Marquee custom={custom} />
        </div>
        {custom.blocks.length > 0 ? <BlocksLayout {...props} arrange={arrange} /> : <LayoutComponent {...props} />}
        {custom.showCounter && (
          <div className="mt-8">
            <VisitorCounter username={user.username} initial={profile?.profileViews ?? 0} style={custom.counterStyle} track={!preview} />
          </div>
        )}
      </div>
    </div>
  );
}
