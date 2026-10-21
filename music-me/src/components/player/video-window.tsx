"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GripHorizontal, X } from "lucide-react";

// The floating window the YouTube player lives in. Drag it by its title bar,
// resize it from the bottom-right corner, close it with ×. Position and size
// are remembered per browser. YouTube's terms want the player at least
// 200px tall while it plays, so it never gets smaller than 356x200 (16:9).

const KEY = "remixd-video-window";
const MIN_W = 356;
const MAX_W = 960;
const BAR = 26; // title bar height
const GAP = 12;
const PLAYER_BAR = 76; // the site's player bar along the bottom

interface Box {
  x: number;
  y: number;
  w: number;
}

const heightFor = (w: number) => Math.round((w * 9) / 16) + BAR;

function clamp(b: Box): Box {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.max(Math.min(MIN_W, vw - 2 * GAP), Math.min(b.w, MAX_W, vw - 2 * GAP));
  const h = heightFor(w);
  return {
    w,
    x: Math.min(Math.max(GAP, b.x), Math.max(GAP, vw - w - GAP)),
    y: Math.min(Math.max(GAP, b.y), Math.max(GAP, vh - h - PLAYER_BAR)),
  };
}

function initialBox(): Box | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved && [saved.x, saved.y, saved.w].every((n) => typeof n === "number")) return clamp(saved);
  } catch {
    /* fall through to the default spot */
  }
  return null; // default: bottom-right, above the player bar
}

export function VideoWindow({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  // null = the default spot; the saved spot is read the first time the window
  // opens (not during render, so the server's HTML matches the browser's)
  const [box, setBox] = useState<Box | null>(null);
  const [busy, setBusy] = useState(false); // dragging or resizing
  const ref = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  useEffect(() => {
    if (!visible || restored.current) return;
    restored.current = true;
    const saved = initialBox();
    if (saved) requestAnimationFrame(() => setBox(saved));
  }, [visible]);

  const save = (b: Box) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(b));
    } catch {
      /* private mode */
    }
  };

  // keep it on screen when the window is resized
  useEffect(() => {
    const onResize = () => setBox((b) => (b ? clamp(b) : b));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /** Start a drag or resize from a pointer press; `apply` turns the pointer offset into a new box. */
  const track = useCallback((e: React.PointerEvent, apply: (start: Box, dx: number, dy: number) => Box) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const rect = ref.current!.getBoundingClientRect();
    const start: Box = { x: rect.left, y: rect.top, w: rect.width };
    const sx = e.clientX;
    const sy = e.clientY;
    let last = start;
    setBusy(true);
    const move = (ev: PointerEvent) => {
      last = clamp(apply(start, ev.clientX - sx, ev.clientY - sy));
      setBox(last);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setBusy(false);
      save(last);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, []);

  const w = box?.w ?? MIN_W;
  const style: React.CSSProperties = box
    ? { left: box.x, top: box.y, width: box.w }
    : { right: GAP, bottom: PLAYER_BAR, width: `min(${MIN_W}px, calc(100vw - ${2 * GAP}px))` };

  return (
    <div
      ref={ref}
      style={style}
      className={`fixed z-50 border border-border bg-background shadow-2xl ${visible ? "" : "hidden"}`}
      role="dialog"
      aria-label="YouTube player"
    >
      <div
        onPointerDown={(e) => track(e, (s, dx, dy) => ({ ...s, x: s.x + dx, y: s.y + dy }))}
        onDoubleClick={() => {
          setBox(null);
          try {
            localStorage.removeItem(KEY);
          } catch {
            /* ignore */
          }
        }}
        className="flex cursor-grab touch-none select-none items-center gap-2 px-2 text-[11px] text-muted-foreground active:cursor-grabbing"
        style={{ height: BAR }}
        title="Drag to move · double-click to put it back"
      >
        <GripHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">playing the full song from YouTube</span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="p-0.5 hover:text-foreground"
          aria-label="Close video (switches to the 30s preview)"
          title="Close video (switches to the 30s preview)"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative w-full" style={{ height: heightFor(w) - BAR }}>
        {children}
        {/* while dragging, the iframe would swallow the pointer; cover it */}
        {busy && <div className="absolute inset-0" />}
      </div>

      {/* resize handle */}
      <div
        // whichever way the corner moves further sets the size (the window keeps 16:9)
        onPointerDown={(e) => track(e, (s, dx, dy) => ({ ...s, w: s.w + Math.max(dx, (dy * 16) / 9) }))}
        className="absolute -bottom-1 -right-1 h-4 w-4 cursor-nwse-resize touch-none"
        aria-hidden
      >
        <span className="absolute bottom-1.5 right-1.5 h-2 w-2 border-b-2 border-r-2 border-muted-foreground" />
      </div>
    </div>
  );
}
