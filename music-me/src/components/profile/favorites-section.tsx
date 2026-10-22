"use client";

import { useState } from "react";
import { Book, Gamepad2, Heart, Sparkles, Tag } from "lucide-react";

interface FavoritesData {
  books?: string[];
  games?: string[];
  hobbies?: string[];
  interests?: string[];
  /** cover image per book or game title */
  covers?: Record<string, string>;
}

interface FavoritesSectionProps {
  favorites: FavoritesData | null;
  className?: string;
  /** heading text; defaults to "About Me" */
  title?: string;
}

const tagSections = [
  { key: "interests" as const, label: "Interests", icon: Sparkles },
  { key: "hobbies" as const, label: "Hobbies", icon: Heart },
];
const shelfSections = [
  { key: "books" as const, label: "Favorite Books", icon: Book },
  { key: "games" as const, label: "Favorite Games", icon: Gamepad2 },
];

/** A cover, or a typeset stand-in when there's no image (or it fails to load). */
function Cover({ title, src }: { title: string; src?: string }) {
  const [url, setUrl] = useState(src);
  // Steam games without tall box art still have the wide header
  const fail = () => setUrl((u) => (u?.includes("library_600x900") ? u.replace("library_600x900", "header") : undefined));
  // an image that failed before React hydrated never fired onError
  const checkLoaded = (el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth === 0) queueMicrotask(fail);
  };
  return (
    <figure className="profile-cover group w-full" title={title}>
      <div className="relative aspect-[2/3] overflow-hidden border border-white/10 bg-[color-mix(in_srgb,var(--profile-primary)_14%,transparent)] shadow-md transition-transform group-hover:-translate-y-1 group-hover:rotate-[-1.5deg]">
        <span className="absolute inset-0 flex items-end p-2 text-[0.7rem] font-semibold leading-tight">{title}</span>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={checkLoaded}
            src={url}
            alt=""
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
            onError={fail}
          />
        )}
      </div>
      <figcaption className="mt-1.5 line-clamp-2 text-[0.7rem] leading-tight opacity-80">{title}</figcaption>
    </figure>
  );
}

export function FavoritesSection({ favorites, className, title = "About Me" }: FavoritesSectionProps) {
  if (!favorites) return null;
  const hasAny = [...tagSections, ...shelfSections].some((s) => favorites[s.key]?.length);
  if (!hasAny) return null;
  const covers = favorites.covers ?? {};

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-[var(--profile-primary)]" />
        <h2 className="profile-section-title text-sm font-semibold uppercase tracking-wider opacity-70">{title}</h2>
      </div>

      {tagSections.some((s) => favorites[s.key]?.length) && (
        <div className="mb-4 grid grid-cols-1 gap-3 @2xl:grid-cols-2">
          {tagSections.map((section) => {
            const items = favorites[section.key];
            if (!items?.length) return null;
            return (
              <div key={section.key}>
                <div className="mb-2 flex items-center gap-2">
                  <section.icon className="h-3.5 w-3.5 text-[var(--profile-primary)]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70">{section.label}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, i) => (
                    <span key={i} className="inline-flex items-center border border-[var(--profile-primary)]/20 bg-[var(--profile-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--profile-primary)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shelfSections.map((section) => {
        const items = favorites[section.key];
        if (!items?.length) return null;
        return (
          <div key={section.key} className="mb-4 last:mb-0">
            <div className="mb-2 flex items-center gap-2">
              <section.icon className="h-3.5 w-3.5 text-[var(--profile-primary)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70">{section.label}</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 @md:grid-cols-4 @2xl:grid-cols-5">
              {items.map((item) => (
                <Cover key={`${item}:${covers[item] ?? ""}`} title={item} src={covers[item]} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
