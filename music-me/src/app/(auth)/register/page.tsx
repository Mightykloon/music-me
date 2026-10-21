"use client";

import Link from "next/link";
import { RemixdWordmark } from "@/components/remixd-wordmark";
import { SocialSignIn } from "@/components/auth/social-sign-in";
import { ContinueAsGuest } from "@/components/auth/continue-as-guest";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // bot checks: when the form appeared, and a field only bots fill in
  const [startedAt] = useState(() => Date.now());
  const [company, setCompany] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      // Register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, company, startedAt }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created, but signing in failed. Try logging in.");
        setLoading(false);
        return;
      }

      router.push("/feed");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-4">
          <Link href="/" aria-label="re:mixd home" className="block w-fit">
            <RemixdWordmark className="h-9 w-auto" />
          </Link>
          <div>
            <h1 className="metro-header text-5xl">sign up</h1>
            <p className="mt-2 text-sm text-muted-foreground">Create your account.</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* hidden from people (and screen readers); bots fill every field */}
          <input
            type="text"
            name="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute -left-[9999px] h-px w-px opacity-0"
          />
          <div>
            <label htmlFor="email" className="block text-sm lowercase text-muted-foreground mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm lowercase text-muted-foreground mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="w-full pl-7 pr-3 py-2 bg-background border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                placeholder="yourname"
                minLength={3}
                maxLength={30}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm lowercase text-muted-foreground mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              placeholder="Min. 8 characters"
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="metro-button metro-button-accent w-full disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "creating account" : "create account"}
          </button>
        </form>

        <SocialSignIn />

        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>

        <ContinueAsGuest />
      </div>
    </div>
  );
}
