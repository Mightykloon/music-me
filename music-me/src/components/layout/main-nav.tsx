"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, Bell, User, Library, Users, Palette, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { RemixdWordmark } from "@/components/remixd-wordmark";

interface MainNavProps {
  /** null for a guest (browsing without an account) */
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  className?: string;
}

// `also`: other paths that count as this section (the forum and messages
// live under community)
const navItems = [
  { href: "/feed", icon: Home, label: "home" },
  { href: "/discover", icon: Compass, label: "discover" },
  { href: "/community", icon: Users, label: "community", also: ["/forum", "/messages"] },
  { href: "/notifications", icon: Bell, label: "notifications", account: true },
  { href: "/my-music", icon: Library, label: "library", account: true },
];

const isActive = (pathname: string, href: string, also: string[] = []) =>
  [href, ...also].some((p) => pathname === p || pathname.startsWith(p + "/"));

// Windows Phone app-bar button: a circled icon that fills with the accent
const appBarButton = "metro-appbar-icon transition-colors hover:border-primary hover:bg-primary hover:text-white";

export function MainNav({ user, className }: MainNavProps) {
  const pathname = usePathname();
  const guest = !user;
  const username = (user as { username?: string } | null)?.username;
  const profileHref = username ? `/${username}` : "/settings/profile";

  return (
    <>
      {/* Desktop: a pivot header. The current page is white with an accent
          bar under it; the rest are grey. */}
      <header className={cn("fixed top-0 w-full z-50 bg-background hidden sm:block", className)}>
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/feed" aria-label="re:mixd home">
            <RemixdWordmark className="h-6 w-auto" />
          </Link>

          <div className="flex h-full items-stretch gap-1">
            {navItems.filter((item) => !(guest && item.account)).map((item) => {
              const active = isActive(pathname, item.href, item.also);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 px-3 text-[0.95rem] lowercase transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[3px]",
                    active ? "text-foreground after:bg-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 lg:hidden" aria-hidden />
                  <span className="sr-only lg:not-sr-only">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {guest ? (
            <div className="flex items-center gap-4">
              <Link href="/settings/appearance" aria-label="theme" className={appBarButton}>
                <Palette className="w-5 h-5" strokeWidth={1.75} />
              </Link>
              <Link href="/login" className="text-[0.95rem] lowercase text-muted-foreground hover:text-foreground">
                log in
              </Link>
              <Link href="/register" className="metro-button metro-button-accent min-h-[36px] px-4 text-sm lowercase">
                sign up
              </Link>
            </div>
          ) : (
          <div className="flex items-center gap-3">
            <Link href="/feed" aria-label="new post" className={appBarButton}>
              <PlusCircle className="w-5 h-5" strokeWidth={1.75} />
            </Link>
            <Link href={profileHref} aria-label="your profile" className={appBarButton}>
              <User className="w-5 h-5" strokeWidth={1.75} />
            </Link>
          </div>
          )}
        </nav>
      </header>

      {/* Mobile: a Windows Phone app bar of circled icons. Home sits in the
          middle, filled with the accent. */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-muted sm:hidden safe-bottom">
        <div className="flex items-center justify-around h-16">
          <Link href="/discover" aria-label="discover" className={mobileNavClass(pathname, "/discover")}>
            <Compass className="w-5 h-5" strokeWidth={1.75} />
          </Link>
          <Link href="/community" aria-label="community" className={mobileNavClass(pathname, "/community", ["/forum", "/messages"])}>
            <Users className="w-5 h-5" strokeWidth={1.75} />
          </Link>
          <Link href="/feed" aria-label="home" className="metro-appbar-icon border-primary bg-primary text-white">
            <Home className="w-5 h-5" strokeWidth={1.75} />
          </Link>
          {guest ? (
            <>
              <Link href="/settings/appearance" aria-label="theme" className={mobileNavClass(pathname, "/settings/appearance")}>
                <Palette className="w-5 h-5" strokeWidth={1.75} />
              </Link>
              <Link href="/register" aria-label="sign up" className={mobileNavClass(pathname, "/register")}>
                <UserPlus className="w-5 h-5" strokeWidth={1.75} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/my-music" aria-label="library" className={mobileNavClass(pathname, "/my-music")}>
                <Library className="w-5 h-5" strokeWidth={1.75} />
              </Link>
              <Link href={profileHref} aria-label="your profile" className={mobileNavClass(pathname, `/${username}`)}>
                <User className="w-5 h-5" strokeWidth={1.75} />
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

function mobileNavClass(pathname: string, href: string, also?: string[]) {
  return cn(
    "metro-appbar-icon transition-colors",
    isActive(pathname, href, also) ? "text-foreground" : "text-muted-foreground"
  );
}
