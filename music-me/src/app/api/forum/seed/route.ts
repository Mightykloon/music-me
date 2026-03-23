import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const FORUM_CATEGORIES = [
  {
    name: "General Discussion",
    slug: "general",
    icon: "💬",
    color: "#8b5cf6",
    description: "Talk about anything music-related",
    children: [
      { name: "Introductions", slug: "introductions", icon: "👋", description: "New here? Say hi!" },
      { name: "Music News", slug: "music-news", icon: "📰", description: "Latest news from the music world" },
      { name: "Hot Takes", slug: "hot-takes", icon: "🔥", description: "Your spiciest music opinions" },
    ],
  },
  {
    name: "Genres",
    slug: "genres",
    icon: "🎵",
    color: "#ec4899",
    description: "Discuss your favorite genres",
    children: [
      { name: "Hip-Hop / Rap", slug: "hip-hop", icon: "🎤", description: "Bars, beats, and culture" },
      { name: "R&B / Soul", slug: "rnb-soul", icon: "💜", description: "Smooth vibes and vocal excellence" },
      { name: "Pop", slug: "pop", icon: "⭐", description: "Chart-toppers and pop perfection" },
      { name: "Rock / Alternative", slug: "rock", icon: "🎸", description: "Guitar-driven and beyond" },
      { name: "Electronic / EDM", slug: "electronic", icon: "🎛️", description: "Synths, drops, and dancefloors" },
      { name: "Indie / Underground", slug: "indie", icon: "🌙", description: "Hidden gems and rising artists" },
      { name: "Jazz / Blues", slug: "jazz-blues", icon: "🎷", description: "Improvisation and soul" },
      { name: "Classical", slug: "classical", icon: "🎻", description: "Orchestral and composed works" },
      { name: "Metal / Hardcore", slug: "metal", icon: "🤘", description: "Heavy riffs and breakdowns" },
      { name: "Country / Folk", slug: "country-folk", icon: "🤠", description: "Storytelling and roots" },
      { name: "Latin / Reggaeton", slug: "latin", icon: "💃", description: "Ritmos and global beats" },
      { name: "K-Pop / J-Pop", slug: "kpop-jpop", icon: "🇰🇷", description: "Asian pop culture" },
      { name: "Afrobeats / Amapiano", slug: "afrobeats", icon: "🌍", description: "African sounds taking over" },
      { name: "Punk / Ska", slug: "punk-ska", icon: "📌", description: "DIY and fast energy" },
      { name: "Lo-Fi / Chill", slug: "lofi-chill", icon: "☕", description: "Study beats and relaxation" },
    ],
  },
  {
    name: "Producers Corner",
    slug: "producers",
    icon: "🎹",
    color: "#f59e0b",
    description: "For beatmakers and producers",
    children: [
      { name: "Beat Showcases", slug: "beat-showcases", icon: "🥁", description: "Share your beats and instrumentals" },
      { name: "Production Tips", slug: "production-tips", icon: "💡", description: "Techniques, tutorials, and advice" },
      { name: "DAW Talk", slug: "daw-talk", icon: "🖥️", description: "FL Studio, Ableton, Logic, and more" },
      { name: "Mixing & Mastering", slug: "mixing-mastering", icon: "🎚️", description: "Get your sound right" },
      { name: "Sound Design", slug: "sound-design", icon: "🔊", description: "Synths, samples, and textures" },
      { name: "Collabs Wanted", slug: "collabs", icon: "🤝", description: "Find collaborators" },
    ],
  },
  {
    name: "Indie Submissions",
    slug: "indie-submissions",
    icon: "📻",
    color: "#10b981",
    description: "Submit and discover indie music with in-browser playback",
    children: [
      { name: "Original Songs", slug: "original-songs", icon: "🎙️", description: "Share your original music" },
      { name: "Remixes & Covers", slug: "remixes-covers", icon: "🔄", description: "Your take on existing tracks" },
      { name: "Feedback Requests", slug: "feedback-requests", icon: "📝", description: "Get constructive criticism" },
      { name: "Weekly Spotlight", slug: "weekly-spotlight", icon: "🌟", description: "Community-voted best submissions" },
    ],
  },
  {
    name: "Culture & Lifestyle",
    slug: "culture",
    icon: "🎨",
    color: "#06b6d4",
    description: "Music beyond the music",
    children: [
      { name: "Concerts & Festivals", slug: "concerts-festivals", icon: "🎪", description: "Live music experiences" },
      { name: "Vinyl & Physical Media", slug: "vinyl", icon: "📀", description: "Record collecting and physical releases" },
      { name: "Music History", slug: "music-history", icon: "📚", description: "The stories behind the sounds" },
      { name: "Gear & Equipment", slug: "gear", icon: "🎧", description: "Headphones, speakers, instruments" },
    ],
  },
];

export async function POST() {
  try {
    // Check if already seeded
    const existing = await db.forumCategory.count();
    if (existing > 0) {
      return NextResponse.json({ message: "Already seeded", count: existing });
    }

    for (const category of FORUM_CATEGORIES) {
      const parent = await db.forumCategory.create({
        data: {
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          color: category.color,
          description: category.description,
          sortOrder: FORUM_CATEGORIES.indexOf(category),
        },
      });

      if (category.children) {
        for (const [i, child] of category.children.entries()) {
          await db.forumCategory.create({
            data: {
              name: child.name,
              slug: child.slug,
              icon: child.icon,
              description: child.description,
              color: category.color,
              parentId: parent.id,
              sortOrder: i,
            },
          });
        }
      }
    }

    const count = await db.forumCategory.count();
    return NextResponse.json({ message: "Forum seeded", count });
  } catch {
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
