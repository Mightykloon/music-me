// Sample content for a development database, so the logged-in pages have
// something to show while designing. Adds rows only; never deletes.
//
//   node --env-file=.env.local scripts/seed-dev.mjs --yes
//
// Users it creates sign in with the password in SEED_USER_PASSWORD (from
// .env.local), or can't sign in at all if it's unset.
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

if (!process.argv.includes("--yes")) {
  console.error("Refusing to seed without --yes (this writes to DATABASE_URL).");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const hours = (h) => new Date(Date.now() - h * 3600_000);

const USERS = [
  { username: "kaito", displayName: "Kaito", bio: "city pop at 2am. vinyl hoarder.", location: "Osaka", primaryColor: "#1ba1e2" },
  { username: "noor", displayName: "Noor", bio: "producer, mostly drums. ask me about sample flips.", location: "London", primaryColor: "#f0a30a" },
  { username: "juniper", displayName: "Juniper", bio: "shoegaze and long walks. playlists for every weather.", location: "Portland", primaryColor: "#60a917" },
  { username: "mars", displayName: "Mars Vega", bio: "dj sets on fridays. house, garage, anything with a swing.", location: "Los Angeles", primaryColor: "#e51400" },
  { username: "ola", displayName: "Ola", bio: "afrobeats evangelist. headphones always on.", location: "Lagos", primaryColor: "#aa00ff" },
];

const TRACKS = [
  ["sp-1", "Plastic Love", "Mariya Takeuchi", "Variety"],
  ["sp-2", "Midnight Pretenders", "Tomoko Aran", "Fuyü-Kükan"],
  ["sp-3", "Only Shallow", "my bloody valentine", "Loveless"],
  ["sp-4", "Music Sounds Better with You", "Stardust", "Music Sounds Better with You"],
  ["sp-5", "Essence", "Wizkid", "Made in Lagos"],
  ["sp-6", "Windowlicker", "Aphex Twin", "Windowlicker"],
];

const POSTS = [
  ["kaito", 1, "NOW_PLAYING", "found a clean pressing of this today. the bassline on side A is unreal.", "sp-1"],
  ["noor", 3, "TEXT", "hot take: the best drums are the ones you almost can't hear. tell me i'm wrong."],
  ["juniper", 5, "NOW_PLAYING", "rainy morning, so obviously this.", "sp-3"],
  ["mars", 8, "TEXT", "friday set is locked. two hours, no skips, one very loud garage record at the end."],
  ["ola", 12, "NOW_PLAYING", "summer never actually ends if you keep playing this one.", "sp-5"],
  ["kaito", 20, "NOW_PLAYING", "late night drive soundtrack. no notes.", "sp-2"],
  ["noor", 26, "NOW_PLAYING", "still the strangest, best-sounding record i know.", "sp-6"],
  ["mars", 30, "NOW_PLAYING", "the filter sweep at 1:40 is the whole reason i dj.", "sp-4"],
  ["juniper", 40, "TEXT", "making a playlist called 'songs that sound like fog'. send suggestions."],
];

async function main() {
  const passwordHash = process.env.SEED_USER_PASSWORD ? await bcrypt.hash(process.env.SEED_USER_PASSWORD, 10) : null;

  const users = {};
  for (const u of USERS) {
    users[u.username] = await db.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        email: `${u.username}@example.com`,
        username: u.username,
        displayName: u.displayName,
        bio: u.bio,
        location: u.location,
        passwordHash,
        profile: { create: { primaryColor: u.primaryColor } },
      },
    });
  }

  const tester = process.env.TEST_USER_USERNAME && (await db.user.findUnique({ where: { username: process.env.TEST_USER_USERNAME } }));
  const everyone = [...Object.values(users), ...(tester ? [tester] : [])];
  // everyone follows everyone, so the "following" feed has content
  for (const a of everyone) for (const b of everyone) {
    if (a.id !== b.id) await db.follow.upsert({ where: { followerId_followingId: { followerId: a.id, followingId: b.id } }, update: {}, create: { followerId: a.id, followingId: b.id } });
  }

  const tracks = {};
  for (const [id, title, artist, album] of TRACKS) {
    tracks[id] = await db.musicTrack.upsert({
      where: { provider_providerTrackId: { provider: "SPOTIFY", providerTrackId: id } },
      update: {},
      create: { provider: "SPOTIFY", providerTrackId: id, title, artist, album },
    });
  }

  if ((await db.post.count({ where: { authorId: { in: Object.values(users).map((u) => u.id) } } })) === 0) {
    const reactions = ["FIRE", "HEADPHONES", "HEART", "ENCORE", "HUNDRED"];
    for (const [i, [who, ago, type, content, track]] of POSTS.entries()) {
      const post = await db.post.create({
        data: { authorId: users[who].id, type, content, attachedTrackId: track ? tracks[track].id : null, createdAt: hours(ago) },
      });
      // a few reactions and a comment from the others
      for (const [j, other] of everyone.filter((u) => u.id !== users[who].id).slice(0, 2 + (i % 3)).entries()) {
        await db.reaction.create({ data: { userId: other.id, postId: post.id, type: reactions[(i + j) % reactions.length] } });
      }
      const commenter = everyone[(i + 1) % everyone.length];
      if (commenter.id !== users[who].id) {
        await db.comment.create({ data: { postId: post.id, authorId: commenter.id, content: ["this is so good", "adding this right now", "the second half though", "you always find the best stuff"][i % 4], createdAt: hours(ago - 0.5) } });
      }
    }
  }

  // Threads and replies in the forum's built-in sub-forums (created by the
  // app on first visit to /forum). Skipped if the forum hasn't been set up yet
  // or already has threads.
  const FORUM = [
    // [sub-forum slug, author, hours ago, title, body, replies: [author, hours ago, text]]
    ["introductions", "ola", 30, "hey from lagos", "afrobeats evangelist, here to find new sounds.", [["kaito", 28, "welcome! drop your top three albums"], ["juniper", 6, "hi ola, love your playlists already"]]],
    ["hot-takes", "noor", 20, "the best drums are the quiet ones", "you feel them more than you hear them. fight me.", [["mars", 2, "strong disagree, i want the kick in my chest"]]],
    ["music-news", "kaito", 50, "city pop reissues keep coming", "three more pressings announced this month.", []],
    ["hip-hop", "mars", 12, "best sample flips of the year so far?", "looking for things that surprised you.", [["noor", 3, "the soul chop on that one single is unreal"]]],
    ["lofi-chill", "juniper", 9, "songs that sound like fog", "building a playlist. send suggestions.", [["kaito", 1, "anything off loveless, obviously"]]],
    ["electronic", "mars", 40, "friday set notes", "two hours, house into garage. tracklist inside.", []],
    ["production-tips", "noor", 15, "gentle compression on vocals", "what settings do you start from?", [["juniper", 4, "slow attack, fast release, barely any gain reduction"]]],
    ["daw-talk", "noor", 70, "ableton or fl for chopping samples?", "switching soon and torn.", [["mars", 60, "fl for speed, ableton for everything after"]]],
    ["original-songs", "juniper", 26, "first demo, be kind", "shoegaze thing recorded in my closet.", [["ola", 8, "the reverb tail at the end is gorgeous"]]],
    ["vinyl", "kaito", 5, "best record store finds this month", "share your hauls.", [["ola", 0.5, "found an original pressing for $8 today"]]],
    ["concerts-festivals", "ola", 48, "who's going to the summer festivals?", "making a list of sets to catch.", []],
  ];
  if ((await db.forumThread.count()) === 0) {
    for (const [slug, who, ago, title, content, replies] of FORUM) {
      const category = await db.forumCategory.findUnique({ where: { slug } });
      if (!category) continue;
      const last = replies.length ? Math.min(...replies.map((r) => r[1])) : ago;
      const thread = await db.forumThread.create({
        data: { categoryId: category.id, authorId: users[who].id, title, content, createdAt: hours(ago), lastReplyAt: hours(last) },
      });
      for (const [rWho, rAgo, text] of replies) {
        await db.forumReply.create({ data: { threadId: thread.id, authorId: users[rWho].id, content: text, createdAt: hours(rAgo) } });
      }
    }
  }

  console.log(`seeded ${USERS.length} users, ${TRACKS.length} tracks, ${POSTS.length} posts, ${FORUM.length} forum threads`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
