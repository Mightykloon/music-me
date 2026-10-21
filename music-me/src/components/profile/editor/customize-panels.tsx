"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, Loader2, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ProfileCanvas } from "@/app/[username]/profile-canvas";
import {
  CARD_STYLES,
  CORNERS,
  COUNTER_STYLES,
  CSS_HOOKS,
  CURSORS,
  FONT_GROUPS,
  FONT_NAME,
  MAX_CSS_LENGTH,
  OVERLAYS,
  SONG_SKINS,
  THEME_PRESETS,
  TRAILS,
  cursorCss,
  readCustomization,
  type Customization,
  type ThemePreset,
} from "@/lib/profile/customization";
import type { ProfileLayoutProps, Top8Friend } from "@/components/profile/layouts/types";
import type { TrackInfo } from "@/types";

// Pieces of the profile editor for the MySpace-style options. Each takes a
// value and an onChange, except the song and Top 8 pickers, which save
// straight away (they touch other tables).

const label = "block text-sm lowercase text-muted-foreground mb-1.5";

function Choices<T extends string>({
  options,
  value,
  onChange,
  names,
  render,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  names?: Partial<Record<T, string>>;
  render?: (v: T) => React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`flex items-center gap-1.5 border-2 px-3 py-1.5 text-sm lowercase transition-colors ${
            value === o ? "border-primary bg-primary/15" : "border-border hover:border-muted-foreground"
          }`}
        >
          {render?.(o)}
          {names?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- presets

export function ThemePresets({ onApply }: { onApply: (p: ThemePreset) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {THEME_PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onApply(p)}
          className="group border-2 border-border p-2 text-left transition-colors hover:border-primary"
        >
          <div className="flex h-10 overflow-hidden">
            {p.swatch.map((c) => (
              <span key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <p className="mt-1.5 text-sm font-semibold">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.blurb}</p>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- fonts

const ALL_LISTED = new Set(FONT_GROUPS.flatMap((g) => g.fonts));

export function FontPicker({ title, value, onChange }: { title: string; value: string; onChange: (v: string) => void }) {
  const isCustom = !ALL_LISTED.has(value);
  const [custom, setCustom] = useState(isCustom ? value : "");
  const [typing, setTyping] = useState(isCustom);
  const valid = FONT_NAME.test(custom.trim());

  return (
    <div>
      <label className={label}>{title}</label>
      <select
        value={typing ? "__custom" : value}
        onChange={(e) => {
          if (e.target.value === "__custom") return setTyping(true);
          setTyping(false);
          onChange(e.target.value);
        }}
        className="input-field"
        style={{ fontFamily: typing ? undefined : `"${value}", var(--metro-font)` }}
      >
        {FONT_GROUPS.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.fonts.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </optgroup>
        ))}
        <option value="__custom">any google font...</option>
      </select>
      {typing && (
        <div className="mt-2 flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. Rubik Glitch"
            className="input-field flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && valid) {
                e.preventDefault();
                onChange(custom.trim());
              }
            }}
          />
          <button type="button" disabled={!valid} onClick={() => onChange(custom.trim())} className="border-2 border-border px-3 text-sm disabled:opacity-40">
            use
          </button>
        </div>
      )}
      {typing && (
        <p className="mt-1 text-xs text-muted-foreground">
          Type the exact name from{" "}
          <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="underline">
            fonts.google.com
          </a>
          .
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- style

const CURSOR_NAMES: Partial<Record<Customization["cursor"], string>> = { default: "normal", pixel: "pixel arrow" };

export function StylePanel({ value, onChange }: { value: Customization; onChange: (v: Customization) => void }) {
  const set = <K extends keyof Customization>(k: K, v: Customization[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-5">
      <div>
        <label className={label}>cursor</label>
        <Choices
          options={CURSORS}
          value={value.cursor}
          onChange={(v) => set("cursor", v)}
          names={CURSOR_NAMES}
          render={(c) => <span className="inline-block h-4 w-4 border border-border/50" style={{ cursor: cursorCss({ ...value, cursor: c }) }} title="hover me" />}
        />
        {value.cursor === "custom" && (
          <input
            value={value.cursorUrl}
            onChange={(e) => set("cursorUrl", e.target.value)}
            placeholder="https://... (a small .png or .cur, 32x32 works best)"
            className="input-field mt-2"
          />
        )}
      </div>

      <div>
        <label className={label}>cursor trail</label>
        <Choices options={TRAILS} value={value.trail} onChange={(v) => set("trail", v)} />
      </div>

      <div>
        <label className={label}>texture overlay</label>
        <Choices options={OVERLAYS} value={value.overlay} onChange={(v) => set("overlay", v)} />
        {value.overlay !== "none" && (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-muted-foreground">strength</span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={value.overlayStrength}
              onChange={(e) => set("overlayStrength", parseFloat(e.target.value))}
              className="flex-1"
            />
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label}>box style</label>
          <Choices options={CARD_STYLES} value={value.cardStyle} onChange={(v) => set("cardStyle", v)} />
        </div>
        <div>
          <label className={label}>corners</label>
          <Choices options={CORNERS} value={value.corners} onChange={(v) => set("corners", v)} />
        </div>
      </div>

      <div>
        <label className={label}>text colour</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value.textColor || "#ffffff"}
            onChange={(e) => set("textColor", e.target.value)}
            className="h-8 w-8 cursor-pointer border border-border"
          />
          <span className="text-sm text-muted-foreground">{value.textColor || "site default"}</span>
          {value.textColor && (
            <button type="button" onClick={() => set("textColor", "")} className="text-xs underline">
              reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExtrasPanel({ value, onChange }: { value: Customization; onChange: (v: Customization) => void }) {
  const set = <K extends keyof Customization>(k: K, v: Customization[K]) => onChange({ ...value, [k]: v });
  const toggle = (k: "showTop8" | "showWall" | "showCounter", text: string) => (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={value[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
      {text}
    </label>
  );
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[4.5rem_1fr] gap-2">
        <div>
          <label className={label}>mood</label>
          <input value={value.moodEmoji} onChange={(e) => set("moodEmoji", e.target.value)} placeholder="🎧" maxLength={8} className="input-field text-center" />
        </div>
        <div>
          <label className={label}>&nbsp;</label>
          <input value={value.moodText} onChange={(e) => set("moodText", e.target.value)} placeholder="listening to the same song on repeat" maxLength={40} className="input-field" />
        </div>
      </div>

      <div>
        <label className={label}>scrolling marquee</label>
        <input value={value.marquee} onChange={(e) => set("marquee", e.target.value)} placeholder="thanks 4 the add ♥ pc4pc" maxLength={140} className="input-field" />
      </div>

      <div className="space-y-2">
        {toggle("showTop8", "show my Top 8")}
        {value.showTop8 && (
          <input value={value.top8Title} onChange={(e) => set("top8Title", e.target.value)} placeholder="Top 8" maxLength={30} className="input-field ml-6 w-[calc(100%-1.5rem)]" />
        )}
        {toggle("showWall", "let people comment on my profile")}
        {toggle("showCounter", "show a visitor counter")}
        {value.showCounter && (
          <div className="ml-6">
            <Choices options={COUNTER_STYLES} value={value.counterStyle} onChange={(v) => set("counterStyle", v)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- song

type SongResult = Omit<TrackInfo, "id"> & { id?: string };

export function ProfileSongPicker({
  song,
  onChange,
  skin,
  onSkin,
}: {
  song: TrackInfo | null;
  onChange: (s: TrackInfo | null) => void;
  skin: Customization["songSkin"];
  onSkin: (s: Customization["songSkin"]) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SongResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // search after a pause in typing, not on every key (each search is an outside API call)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(term)}&limit=8`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [q]);

  async function save(track: SongResult | null) {
    setSaving(track?.providerTrackId ?? "clear");
    try {
      const res = await fetch("/api/users/me/profile-song", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ track: track && { ...track, id: undefined } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(data.error ?? "Couldn't set that song.");
      onChange(data.song ?? null);
      setQ("");
      setResults([]);
      toast.success(track ? "Profile song set" : "Profile song removed");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      {song ? (
        <div className="flex items-center gap-3 border-2 border-border p-2">
          {song.albumArtUrl && <Image src={song.albumArtUrl} alt="" width={44} height={44} className="h-11 w-11 object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{song.title}</p>
            <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
          </div>
          <button type="button" onClick={() => save(null)} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Remove profile song">
            {saving === "clear" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No profile song yet.</p>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search for a song..." className="input-field !pl-9" />
        {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {q.trim().length >= 2 && results.length > 0 && (
        <ul className="max-h-64 divide-y divide-border overflow-y-auto border-2 border-border">
          {results.map((r) => (
            <li key={`${r.provider}:${r.providerTrackId}`}>
              <button type="button" onClick={() => save(r)} className="flex w-full items-center gap-3 p-2 text-left hover:bg-muted">
                {r.albumArtUrl && <Image src={r.albumArtUrl} alt="" width={36} height={36} className="h-9 w-9 object-cover" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{r.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.artist}</span>
                </span>
                {saving === r.providerTrackId && <Loader2 className="h-4 w-4 animate-spin" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <label className={label}>player skin</label>
        <Choices options={SONG_SKINS} value={skin} onChange={onSkin} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- top 8

export function Top8Picker({ username, onChange }: { username: string; onChange?: (f: Top8Friend[]) => void }) {
  const [friends, setFriends] = useState<Top8Friend[] | null>(null);
  const [picked, setPicked] = useState<Top8Friend[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/users/${username}/friends`).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/me/best-friends").then((r) => (r.ok ? r.json() : [])),
    ]).then(([all, top]) => {
      if (cancelled) return;
      setFriends(all);
      const current = (top as { id: string; username: string; displayName: string | null; profile: { profilePictureUrl: string | null } | null }[]).map((t) => ({
        id: t.id,
        username: t.username,
        displayName: t.displayName,
        profilePictureUrl: t.profile?.profilePictureUrl ?? null,
      }));
      setPicked(current);
      onChange?.(current);
    });
    return () => {
      cancelled = true;
    };
    // load once per user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const change = (next: Top8Friend[]) => {
    setPicked(next);
    setDirty(true);
    onChange?.(next);
  };
  const move = (i: number, d: -1 | 1) => {
    const next = [...picked];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    change(next);
  };

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/me/best-friends", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ friendIds: picked.map((p) => p.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(data.error ?? "Couldn't save your Top 8.");
      setDirty(false);
      toast.success("Top 8 saved");
    } finally {
      setSaving(false);
    }
  }

  if (friends === null) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  const pickedIds = new Set(picked.map((p) => p.id));
  const rest = friends.filter((f) => !pickedIds.has(f.id));

  return (
    <div className="space-y-4" id="top8">
      {friends.length === 0 ? (
        <p className="text-sm text-muted-foreground">Your Top 8 is picked from friends: people you follow who follow you back. None yet!</p>
      ) : (
        <>
          <ol className="space-y-1">
            {picked.map((f, i) => (
              <li key={f.id} className="flex items-center gap-2 border-2 border-border p-1.5">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                <Avatar src={f.profilePictureUrl} alt={f.displayName ?? f.username} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm">{f.displayName ?? f.username}</span>
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30" aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" disabled={i === picked.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30" aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => change(picked.filter((p) => p.id !== f.id))} className="p-1 hover:text-destructive" aria-label="Remove">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
            {picked.length === 0 && <li className="text-sm text-muted-foreground">Tap friends below to add them.</li>}
          </ol>
          {picked.length < 8 && rest.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {rest.map((f) => (
                <button key={f.id} type="button" onClick={() => change([...picked, f])} className="flex items-center gap-1.5 border-2 border-dashed border-border py-1 pl-1 pr-2 text-xs hover:border-primary">
                  <Avatar src={f.profilePictureUrl} alt={f.displayName ?? f.username} size="sm" className="!h-6 !w-6" />
                  {f.displayName ?? f.username}
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={save} disabled={!dirty || saving} className="metro-button metro-button-accent min-h-[36px] px-4 text-sm disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "save top 8"}
          </button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- css

const CSS_STARTER = `/* style anything on your profile. some ideas: */

.profile-name {
  letter-spacing: 0.05em;
  text-shadow: 3px 3px 0 var(--profile-secondary);
}

.profile-card {
  border-style: dashed;
}

.profile-avatar {
  animation: wobble 4s ease-in-out infinite;
}

@keyframes wobble {
  50% { rotate: -3deg; }
}
`;

export function CssEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const lines = useMemo(() => Math.max(12, value.split("\n").length + 1), [value]);

  const insert = (text: string) => {
    const el = ref.current;
    if (!el) return onChange(value + text);
    const { selectionStart: a, selectionEnd: b } = el;
    onChange(value.slice(0, a) + text + value.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = a + text.length;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex overflow-hidden border-2 border-border bg-black/40 font-mono text-[13px] leading-5 focus-within:border-primary">
        <div aria-hidden className="select-none border-r border-border/60 px-2 py-2 text-right text-muted-foreground/60">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              insert("  ");
            }
          }}
          spellCheck={false}
          wrap="off"
          rows={lines}
          maxLength={MAX_CSS_LENGTH}
          placeholder="/* your css here */"
          className="flex-1 resize-none overflow-x-auto bg-transparent p-2 text-[#e6e6e6] outline-none"
          aria-label="Custom CSS"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {value.length.toLocaleString()} / {MAX_CSS_LENGTH.toLocaleString()} characters. Changes show in the preview as you type.
        </span>
        {!value.trim() && (
          <button type="button" onClick={() => onChange(CSS_STARTER)} className="underline">
            start from an example
          </button>
        )}
      </div>
      <details className="border-2 border-border p-3 text-sm">
        <summary className="cursor-pointer lowercase">things you can style</summary>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {CSS_HOOKS.map((h) => (
            <li key={h.selector}>
              <button type="button" onClick={() => insert(`\n${h.selector} {\n  \n}\n`)} className="font-mono text-primary hover:underline">
                {h.selector}
              </button>{" "}
              <span className="text-muted-foreground">{h.what}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Colours from your theme are available as <code>var(--profile-primary)</code>, <code>--profile-secondary</code>, <code>--profile-accent</code> and{" "}
          <code>--profile-bg</code>. Images need https links. Your CSS only applies to your profile, and fixed positioning is turned into absolute so
          nothing can cover the site&apos;s menus.
        </p>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------- preview

/**
 * The real profile, rendered from the unsaved form. The transformed wrapper
 * gives `position: fixed` (backgrounds, overlays) the preview box as its
 * frame instead of the whole window.
 */
export function LivePreview(props: Omit<ProfileLayoutProps, "custom" | "isOwn" | "posts"> & { customization: unknown; posts?: ProfileLayoutProps["posts"] }) {
  const custom = readCustomization(props.customization);
  return (
    <div className="relative h-[calc(100dvh-9rem)] overflow-hidden border-2 border-border" style={{ transform: "translateZ(0)" }}>
      <div className="h-full overflow-y-auto overscroll-contain">
        <ProfileCanvas {...props} posts={props.posts ?? []} isOwn custom={custom} preview />
      </div>
    </div>
  );
}
