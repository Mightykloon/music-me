"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changingPassword) return;
    setChangingPassword(true);
    setMessage("");

    try {
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Failed to change password");
      } else {
        setMessage("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="metro-header text-5xl">
          account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and security.
        </p>
      </div>

      {/* Email */}
      <section className="space-y-3">
        <h2 className="metro-header text-2xl">email</h2>
        <p className="text-sm text-muted-foreground">
          {session?.user?.email ?? "Not set"}
        </p>
      </section>

      {/* Change Password */}
      <section className="space-y-3">
        <h2 className="metro-header text-2xl">change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full px-3 py-2 bg-background border-2 border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 8 characters)"
            minLength={8}
            className="w-full px-3 py-2 bg-background border-2 border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          {message && (
            <p
              className={`text-xs ${message.includes("success") ? "text-green-400" : "text-red-400"}`}
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={changingPassword || !currentPassword || !newPassword}
            className="metro-button metro-button-accent text-sm disabled:opacity-50"
          >
            {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="metro-header text-2xl text-destructive">danger zone</h2>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
        >
          Sign Out
        </button>
      </section>
    </div>
  );
}
