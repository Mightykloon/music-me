"use client";

import Link from "next/link";
import { MessageSquare, ChevronRight } from "lucide-react";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  _count: { threads: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  children: SubCategory[];
  _count: { threads: number };
}

export function ForumHome({ categories }: { categories: Category[] }) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-4 py-6 border-b border-border/50">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
          Forum
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discuss music, share your work, discover indie artists
        </p>
      </div>

      {/* Categories */}
      <div className="divide-y divide-border/30">
        {categories.map((category) => (
          <div key={category.id} className="py-2">
            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="text-lg">{category.icon}</span>
              <h2
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: category.color ?? "#8b5cf6" }}
              >
                {category.name}
              </h2>
              {category.description && (
                <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                  — {category.description}
                </span>
              )}
            </div>

            {/* Sub-categories */}
            <div className="space-y-0.5 px-2">
              {category.children.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/forum/${sub.slug}`}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <span className="text-xl w-8 text-center flex-shrink-0">
                    {sub.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                      {sub.name}
                    </p>
                    {sub.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {sub.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex items-center gap-1 text-xs">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{sub._count.threads}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
