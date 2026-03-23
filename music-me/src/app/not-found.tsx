import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 px-4">
        <h1 className="text-6xl font-bold font-[family-name:var(--font-space-grotesk)] text-primary">
          404
        </h1>
        <p className="text-lg text-muted-foreground">
          This page doesn&apos;t exist. Maybe the beat dropped too hard.
        </p>
        <Link
          href="/feed"
          className="inline-block px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Back to Feed
        </Link>
      </div>
    </div>
  );
}
