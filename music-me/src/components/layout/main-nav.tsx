"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  PlusCircle,
  MessageCircle,
  Bell,
  User,
  Search,
  MessageSquareText,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RemixdWordmark } from "@/components/remixd-wordmark";

interface MainNavProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  className?: string;
}

const navItems = [
  { href: "/feed", icon: Home, label: "home" },
  { href: "/discover", icon: Compass, label: "discover" },
  { href: "/my-music", icon: Library, label: "my music" },
  { href: "/forum", icon: MessageSquareText, label: "forum" },
  { href: "/search", icon: Search, label: "search" },
  { href: "/notifications", icon: Bell, label: "notifications" },
  { href: "/messages", icon: MessageCircle, label: "messages" },
];

// Windows Phone app-bar button: a circled icon that fills with the accent
const appBarButton = "metro-appbar-icon transition-colors hover:border-primary hover:bg-primary hover:text-white";

export function MainNav({ user, className }: MainNavProps) {
  const pathname = usePathname();
  const username = (user as { username?: string }).username;
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
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
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

          <div className="flex items-center gap-3">
            <Link href="/feed" aria-label="new post" className={appBarButton}>
              <PlusCircle className="w-5 h-5" strokeWidth={1.75} />
            </Link>
            <Link href={profileHref} aria-label="your profile" className={appBarButton}>
              <User className="w-5 h-5" strokeWidth={1.75} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile: a Windows Phone app bar of circled icons */}
      <nav className="fixed bottom-0 w-full z-50 bg-muted sm:hidden">
        <div className="flex items-center justify-around h-16">
          <Link href="/feed" aria-label="home" className={mobileNavClass(pathname, "/feed")}>
            <Home className="w-5 h-5" strokeWidth={1.75} />
          </Link>
          <Link href="/discover" aria-label="discover" className={mobileNavClass(pathname, "/discover")}>
            <Compass className="w-5 h-5" strokeWidth={1.75} />
          </Link>
          <Link href="/feed" aria-label="new post" className="metro-appbar-icon border-primary bg-primary text-white">
            <PlusCircle className="w-5 h-5" strokeWidth={1.75} />
          </Link>
          <Link href="/messages" aria-label="messages" className={mobileNavClass(pathname, "/messages")}>
            <MessageCircle className="w-5 h-5" strokeWidth={1.75} />
          </Link>
          <Link href={profileHref} aria-label="your profile" className={mobileNavClass(pathname, `/${username}`)}>
            <User className="w-5 h-5" strokeWidth={1.75} />
          </Link>
        </div>
      </nav>
    </>
  );
}

function mobileNavClass(pathname: string, href: string) {
  const active = pathname === href || pathname.startsWith(href + "/");
  return cn("metro-appbar-icon transition-colors", active ? "text-foreground" : "text-muted-foreground");
}
