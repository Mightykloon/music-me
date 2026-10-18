"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-5 px-6">
        <h1 className="metro-header text-5xl sm:text-6xl">something went wrong</h1>
        <p className="text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <button onClick={reset} className="metro-button">
          try again
        </button>
      </div>
    </div>
  );
}
