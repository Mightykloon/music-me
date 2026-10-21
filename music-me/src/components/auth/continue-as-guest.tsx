"use client";

import { useRouter } from "next/navigation";
import { startGuestVisit } from "@/lib/guest";

/** "Just looking": browse the site without an account (see lib/guest.ts). */
export function ContinueAsGuest({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        startGuestVisit();
        router.push("/feed");
        router.refresh();
      }}
      className={`text-sm lowercase text-muted-foreground underline-offset-4 hover:text-foreground hover:underline ${className}`}
    >
      continue as guest →
    </button>
  );
}
