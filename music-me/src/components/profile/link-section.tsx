"use client";

import {
  ExternalLink,
  Globe,
  Twitter,
  Instagram,
  Youtube,
  Github,
  Music,
} from "lucide-react";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconType: string | null;
  clickCount: number;
}

interface LinkSectionProps {
  links: LinkItem[];
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  github: Github,
  music: Music,
  globe: Globe,
};

export function LinkSection({ links, className }: LinkSectionProps) {
  if (links.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold font-[family-name:var(--profile-heading-font)] mb-3">
        Links
      </h2>
      <div className="flex flex-col gap-2">
        {links.map((link) => {
          const Icon = iconMap[link.iconType ?? ""] ?? ExternalLink;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm hover:bg-white/5 hover:border-[var(--profile-primary)]/30 transition-all group"
            >
              <Icon className="w-4 h-4 text-[var(--profile-primary)]" />
              <span className="flex-1 text-sm font-medium">{link.title}</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
