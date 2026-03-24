"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  PlusCircle,
  Bell,
  User,
  Library,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RemixdLogo } from "@/components/ui/remixd-logo";

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
  { href: "/feed", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/my-music", icon: Library, label: "Library" },
];

export function MainNav({ user, className }: MainNavProps) {
  const pathname = usePathname();
  const username = (user as { username?: string }).username;

  return (
    <>
      {/* Desktop top nav */}
      <header
        className={cn(
          "fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl hidden sm:block",
          className
        )}
      >
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/feed">
            <RemixdLogo height={22} />
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors", active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  <item.icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/feed" className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <PlusCircle className="w-5 h-5" />
            </Link>
            <Link href={username ? `/${username}` : "/settings/profile"} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <User className="w-5 h-5" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 w-full z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl sm:hidden safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <Link href="/feed" className={mobileNavClass(pathname, "/feed")}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </Link>
          <Link href="/discover" className={mobileNavClass(pathname, "/discover")}>
            <Compass className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Discover</span>
          </Link>
          <Link href="/feed" className="flex flex-col items-center justify-center -mt-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <PlusCircle className="w-6 h-6" />
            </span>
          </Link>
          <Link href="/community" className={mobileNavClass(pathname, "/community", ["/forum", "/messages"])}>
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Community</span>
          </Link>
          <Link href={username ? `/${username}` : "/settings/profile"} className={mobileNavClass(pathname, `/${username}`)}>
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

function mobileNavClass(pathname: string, href: string, additionalPaths?: string[]) {
  const active =
    pathname === href ||
    pathname.startsWith(href + "/") ||
    (additionalPaths?.some((p) => pathname === p || pathname.startsWith(p + "/")) ?? false);
  return cn(
    "flex flex-col items-center justify-center gap-0 min-w-[3rem] py-1 rounded-lg transition-colors",
    active ? "text-primary" : "text-muted-foreground"
  );
}
