import Link from "next/link";
import { Music, Headphones, Radio, Palette } from "lucide-react";
import { RemixdLogo } from "@/components/ui/remixd-logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <RemixdLogo height={32} />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Glow effect behind title */}
          <div className="relative">
            <div className="absolute inset-0 blur-[100px] opacity-30 bg-gradient-to-r from-primary via-accent to-secondary rounded-full" />
            <div className="relative flex justify-center">
              <RemixdLogo height={120} className="sm:hidden" />
              <RemixdLogo height={180} className="hidden sm:block" />
            </div>
          </div>

          <p className="text-xl sm:text-2xl text-muted-foreground font-light tracking-wide">
            your sound. your identity.
          </p>

          <p className="text-base text-muted-foreground/80 max-w-lg mx-auto leading-relaxed">
            Build a profile that sounds like you. Import your playlists, share
            lyric cards, customize everything, and connect with listeners who get
            your vibe.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3 rounded-full border border-border text-foreground font-medium text-lg hover:bg-muted transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="max-w-4xl mx-auto mt-24 mb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={<Palette className="w-6 h-6" />}
            title="Custom profiles"
            description="Colors, fonts, layouts, vibes — make it yours."
          />
          <FeatureCard
            icon={<Music className="w-6 h-6" />}
            title="Playlist imports"
            description="Spotify, Apple Music, SoundCloud, and more."
          />
          <FeatureCard
            icon={<Headphones className="w-6 h-6" />}
            title="Live lyrics"
            description="Synced lyrics and shareable lyric cards."
          />
          <FeatureCard
            icon={<Radio className="w-6 h-6" />}
            title="Anti-doomscroll"
            description="Stream, grid, radio, or magazine — you choose."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <RemixdLogo height={22} />
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`group p-5 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all ${className ?? ""}`}
    >
      <div className="text-primary mb-3">{icon}</div>
      <h3 className="font-semibold font-[family-name:var(--font-space-grotesk)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
