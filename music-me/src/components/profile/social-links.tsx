"use client";

import {
  AppleLogo, BehanceLogo, DiscordLogo, FacebookLogo, GithubLogo, Globe, InstagramLogo, LinkedinLogo, MusicNotes,
  PatreonLogo, PinterestLogo, RedditLogo, SnapchatLogo, SoundcloudLogo, SpotifyLogo, ThreadsLogo, TiktokLogo,
  TwitchLogo, XLogo, YoutubeLogo, type Icon,
} from "@phosphor-icons/react";
import type { Customization } from "@/lib/profile/customization";

interface Brand {
  name: string;
  icon: Icon;
  color: string;
}

// recognised from the link itself, so people don't have to pick an icon
const BRANDS: { match: RegExp; brand: Brand }[] = [
  { match: /(^|\.)instagram\.com$/, brand: { name: "Instagram", icon: InstagramLogo, color: "#E4405F" } },
  { match: /(^|\.)(x|twitter)\.com$/, brand: { name: "X", icon: XLogo, color: "#e7e9ea" } },
  { match: /(^|\.)tiktok\.com$/, brand: { name: "TikTok", icon: TiktokLogo, color: "#ff2d6f" } },
  { match: /(^|\.)(youtube\.com|youtu\.be)$/, brand: { name: "YouTube", icon: YoutubeLogo, color: "#FF0033" } },
  { match: /(^|\.)spotify\.com$/, brand: { name: "Spotify", icon: SpotifyLogo, color: "#1DB954" } },
  { match: /(^|\.)music\.apple\.com$/, brand: { name: "Apple Music", icon: AppleLogo, color: "#FC3C44" } },
  { match: /(^|\.)soundcloud\.com$/, brand: { name: "SoundCloud", icon: SoundcloudLogo, color: "#FF5500" } },
  { match: /(^|\.)bandcamp\.com$/, brand: { name: "Bandcamp", icon: MusicNotes, color: "#1da0c3" } },
  { match: /(^|\.)(discord\.gg|discord\.com)$/, brand: { name: "Discord", icon: DiscordLogo, color: "#5865F2" } },
  { match: /(^|\.)twitch\.tv$/, brand: { name: "Twitch", icon: TwitchLogo, color: "#9146FF" } },
  { match: /(^|\.)github\.com$/, brand: { name: "GitHub", icon: GithubLogo, color: "#f0f6fc" } },
  { match: /(^|\.)linkedin\.com$/, brand: { name: "LinkedIn", icon: LinkedinLogo, color: "#0A66C2" } },
  { match: /(^|\.)reddit\.com$/, brand: { name: "Reddit", icon: RedditLogo, color: "#FF4500" } },
  { match: /(^|\.)threads\.net$/, brand: { name: "Threads", icon: ThreadsLogo, color: "#e7e9ea" } },
  { match: /(^|\.)pinterest\.com$/, brand: { name: "Pinterest", icon: PinterestLogo, color: "#E60023" } },
  { match: /(^|\.)snapchat\.com$/, brand: { name: "Snapchat", icon: SnapchatLogo, color: "#FFFC00" } },
  { match: /(^|\.)facebook\.com$/, brand: { name: "Facebook", icon: FacebookLogo, color: "#1877F2" } },
  { match: /(^|\.)patreon\.com$/, brand: { name: "Patreon", icon: PatreonLogo, color: "#F96854" } },
  { match: /(^|\.)behance\.net$/, brand: { name: "Behance", icon: BehanceLogo, color: "#1769FF" } },
];

export function brandFor(url: string): Brand {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const hit = BRANDS.find((b) => b.match.test(host));
    if (hit) return hit.brand;
    return { name: host, icon: Globe, color: "var(--profile-accent)" };
  } catch {
    return { name: "link", icon: Globe, color: "var(--profile-accent)" };
  }
}

export interface SocialLink {
  id: string;
  title: string;
  url: string;
}

/** The row of social links under the name: round icons or labelled badges. */
export function SocialLinks({ links, style }: { links: SocialLink[]; style: Customization["socialStyle"] }) {
  if (style === "off" || links.length === 0) return null;
  return (
    <div className="profile-socials mt-2 flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const brand = brandFor(link.url);
        const Glyph = brand.icon;
        return style === "badges" ? (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer me"
            className="profile-social-badge inline-flex items-center gap-1.5 border border-current/20 bg-black/25 px-2.5 py-1 text-xs font-medium transition-transform hover:-translate-y-0.5"
            style={{ borderColor: `color-mix(in srgb, ${brand.color} 45%, transparent)` }}
          >
            <Glyph weight="fill" className="h-3.5 w-3.5" style={{ color: brand.color }} aria-hidden />
            <span>{link.title || brand.name}</span>
          </a>
        ) : (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer me"
            title={link.title || brand.name}
            aria-label={link.title || brand.name}
            className="profile-social-icon flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] transition-transform hover:scale-110 hover:bg-white/[0.15]"
          >
            <Glyph weight="fill" className="h-4 w-4" style={{ color: brand.color }} aria-hidden />
          </a>
        );
      })}
    </div>
  );
}
