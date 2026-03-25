"use client";

import { BarChart3 } from "lucide-react";

interface GenreCount {
  genre: string;
  count: number;
}

interface GenreWidgetProps {
  genres: GenreCount[];
  className?: string;
}

const GENRE_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-500",
  "from-fuchsia-500 to-purple-500",
  "from-lime-500 to-green-500",
];

export function GenreWidget({ genres, className }: GenreWidgetProps) {
  if (!genres || genres.length === 0) return null;

  const maxCount = Math.max(...genres.map((g) => g.count));
  const total = genres.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[var(--profile-primary)]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-[family-name:var(--profile-heading-font,var(--font-space-grotesk))]">
          Top Genres
        </h2>
      </div>

      <div className="space-y-2.5">
        {genres.slice(0, 8).map((g, i) => {
          const pct = Math.round((g.count / total) * 100);
          const barPct = Math.max(8, Math.round((g.count / maxCount) * 100));
          return (
            <div key={g.genre} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium truncate capitalize">
                  {g.genre}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums ml-2 flex-shrink-0">
                  {pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${GENRE_COLORS[i % GENRE_COLORS.length]} transition-all duration-700 ease-out`}
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06]">
        <p className="text-[10px] text-muted-foreground text-center">
          Based on {total} tracks across {genres.length} genre{genres.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
