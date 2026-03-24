"use client";

import { ExternalLink, Globe, Twitter, Instagram, Youtube, Github, Music, Link2 } from "lucide-react";

interface LinkItem { id: string; title: string; url: string; iconType: string | null; clickCount: number }
interface LinkSectionProps { links: LinkItem[]; className?: string }

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter, instagram: Instagram, youtube: Youtube, github: Github, music: Music, globe: Globe,
};

export function LinkSection({ links, className }: LinkSectionProps) {
  if (links.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-4 h-4 text-[var(--profile-primary)]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Links</h2>
      </div>
      <div className="flex flex-col gap-2">
        {links.map((link) => {
          const Icon = iconMap[link.iconType ?? ""] ?? ExternalLink;
          return (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--profile-primary)]/20 transition-all duration-300 group">
              <div className="w-8 h-8 rounded-lg bg-[var(--profile-primary)]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[var(--profile-primary)]" />
              </div>
              <span className="flex-1 text-sm font-medium">{link.title}</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
