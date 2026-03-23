"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Link2, Shield, Bell, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNav = [
  { href: "/settings/profile", icon: User, label: "Profile" },
  { href: "/settings/connections", icon: Link2, label: "Music Connections" },
  { href: "/settings/account", icon: Shield, label: "Account" },
  { href: "/settings/notifications", icon: Bell, label: "Notifications" },
  { href: "/settings/appearance", icon: Palette, label: "Appearance" },
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
        <h2 className="text-lg font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
          Settings
        </h2>
        <nav className="space-y-1">
          {settingsNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
