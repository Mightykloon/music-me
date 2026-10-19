import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-5 px-6">
        <h1 className="metro-header text-7xl sm:text-8xl">404</h1>
        <p className="text-lg text-muted-foreground">
          This page doesn&apos;t exist. Maybe the beat dropped too hard.
        </p>
        <Link href="/feed" className="metro-button">
          back to feed
        </Link>
      </div>
    </div>
  );
}
