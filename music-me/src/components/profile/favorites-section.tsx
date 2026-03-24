"use client";

import { Book, Gamepad2, Heart, Sparkles, Tag } from "lucide-react";

interface FavoritesData {
  books?: string[];
  games?: string[];
  hobbies?: string[];
  interests?: string[];
}

interface FavoritesSectionProps {
  favorites: FavoritesData | null;
  className?: string;
}

const sections = [
  { key: "interests" as const, label: "Interests", icon: Sparkles },
  { key: "hobbies" as const, label: "Hobbies", icon: Heart },
  { key: "books" as const, label: "Favorite Books", icon: Book },
  { key: "games" as const, label: "Favorite Games", icon: Gamepad2 },
];

export function FavoritesSection({ favorites, className }: FavoritesSectionProps) {
  if (!favorites) return null;
  const hasAny = sections.some((s) => favorites[s.key]?.length);
  if (!hasAny) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-[var(--profile-primary)]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">About Me</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((section) => {
          const items = favorites[section.key];
          if (!items?.length) return null;
          return (
            <div key={section.key} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[var(--profile-primary)]/20 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <section.icon className="w-3.5 h-3.5 text-[var(--profile-primary)]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--profile-primary)]/10 text-[var(--profile-primary)] border border-[var(--profile-primary)]/15">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
