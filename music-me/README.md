# music.me

A music-based social media platform where your taste is your identity. Share what you're listening to, customize your profile with your favorite tracks, connect with fellow music lovers, and discover new artists through community-driven forums.

Built with Next.js 16, React 19, Prisma, Tailwind CSS 4, and Neon serverless Postgres.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Music Providers](#music-providers)
- [Forum System](#forum-system)
- [Profile Customization](#profile-customization)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Authentication
- Email/password registration and login
- OAuth integration with Spotify and Google
- Secure session management via NextAuth v5
- Password hashing with bcrypt

### Feed & Posts
- Rich post composer with text, images, and music attachments
- Music search powered by iTunes Search API (no API key required)
- Poll creation with customizable options
- Music-specific reactions: Fire, Headphones, Encore, Skip, Heart, 100
- Nested comment threads with music attachments
- Repost support
- Visibility controls (public, followers-only, private)

### Customizable Profiles
- **5 layout styles**: Classic, Minimal, Bento, Magazine, and MySpace-inspired
- Profile song with autoplay option
- Vibe board for showcasing favorite tracks
- Custom colors (primary, secondary, accent, background)
- Banner image and background customization
- Bio with pronouns, location, and website
- Drag-and-drop link sections
- Synced lyrics display
- Playlist showcase from connected services

### Music Integration
- Connect up to 7 music services simultaneously
- Search across all connected providers with unified results
- iTunes Search API fallback for users without connected services
- Now Playing status broadcast
- Playlist sync and display
- Synced lyrics viewer
- Listening session support

### Social Features
- Follow/unfollow system
- Real-time notifications (follows, reactions, comments, reposts, mentions)
- Direct messaging with conversation threads
- User search with tabs for users, posts, and tracks
- Discover page for finding new people

### Forum
- XenForo-inspired forum with 37 pre-seeded genre categories
- 5 top-level sections: Genres, Production & Creation, Culture & Community, Platform, and Indie Spotlight
- Threaded discussions with nested replies
- In-browser audio player for indie music submissions
- Author sidebar with post counts and join date
- View counters and reply counts
- Pin and lock thread support
- Breadcrumb navigation

### Settings
- Profile editing (avatar, banner, background, bio, display name)
- Account management (password change, sign out)
- Appearance preferences
- Notification preferences
- Music service connections management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.2.1 (App Router, React Server Components) |
| **Runtime** | React 19.2.4, Node.js 22 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4, `tailwind-merge`, `clsx` |
| **Database** | PostgreSQL via Neon Serverless |
| **ORM** | Prisma 7.5 with `@prisma/adapter-neon` |
| **Auth** | NextAuth v5 (beta 30) with Prisma adapter |
| **State** | Zustand 5, React hooks |
| **Animation** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Fonts** | Geist Sans, Geist Mono, Space Grotesk (via `next/font`) |
| **Validation** | Zod 4 |
| **Image Processing** | Sharp, browser-image-compression |
| **Audio** | Native HTML5 audio, WaveSurfer.js |
| **Drag & Drop** | @dnd-kit |
| **Dates** | date-fns |
| **Cache** | Redis (ioredis) — optional |
| **Queue** | BullMQ — optional |
| **IDs** | nanoid, cuid |

---

## Architecture

```
Client (React 19 + Next.js App Router)
  |
  |-- Server Components (data fetching, SEO)
  |-- Client Components ("use client" for interactivity)
  |
  v
API Routes (/app/api/*)
  |
  |-- NextAuth session validation
  |-- Zod request validation
  |-- Prisma ORM queries
  |
  v
Neon Serverless Postgres
  |
  |-- @prisma/adapter-neon (WebSocket connection pooling)
  |-- 20+ models across users, posts, music, social, forum
```

Key architectural decisions:
- **Server Components by default** — pages fetch data on the server, pass serialized props to client components
- **Base64 data URLs for uploads** — images are stored as data URLs in the database (no S3 dependency for development)
- **iTunes API fallback** — music search works without any connected services or API keys
- **Optional Redis** — the app functions fully without Redis; errors are silently suppressed
- **Standalone output** — `next.config.ts` uses `output: "standalone"` for Docker deployment

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (22 recommended)
- **npm** 10+
- **PostgreSQL** — either:
  - [Neon](https://neon.tech) (free tier, recommended) — serverless, zero setup
  - Local Postgres via Docker (`docker-compose up -d postgres`)
  - Any PostgreSQL 14+ instance

### Environment Variables

Create a `.env.local` file in the `music-me/` directory:

```env
# Required
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
NEXTAUTH_SECRET="your-random-secret-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Encryption (for storing music service tokens)
ENCRYPTION_KEY="your-32-char-hex-encryption-key"

# OAuth (optional — app works without these)
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Music APIs (optional — iTunes fallback is always available)
LASTFM_API_KEY=""
LASTFM_SHARED_SECRET=""
DEEZER_APP_ID=""
DEEZER_APP_SECRET=""
APPLE_MUSIC_TEAM_ID=""
APPLE_MUSIC_KEY_ID=""
APPLE_MUSIC_PRIVATE_KEY=""
SOUNDCLOUD_CLIENT_ID=""
SOUNDCLOUD_CLIENT_SECRET=""
YOUTUBE_API_KEY=""

# Redis (optional — app works without Redis)
REDIS_URL="redis://localhost:6379"

# S3 Storage (optional — falls back to base64 data URLs)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
AWS_S3_BUCKET=""
```

Generate a `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Database Setup

**With Neon (recommended):**

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL` in `.env.local`
3. Push the schema:

```bash
DATABASE_URL="your-neon-connection-string" npx prisma db push
```

**With Docker:**

```bash
docker-compose up -d postgres
DATABASE_URL="postgresql://musicme:musicme@localhost:5432/musicme" npx prisma db push
```

**Seed forum categories:**

The forum auto-seeds 37 categories on first visit to `/forum`. Alternatively, call the seed endpoint:

```bash
curl -X POST http://localhost:3000/api/forum/seed
```

### Running Locally

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page. Register an account to access the full app.

---

## Project Structure

```
music-me/
├── prisma/
│   └── schema.prisma          # Database schema (20+ models)
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/             # Auth pages (login, register)
│   │   ├── (main)/             # Authenticated pages
│   │   │   ├── feed/           # Home feed
│   │   │   ├── discover/       # User discovery
│   │   │   ├── forum/          # Forum system
│   │   │   │   └── [slug]/     # Category & thread views
│   │   │   ├── messages/       # Direct messages
│   │   │   ├── notifications/  # Notification center
│   │   │   ├── search/         # Search (users, posts, tracks)
│   │   │   ├── sessions/       # Listening sessions
│   │   │   └── settings/       # User settings
│   │   │       ├── profile/
│   │   │       ├── account/
│   │   │       ├── appearance/
│   │   │       ├── connections/
│   │   │       └── notifications/
│   │   ├── [username]/         # Public profile pages
│   │   ├── post/[id]/          # Individual post view
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Auth endpoints
│   │   │   ├── feed/           # Feed endpoint
│   │   │   ├── forum/          # Forum CRUD
│   │   │   ├── messages/       # DM endpoints
│   │   │   ├── music/          # Music search, connections, lyrics
│   │   │   ├── notifications/  # Notification endpoints
│   │   │   ├── polls/          # Poll voting
│   │   │   ├── posts/          # Post CRUD, reactions, comments
│   │   │   ├── search/         # Search endpoint
│   │   │   ├── upload/         # File upload (presigned URLs)
│   │   │   └── users/          # User profiles, follow, password
│   │   ├── error.tsx           # Global error boundary
│   │   ├── not-found.tsx       # 404 page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── feed/               # Post composer, post card, feed container
│   │   ├── layout/             # Main navigation (desktop + mobile)
│   │   ├── music/              # Track search, embed player
│   │   ├── profile/            # Profile layouts, sections, components
│   │   │   └── layouts/        # 5 layout styles
│   │   ├── providers.tsx       # Session provider wrapper
│   │   └── ui/                 # Shared UI (avatar, button, skeleton)
│   ├── hooks/                  # Custom hooks (lyrics sync, upload)
│   ├── lib/
│   │   ├── auth/               # NextAuth config, session helpers
│   │   ├── db/                 # Prisma client setup (Neon adapter)
│   │   ├── music/              # Music service integrations
│   │   │   ├── providers/      # Spotify, Apple Music, YouTube, etc.
│   │   │   ├── free-search.ts  # iTunes API fallback
│   │   │   ├── search.ts       # Unified search across providers
│   │   │   └── types.ts        # Shared music types
│   │   ├── redis/              # Redis client (optional)
│   │   ├── storage/            # File storage abstraction
│   │   ├── store.ts            # Zustand stores
│   │   └── utils/              # Helpers (cn, encryption)
│   └── types/                  # Global TypeScript types
├── docker-compose.yml          # Postgres + Redis containers
├── Dockerfile                  # Multi-stage production build
├── next.config.ts              # Next.js config (standalone output)
├── tailwind.config.ts          # Tailwind CSS config
└── tsconfig.json               # TypeScript config
```

---

## Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with feature overview |
| `/login` | Login with email/password or OAuth |
| `/register` | Create a new account |
| `/feed` | Home feed with post composer |
| `/discover` | Discover new users to follow |
| `/search` | Search users, posts, and tracks |
| `/notifications` | Notification center |
| `/messages` | Direct message conversations |
| `/forum` | Forum home with category listing |
| `/forum/[slug]` | Category view with thread list |
| `/forum/[slug]/[threadId]` | Thread view with replies |
| `/[username]` | Public user profile |
| `/post/[id]` | Individual post detail |
| `/settings` | Settings hub |
| `/settings/profile` | Edit profile (avatar, banner, bio, colors, layout) |
| `/settings/account` | Change password, sign out |
| `/settings/appearance` | Theme preferences |
| `/settings/connections` | Manage music service connections |
| `/settings/notifications` | Notification preferences |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account (email, username, password) |
| `*` | `/api/auth/[...nextauth]` | NextAuth handlers (login, OAuth, session) |
| `GET` | `/api/auth/connect/[provider]` | Initiate music service OAuth |
| `GET` | `/api/auth/connect/[provider]/callback` | OAuth callback handler |

### Feed & Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/feed` | Get feed posts (paginated) |
| `POST` | `/api/posts` | Create a new post |
| `GET` | `/api/posts/[id]` | Get post by ID |
| `DELETE` | `/api/posts/[id]` | Delete a post |
| `POST` | `/api/posts/[id]/react` | Add/remove reaction |
| `GET/POST` | `/api/posts/[id]/comments` | Get/add comments |
| `POST` | `/api/polls/[id]/vote` | Vote on a poll |

### Music
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/music/search?q=...` | Search tracks (iTunes fallback) |
| `GET` | `/api/music/connections` | List connected services |
| `DELETE` | `/api/music/connections/[id]` | Disconnect a service |
| `POST` | `/api/music/connections/[id]/primary` | Set as primary service |
| `POST` | `/api/music/connections/[id]/sync` | Sync playlists |
| `GET` | `/api/music/lyrics?trackId=...` | Get synced lyrics |

### Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/[username]` | Get user profile |
| `GET` | `/api/users/[username]/posts` | Get user's posts |
| `GET` | `/api/users/[username]/playlists` | Get user's playlists |
| `POST/GET` | `/api/users/[username]/follow` | Follow/unfollow, check status |
| `PATCH` | `/api/users/me/profile` | Update own profile |
| `PATCH` | `/api/users/me/password` | Change password |
| `GET` | `/api/search?q=...&type=...` | Search users/posts/tracks |
| `GET/PATCH` | `/api/notifications` | Get/mark read notifications |
| `GET/POST` | `/api/messages` | List conversations / send message |
| `GET` | `/api/messages/[id]` | Get conversation messages |

### Forum
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/forum/categories` | List all categories |
| `POST` | `/api/forum/seed` | Seed default categories |
| `GET/POST` | `/api/forum/threads` | List/create threads |
| `GET` | `/api/forum/threads/[id]` | Get thread with replies |
| `POST` | `/api/forum/threads/[id]/replies` | Post a reply |

---

## Database Schema

The database consists of 20+ models organized into domains:

### Users & Auth
- **User** — Core user model with email, username, password hash, role (USER/CREATOR/ADMIN)
- **Account** — OAuth provider accounts (NextAuth)
- **AuthSession** — Active sessions
- **VerificationToken** — Email verification tokens
- **UserProfile** — Customization (layout, colors, fonts, profile song, vibe board, custom CSS)

### Music
- **MusicConnection** — Connected streaming services per user (Spotify, Apple Music, etc.)
- **MusicTrack** — Cached track metadata (title, artist, album art, preview URL, synced lyrics)
- **Playlist** — Synced playlists from connected services
- **PlaylistTrack** — Track positions within playlists
- **NowPlaying** — Currently playing track per user
- **ListeningSession** — Group listening sessions

### Content
- **Post** — Feed posts (text, image, video, poll, lyric card, playlist drop, now playing, repost)
- **Comment** — Nested comment threads on posts
- **Reaction** — Music-themed reactions (Fire, Headphones, Encore, Skip, Heart, 100)
- **Poll** / **PollOption** / **PollVote** — Poll system

### Social
- **Follow** — Follow relationships (follower/following)
- **Notification** — Activity notifications (follow, reaction, comment, repost, mention)
- **Conversation** / **DirectMessage** — Private messaging
- **Link** — Profile link sections

### Forum
- **ForumCategory** — Self-referential categories (parent/children for sections & subcategories)
- **ForumThread** — Discussion threads with optional audio attachments
- **ForumReply** — Nested replies with optional audio

---

## Music Providers

music.me supports connecting to multiple music streaming services simultaneously:

| Provider | Features | API Key Required |
|----------|----------|-----------------|
| **Spotify** | Auth, search, playlists, now playing, lyrics | Yes (OAuth) |
| **Apple Music** | Search, playlists | Yes (MusicKit) |
| **YouTube Music** | Search, playlists | Yes (YouTube Data API) |
| **Last.fm** | Scrobble history, listening stats | Yes (API key) |
| **Deezer** | Search, playlists, previews | Yes (OAuth) |
| **SoundCloud** | Search, playlists, tracks | Yes (OAuth) |
| **iTunes** | Search only (fallback) | **No** |

The iTunes Search API is always available as a fallback, so music search works out of the box with zero configuration.

---

## Forum System

The forum is inspired by XenForo with a music-first focus. It ships with 37 pre-seeded categories across 5 sections:

### Sections & Categories

**Genres** — Rock, Pop, Hip-Hop/Rap, R&B/Soul, Electronic/EDM, Jazz, Classical, Country, Metal, Punk, Indie, Latin, K-Pop/J-Pop, Folk/Acoustic, Blues, Reggae/Dancehall, World Music

**Production & Creation** — Music Production, Mixing & Mastering, Songwriting & Lyrics, Music Theory, Gear & Equipment, Software & Plugins

**Culture & Community** — Album Reviews, Concert & Festival Talk, Music News, Music History, Vinyl & Physical Media, Music Videos & Visuals

**Platform** — Introductions, Feedback & Suggestions, Off-Topic

**Indie Spotlight** — Submit Your Music, Collaboration Board, Remix Challenges

### Forum Features
- XenForo-style post layout with author sidebar (avatar, username, post count, join date)
- In-browser HTML5 audio player for indie music submissions
- Thread pinning and locking
- View count tracking
- Breadcrumb navigation
- New thread composer with optional audio attachment
- Mobile-responsive design

---

## Profile Customization

Users can choose from 5 profile layout styles:

| Layout | Description |
|--------|-------------|
| **Classic** | Traditional social profile with header, bio, and post grid |
| **Minimal** | Clean, typography-focused layout |
| **Bento** | Grid-based modular layout with draggable sections |
| **Magazine** | Editorial-style layout with featured content |
| **MySpace** | Retro-inspired layout with full customization (colors, background, profile song) |

All layouts support:
- Custom primary, secondary, and accent colors
- Profile song (plays on visit with autoplay toggle)
- Banner image
- Background image with opacity control
- Vibe board (curated track showcase)
- Playlist display from connected services
- Link sections
- Post grid

---

## Deployment

### Docker

Build and run with Docker:

```bash
# Build the image
docker build -t music-me .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-connection-string" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  music-me
```

### Docker Compose (development)

```bash
# Start Postgres + Redis
docker-compose up -d

# Set DATABASE_URL to local postgres
DATABASE_URL="postgresql://musicme:musicme@localhost:5432/musicme"
```

### Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables in project settings
4. Deploy — Vercel auto-detects Next.js

### Other Platforms

The app outputs a standalone Node.js server (`output: "standalone"` in `next.config.ts`), making it compatible with:
- Railway
- Render
- Fly.io
- AWS ECS/Fargate
- Any container hosting platform

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is private. All rights reserved.
