"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { JoinPrompt } from "@/components/auth/join-prompt";
import { User, Link2, Shield, Bell, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNav = [
  { href: "/settings/profile", icon: User, label: "profile" },
  { href: "/settings/connections", icon: Link2, label: "music connections" },
  { href: "/settings/account", icon: Shield, label: "account" },
  { href: "/settings/notifications", icon: Bell, label: "notifications" },
  { href: "/settings/appearance", icon: Palette, label: "appearance" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // guests can pick a theme (it's saved in the browser); everything else needs an account
  const guest = useSession().status === "unauthenticated";
  const nav = guest ? settingsNav.filter((item) => item.href === "/settings/appearance") : settingsNav;

  return (
    // the profile editor sits beside a live preview, so it gets the full width
    <div className={cn("mx-auto flex gap-6 px-4 py-6", pathname === "/settings/profile" ? "max-w-[100rem]" : "max-w-4xl")}>
      {/* Sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <h2 className="metro-header text-3xl mb-4">
          settings
        </h2>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-[0.95rem] lowercase transition-colors border-l-[3px]",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {guest && pathname !== "/settings/appearance" ? <JoinPrompt what="set up a profile and account" /> : children}
      </div>
    </div>
  );
}
