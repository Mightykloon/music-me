import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteBackdrop } from "@/components/site-backdrop";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Metro's typeface is Segoe, which can't be served on the web. Open Sans was
// drawn by the same designer (Steve Matteson) and is the closest free match;
// Windows visitors still get real Segoe UI first (see --metro-font).
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "remixd | your sound. your identity.",
    template: "%s | remixd",
  },
  description:
    "A social platform built around music, with customizable profiles, playlist imports, live lyrics, and a feed made to stop doomscrolling.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "remixd",
    description: "your sound. your identity.",
    siteName: "remixd",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-accent="violet"
      className={`${openSans.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* apply the visitor's saved theme + accent before first paint */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteBackdrop />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
