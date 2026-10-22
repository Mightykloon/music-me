import type { CSSProperties } from "react";

// Staff-assigned forum ranks (User.forumRank / forumRankColor). Users can't set
// these; they're shown wherever a name appears in the forum, search and profiles.

export interface Ranked {
  forumRank?: string | null;
  forumRankColor?: string | null;
}

// what each rank means, for the hover card; anything else gets the fallback
const RANK_INFO: Record<string, string> = {
  sysadmin: "Runs remixd's servers, security and moderation.",
  founder: "Started remixd and builds it.",
};

/** the colour a ranked user's name is drawn in, or nothing */
export function rankNameStyle(user: Ranked): CSSProperties | undefined {
  return user.forumRank && user.forumRankColor ? { color: user.forumRankColor } : undefined;
}

/** The rank chip, with a hover card explaining it. `size="xs"` for dense lists. */
export function RankBadge({ user, size = "sm", className = "" }: { user: Ranked; size?: "xs" | "sm"; className?: string }) {
  const rank = user.forumRank;
  if (!rank) return null;
  const color = user.forumRankColor ?? "var(--primary)";
  const info = RANK_INFO[rank.toLowerCase()] ?? "A staff rank on remixd.";
  return (
    <span className={`group/rank relative inline-flex align-middle ${className}`}>
      <span
        tabIndex={0}
        aria-label={`${rank}: ${info}`}
        className={`inline-block cursor-help font-bold uppercase leading-none tracking-widest outline-none ${
          size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"
        }`}
        style={{ color, border: `1px solid ${color}`, background: `color-mix(in srgb, ${color} 18%, transparent)` }}
      >
        {rank}
      </span>
      <span
        role="tooltip"
        // solid colours of its own: profile themes can make the site background transparent
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-52 -translate-x-1/2 border p-2.5 text-left font-sans text-xs normal-case tracking-normal opacity-0 shadow-lg transition-opacity group-hover/rank:opacity-100 group-focus-within/rank:opacity-100"
        style={{ borderColor: color, background: `color-mix(in srgb, ${color} 12%, #0a0a0a)`, color: "#e8e8e8" }}
      >
        <span className="block font-bold uppercase tracking-widest" style={{ color }}>
          {rank}
        </span>
        <span className="mt-1 block font-normal opacity-80">{info}</span>
        <span className="mt-1.5 block text-[10px] uppercase tracking-wider opacity-60">remixd staff</span>
      </span>
    </span>
  );
}
