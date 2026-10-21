"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Paste a public Spotify / Apple Music / Deezer / YouTube playlist or album
// link to bring it into your library. No account connection needed.
export function ImportByLink() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/music/playlists/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Import failed.");
        return;
      }
      toast.success(`Imported "${data.name}" (${data.trackCount} songs)`);
      setUrl("");
      router.refresh();
    } catch {
      toast.error("Import failed. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 space-y-2">
      <label htmlFor="import-link" className="metro-header block text-2xl">
        import a playlist
      </label>
      <p className="text-sm text-muted-foreground">
        Paste a public playlist or album link from Spotify, Apple Music, Deezer or YouTube. No account needed.
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="import-link"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            className="w-full border-2 border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <button type="submit" disabled={busy || !url.trim()} className="metro-button metro-button-accent min-h-[40px] px-4 text-sm disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "import"}
        </button>
      </div>
    </form>
  );
}
