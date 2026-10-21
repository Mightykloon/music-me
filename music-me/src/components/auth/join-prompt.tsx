import Link from "next/link";

/** Shown to guests in place of something that needs an account. */
export function JoinPrompt({ what, compact = false }: { what: string; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3 border-2 border-border p-3 text-sm">
        <span className="text-muted-foreground">Make an account to {what}.</span>
        <Link href="/register" className="metro-button metro-button-accent min-h-[34px] px-3 text-sm">
          sign up
        </Link>
        <Link href="/login" className="text-sm underline">
          log in
        </Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="metro-header text-4xl sm:text-5xl">join remixd</h1>
      <p className="mt-3 text-muted-foreground">
        You&apos;re looking around as a guest. Make an account to {what}.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/register" className="metro-button metro-button-accent min-h-[40px] px-5">
          sign up
        </Link>
        <Link href="/login" className="metro-button min-h-[40px] px-5">
          log in
        </Link>
        <Link href="/feed" className="text-sm text-muted-foreground underline">
          keep browsing
        </Link>
      </div>
    </div>
  );
}
