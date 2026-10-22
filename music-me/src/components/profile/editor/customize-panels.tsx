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
  PROFILE_TEMPLATES,
  LAYOUTS,
  MOODS,
  SOCIAL_STYLES,
  TICKER_STYLES,
  TICKER_SPEEDS,
  BLOCK_TYPES,
  BLOCK_INFO,
  BLOCK_WIDTHS,
  BLOCK_HEIGHTS,
  MAX_BLOCKS,
  TRAILS,
  cursorCss,
  newBlock,
  readCustomization,
  type Block,
  type BlockType,
  type Customization,
  type ProfileTemplate,
} from "@/lib/profile/customization";
import type { ArrangeControls } from "@/components/profile/layouts/blocks-layout";
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

// ---------------------------------------------------------------- templates

const LAYOUT_LABEL = Object.fromEntries(LAYOUTS.map((l) => [l.id, l.label]));

/** Complete looks: colours, fonts, name effect, style and arrangement in one click. */
export function ProfileTemplates({ onApply }: { onApply: (t: ProfileTemplate) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-4">
      {PROFILE_TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onApply(t)}
          className="group border-2 border-border text-left transition-colors hover:border-primary"
        >
          {/* a tiny mock of the look: background, a "name" bar and two boxes in the theme colours */}
          <div className="relative h-16 overflow-hidden p-2" style={{ background: t.colors.backgroundColor }}>
            <div className="h-2.5 w-2/3" style={{ background: t.colors.primaryColor }} />
            <div className="mt-1 h-1.5 w-1/3 opacity-70" style={{ background: t.customization.textColor || "#ffffff" }} />
            <div className="absolute bottom-2 left-2 right-2 flex gap-1">
              <span className="h-4 flex-[2] border" style={{ borderColor: t.colors.secondaryColor }} />
              <span className="h-4 flex-1" style={{ background: t.colors.accentColor }} />
            </div>
          </div>
          <div className="p-2">
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.blurb}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground/70">{LAYOUT_LABEL[t.layout]}</p>
          </div>
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
        <Choices options={TRAILS} value={value.trail} onChange={(v) => set("trail", v)} names={TRAIL_NAMES} />
      </div>

      <div>
        <label className={label}>texture overlay</label>
        <Choices options={OVERLAYS} value={value.overlay} onChange={(v) => set("overlay", v)} />
        {value.overlay !== "none" && (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-muted-foreground">strength</span>
            <input
              type="range"
              min={0.03}
              max={0.6}
              step={0.01}
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
        <label className={label}>links under your name</label>
        <Choices options={SOCIAL_STYLES} value={value.socialStyle} onChange={(v) => set("socialStyle", v)} names={{ icons: "logo icons", badges: "labelled badges", off: "hide" }} />
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

const TRAIL_NAMES: Partial<Record<Customization["trail"], string>> = {
  sparkle: "sparkle (twinkles)",
  stars: "stars (fall)",
  hearts: "hearts (float up)",
  bubbles: "bubbles (pop)",
  pixels: "pixels (snake)",
  comet: "comet (streak)",
};

export function ExtrasPanel({ value, onChange, usingBlocks }: { value: Customization; onChange: (v: Customization) => void; usingBlocks: boolean }) {
  const set = <K extends keyof Customization>(k: K, v: Customization[K]) => onChange({ ...value, [k]: v });
  const preset = MOODS.find((m) => m.emoji === value.moodEmoji && m.text === value.moodText);
  const [customMood, setCustomMood] = useState(!!value.moodText && !preset);
  const toggle = (k: "showTop8" | "showWall" | "showCounter", text: string) => (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={value[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
      {text}
    </label>
  );
  return (
    <div className="space-y-6">
      <div>
        <label className={label}>mood (shows as a badge under your name)</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setCustomMood(false);
              onChange({ ...value, moodEmoji: "", moodText: "" });
            }}
            className={`border-2 px-2.5 py-1 text-sm ${!value.moodText && !customMood ? "border-primary bg-primary/15" : "border-border hover:border-muted-foreground"}`}
          >
            none
          </button>
          {MOODS.map((m) => (
            <button
              key={m.text}
              type="button"
              onClick={() => {
                setCustomMood(false);
                onChange({ ...value, moodEmoji: m.emoji, moodText: m.text });
              }}
              className={`border-2 px-2.5 py-1 text-sm ${preset === m && !customMood ? "border-primary bg-primary/15" : "border-border hover:border-muted-foreground"}`}
            >
              {m.emoji} {m.text}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomMood(true)}
            className={`border-2 px-2.5 py-1 text-sm ${customMood ? "border-primary bg-primary/15" : "border-border hover:border-muted-foreground"}`}
          >
            ✏️ custom…
          </button>
        </div>
        {customMood && (
          <div className="mt-2 space-y-2">
            <input
              value={value.moodText}
              onChange={(e) => set("moodText", e.target.value)}
              placeholder="how are you feeling?"
              maxLength={40}
              className="input-field"
            />
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(MOODS.map((m) => m.emoji))).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => set("moodEmoji", e)}
                  className={`h-8 w-8 border-2 text-base ${value.moodEmoji === e ? "border-primary" : "border-transparent hover:border-border"}`}
                  aria-label={`mood emoji ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className={label}>ticker (scrolls across the top of your profile)</label>
        <input value={value.marquee} onChange={(e) => set("marquee", e.target.value)} placeholder="thanks 4 the add ♥ new single out friday" maxLength={140} className="input-field" />
        {value.marquee && (
          <div className="mt-2 space-y-2">
            <Choices options={TICKER_STYLES} value={value.tickerStyle} onChange={(v) => set("tickerStyle", v)} names={{ led: "LED sign", tape: "caution tape" }} />
            <Choices options={TICKER_SPEEDS} value={value.tickerSpeed} onChange={(v) => set("tickerSpeed", v)} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className={label}>sections</label>
        {usingBlocks ? (
          <p className="text-xs text-muted-foreground">Your layout is made of blocks, so add or remove the Top 8 and comment wall as blocks.</p>
        ) : (
          <>
            {toggle("showTop8", "show my Top 8")}
            {value.showTop8 && (
              <input value={value.top8Title} onChange={(e) => set("top8Title", e.target.value)} placeholder="Top 8" maxLength={30} className="input-field ml-6 w-[calc(100%-1.5rem)]" />
            )}
          </>
        )}
        {toggle("showWall", usingBlocks ? "let people comment (for the comment wall block)" : "let people comment on my profile")}
        {toggle("showCounter", "show a visitor counter at the bottom")}
        {value.showCounter && (
          <div className="ml-6">
            <Choices options={COUNTER_STYLES} value={value.counterStyle} onChange={(v) => set("counterStyle", v)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- layout & blocks

/** Fixed layouts and block arrangements side by side; picking an arrangement loads its blocks. */
export function LayoutPicker({
  layoutStyle,
  blocks,
  onFixed,
  onBlocks,
}: {
  layoutStyle: string;
  blocks: Block[];
  onFixed: (id: string) => void;
  onBlocks: (blocks: Block[]) => void;
}) {
  const usingBlocks = blocks.length > 0;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {LAYOUTS.map((l) => {
        const active = l.blocks ? false : !usingBlocks && layoutStyle === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => (l.blocks ? onBlocks(l.blocks()) : onFixed(l.id))}
            className={`border-2 p-3 text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"}`}
          >
            <p className="text-sm font-medium">{l.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{l.desc}</p>
            {l.blocks && <p className="mt-1 text-[10px] uppercase tracking-wider text-primary">blocks · arrangeable</p>}
          </button>
        );
      })}
    </div>
  );
}

/** Add, edit and order blocks. The live preview's arrange mode does the dragging and resizing. */
export function BlocksPanel({
  blocks,
  selectedId,
  onSelect,
  onChange,
  onUploadImage,
}: {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (blocks: Block[]) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const selected = blocks.find((b) => b.id === selectedId) ?? null;
  const [uploading, setUploading] = useState(false);
  const patch = (change: Partial<Block>) => selected && onChange(blocks.map((b) => (b.id === selected.id ? { ...b, ...change } : b)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...blocks];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const add = (type: BlockType) => {
    if (blocks.length >= MAX_BLOCKS) return void toast.error(`Up to ${MAX_BLOCKS} blocks`);
    const b = newBlock(type);
    onChange([...blocks, b]);
    onSelect(b.id);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        In the live preview, turn on <strong>arrange</strong>: drag blocks by their handle to move them, drag a block&apos;s right edge to resize it,
        and click one to edit it here.
      </p>

      <div>
        <label className={label}>add a block</label>
        <div className="flex flex-wrap gap-1.5">
          {BLOCK_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => add(t)} title={BLOCK_INFO[t].hint} className="border-2 border-border px-2.5 py-1 text-xs hover:border-primary">
              + {BLOCK_INFO[t].label}
            </button>
          ))}
        </div>
      </div>

      <ol className="space-y-1">
        {blocks.map((b, i) => (
          <li
            key={b.id}
            className={`flex items-center gap-2 border-2 px-2 py-1 text-sm ${b.id === selectedId ? "border-primary bg-primary/10" : "border-border"}`}
          >
            <button type="button" onClick={() => onSelect(b.id)} className="min-w-0 flex-1 truncate text-left">
              {BLOCK_INFO[b.type].label}
              {b.title && <span className="text-muted-foreground"> · {b.title}</span>}
            </button>
            <span className="text-xs text-muted-foreground">{({ 2: "⅓", 3: "½", 4: "⅔", 6: "full" } as Record<number, string>)[b.w]}</span>
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30" aria-label="Move up">
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" disabled={i === blocks.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30" aria-label="Move down">
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(blocks.filter((x) => x.id !== b.id));
                if (b.id === selectedId) onSelect(null);
              }}
              className="p-1 hover:text-destructive"
              aria-label="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ol>

      {selected && (
        <div className="space-y-3 border-2 border-primary/40 p-3">
          <p className="text-sm font-semibold">{BLOCK_INFO[selected.type].label}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>width</label>
              <Choices
                options={BLOCK_WIDTHS.map(String) as unknown as readonly ("2" | "3" | "4" | "6")[]}
                value={String(selected.w) as "2" | "3" | "4" | "6"}
                onChange={(v) => patch({ w: Number(v) })}
                names={{ "2": "⅓", "3": "½", "4": "⅔", "6": "full" }}
              />
            </div>
            <div>
              <label className={label}>height</label>
              <Choices options={BLOCK_HEIGHTS} value={selected.h} onChange={(v) => patch({ h: v })} names={{ s: "small", m: "medium", l: "large" }} />
            </div>
          </div>
          {selected.type !== "spacer" && selected.type !== "header" && selected.type !== "song" && (
            <div>
              <label className={label}>{selected.type === "image" ? "caption" : "title"}</label>
              <input value={selected.title} onChange={(e) => patch({ title: e.target.value })} maxLength={60} className="input-field" placeholder={BLOCK_INFO[selected.type].label} />
            </div>
          )}
          {selected.type === "text" && (
            <div>
              <label className={label}>text</label>
              <textarea value={selected.text} onChange={(e) => patch({ text: e.target.value })} maxLength={2000} rows={5} className="input-field resize-y" />
            </div>
          )}
          {selected.type === "image" && (
            <div className="space-y-2">
              <label className={label}>image</label>
              <div className="flex gap-2">
                <input value={selected.src} onChange={(e) => patch({ src: e.target.value.trim() })} placeholder="https://..." className="input-field flex-1" />
                <label className="flex cursor-pointer items-center border-2 border-border px-3 text-sm hover:border-primary">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      setUploading(true);
                      try {
                        patch({ src: await onUploadImage(f) });
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Upload failed");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
              </div>
              {selected.src && !/^https:\/\//.test(selected.src) && <p className="text-xs text-destructive">Image links need to start with https://</p>}
            </div>
          )}
          {(selected.type === "image" || selected.type === "text") && (
            <div>
              <label className={label}>link (optional)</label>
              <input value={selected.href} onChange={(e) => patch({ href: e.target.value.trim() })} placeholder="https://..." className="input-field" />
            </div>
          )}
        </div>
      )}
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
  const [searched, setSearched] = useState("");
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
        if (!res.ok && data?.error) toast.error(data.error);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
        setSearched(term);
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
      {q.trim().length >= 2 && !searching && results.length === 0 && searched === q.trim() && (
        <p className="text-sm text-muted-foreground">No songs found for &quot;{searched}&quot;. Try the artist and title together.</p>
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
export function LivePreview(
  props: Omit<ProfileLayoutProps, "custom" | "isOwn" | "posts"> & {
    customization: unknown;
    posts?: ProfileLayoutProps["posts"];
    arrange?: ArrangeControls;
  }
) {
  const custom = readCustomization(props.customization);
  const [arranging, setArranging] = useState(false);
  const canArrange = !!props.arrange && custom.blocks.length > 0;
  return (
    <div>
      {canArrange && (
        <div className="mb-2 flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{arranging ? "drag, resize, click to edit" : "your blocks"}</span>
          <button
            type="button"
            onClick={() => setArranging((a) => !a)}
            className={`border-2 px-3 py-1 lowercase ${arranging ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
          >
            {arranging ? "done arranging" : "arrange"}
          </button>
        </div>
      )}
      <div className="relative h-[calc(100dvh-9rem)] overflow-hidden border-2 border-border" style={{ transform: "translateZ(0)" }}>
        <div className="h-full overflow-y-auto overscroll-contain">
          <ProfileCanvas
            {...props}
            posts={props.posts ?? []}
            isOwn
            custom={custom}
            preview
            arrange={canArrange && arranging ? props.arrange : undefined}
          />
        </div>
      </div>
    </div>
  );
}
