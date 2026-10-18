"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <div className="max-w-4xl mx-auto flex gap-6 px-4 py-6">
      {/* Sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <h2 className="metro-header text-3xl mb-4">
          settings
        </h2>
        <nav className="space-y-1">
          {settingsNav.map((item) => {
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
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
