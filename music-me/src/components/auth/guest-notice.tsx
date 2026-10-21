"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";

// For guests: when something they tried (like, follow, comment, post...) is
// turned away for not being signed in, explain it instead of failing quietly.
// Watches the site's own API calls; reads are left alone.
export function GuestNotice() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const original = window.fetch;
    window.fetch = async (...args) => {
      const res = await original(...args);
      const req = args[0];
      const url = typeof req === "string" ? req : req instanceof URL ? req.href : req.url;
      const method = (args[1]?.method ?? (req instanceof Request ? req.method : "GET")).toUpperCase();
      const ours = url.startsWith("/api/") || url.startsWith(`${location.origin}/api/`);
      if (res.status === 401 && ours && method !== "GET" && !url.includes("/api/auth/")) {
        toast(
          () => (
            <span className="text-sm">
              That needs an account.{" "}
              <Link href="/register" className="font-semibold underline">
                Sign up
              </Link>{" "}
              or{" "}
              <Link href="/login" className="underline">
                log in
              </Link>
              .
            </span>
          ),
          { id: "guest-401" }
        );
      }
      return res;
    };
    return () => {
      window.fetch = original;
    };
  }, [status]);

  return null;
}
