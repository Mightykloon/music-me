"use client";

import { useState, useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  ImagePlus,
  Music,
  X,
  Loader2,
  Search,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  Minus,
} from "lucide-react";
import Image from "next/image";
import type { MusicTrackResult } from "@/lib/music/types";

interface ForumEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  mediaUrls: string[];
  onMediaUrlsChange: (urls: string[]) => void;
  audioUrl: string;
  onAudioUrlChange: (url: string) => void;
  audioTitle: string;
  onAudioTitleChange: (title: string) => void;
}

type ToolbarAction = {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  separator?: false;
} | { separator: true };

export function ForumEditor({
  value,
  onChange,
  placeholder = "Write your post...",
  rows = 6,
  maxLength = 10000,
  mediaUrls,
  onMediaUrlsChange,
  audioUrl,
  onAudioUrlChange,
  audioTitle,
  onAudioTitleChange,
}: ForumEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [showAudioPanel, setShowAudioPanel] = useState(!!audioUrl);
  const [uploadingImage, setUploadingImage] = useState(false);

  const insertTag = useCallback(
    (openTag: string, closeTag: string, defaultText = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const text = selected || defaultText;
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = `${before}${openTag}${text}${closeTag}${after}`;
      onChange(newValue);
      // Set cursor position after update
      setTimeout(() => {
        textarea.focus();
        const cursorPos = selected
          ? start + openTag.length + text.length + closeTag.length
          : start + openTag.length;
        textarea.setSelectionRange(
          selected ? cursorPos : cursorPos,
          selected ? cursorPos : cursorPos + defaultText.length
        );
      }, 0);
    },
    [value, onChange]
  );

  const insertText = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const before = value.substring(0, start);
      const after = value.substring(textarea.selectionEnd);
      onChange(`${before}${text}${after}`);
      setTimeout(() => {
        textarea.focus();
        const pos = start + text.length;
        textarea.setSelectionRange(pos, pos);
      }, 0);
    },
    [value, onChange]
  );

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const display = linkText.trim() || linkUrl.trim();
    insertText(`[url=${linkUrl.trim()}]${display}[/url]`);
    setLinkUrl("");
    setLinkText("");
    setShowLinkModal(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingImage(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files).slice(0, 4 - mediaUrls.length)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) continue; // 5MB limit
        const dataUrl = await fileToDataUrl(file);
        newUrls.push(dataUrl);
      }
      if (newUrls.length > 0) {
        onMediaUrlsChange([...mediaUrls, ...newUrls]);
      }
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onMediaUrlsChange(mediaUrls.filter((_, i) => i !== index));
  };

  const handleMusicSelect = (track: MusicTrackResult) => {
    const tag = `[music title="${track.title}" artist="${track.artist}"${
      track.albumArtUrl ? ` art="${track.albumArtUrl}"` : ""
    }${track.previewUrl ? ` preview="${track.previewUrl}"` : ""}${
      track.externalUrl ? ` url="${track.externalUrl}"` : ""
    }]${track.title} - ${track.artist}[/music]`;
    insertText(tag);
    setShowMusicSearch(false);
  };

  const iconBtn =
    "p-1.5 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors";
  const activeBtn =
    "p-1.5 rounded bg-primary/20 text-primary transition-colors";

  const toolbarActions: ToolbarAction[] = [
    {
      icon: <Bold className="w-3.5 h-3.5" />,
      label: "Bold",
      action: () => insertTag("[b]", "[/b]", "bold text"),
    },
    {
      icon: <Italic className="w-3.5 h-3.5" />,
      label: "Italic",
      action: () => insertTag("[i]", "[/i]", "italic text"),
    },
    {
      icon: <Underline className="w-3.5 h-3.5" />,
      label: "Underline",
      action: () => insertTag("[u]", "[/u]", "underlined text"),
    },
    {
      icon: <Strikethrough className="w-3.5 h-3.5" />,
      label: "Strikethrough",
      action: () => insertTag("[s]", "[/s]", "struck text"),
    },
    { separator: true },
    {
      icon: <Heading1 className="w-3.5 h-3.5" />,
      label: "Heading",
      action: () => insertTag("[h1]", "[/h1]", "Heading"),
    },
    {
      icon: <Heading2 className="w-3.5 h-3.5" />,
      label: "Subheading",
      action: () => insertTag("[h2]", "[/h2]", "Subheading"),
    },
    { separator: true },
    {
      icon: <AlignLeft className="w-3.5 h-3.5" />,
      label: "Left align",
      action: () => insertTag("[left]", "[/left]"),
    },
    {
      icon: <AlignCenter className="w-3.5 h-3.5" />,
      label: "Center",
      action: () => insertTag("[center]", "[/center]"),
    },
    { separator: true },
    {
      icon: <List className="w-3.5 h-3.5" />,
      label: "Bullet list",
      action: () => insertTag("[list]\n[*]", "\n[*]item\n[/list]", "item"),
    },
    {
      icon: <ListOrdered className="w-3.5 h-3.5" />,
      label: "Numbered list",
      action: () =>
        insertTag("[list=1]\n[*]", "\n[*]item\n[/list]", "item"),
    },
    { separator: true },
    {
      icon: <Quote className="w-3.5 h-3.5" />,
      label: "Quote",
      action: () => insertTag("[quote]", "[/quote]", "quoted text"),
    },
    {
      icon: <Code className="w-3.5 h-3.5" />,
      label: "Code",
      action: () => insertTag("[code]", "[/code]", "code"),
    },
    {
      icon: <Minus className="w-3.5 h-3.5" />,
      label: "Horizontal rule",
      action: () => insertText("\n[hr]\n"),
    },
    { separator: true },
    {
      icon: <Link2 className="w-3.5 h-3.5" />,
      label: "Insert link",
      action: () => {
        const textarea = textareaRef.current;
        if (textarea) {
          const selected = value.substring(
            textarea.selectionStart,
            textarea.selectionEnd
          );
          setLinkText(selected);
        }
        setShowLinkModal(true);
      },
    },
    {
      icon: uploadingImage ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <ImagePlus className="w-3.5 h-3.5" />
      ),
      label: "Insert image",
      action: () => fileInputRef.current?.click(),
    },
    {
      icon: <Music className="w-3.5 h-3.5" />,
      label: "Search music",
      action: () => setShowMusicSearch(!showMusicSearch),
    },
  ];

  return (
    <div className="space-y-2">
      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap p-1.5 rounded-lg border border-border bg-muted/30">
        {toolbarActions.map((item, i) =>
          "separator" in item && item.separator ? (
            <div
              key={`sep-${i}`}
              className="w-px h-5 bg-border/50 mx-1"
            />
          ) : (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              title={item.label}
              className={
                (item.label === "Search music" && showMusicSearch) ||
                (item.label === "Insert link" && showLinkModal)
                  ? activeBtn
                  : iconBtn
              }
            >
              {item.icon}
            </button>
          )
        )}
      </div>

      {/* Link modal */}
      {showLinkModal && (
        <div className="flex items-end gap-2 p-3 rounded-lg border border-border/50 bg-muted/20">
          <div className="flex-1 space-y-2">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
            />
            <input
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Display text (optional)"
              className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
            />
          </div>
          <button
            onClick={handleInsertLink}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
          >
            Insert
          </button>
          <button
            onClick={() => setShowLinkModal(false)}
            className="p-1.5 rounded hover:bg-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Music search */}
      {showMusicSearch && (
        <MusicSearchPanel
          onSelect={handleMusicSelect}
          onClose={() => setShowMusicSearch(false)}
        />
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y min-h-[100px]"
      />

      {/* Character count */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>
          Formatting: [b]bold[/b] [i]italic[/i] [url=...]link[/url]
          [img]url[/img] [quote]...[/quote]
        </span>
        <span>
          {value.length}/{maxLength}
        </span>
      </div>

      {/* Image previews */}
      {mediaUrls.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Attachment ${i + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-border"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {mediaUrls.length < 4 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        onChange={handleImageUpload}
        className="sr-only"
        tabIndex={-1}
      />

      {/* Audio attachment */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (showAudioPanel) {
              setShowAudioPanel(false);
              onAudioUrlChange("");
              onAudioTitleChange("");
            } else {
              setShowAudioPanel(true);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
            showAudioPanel
              ? "border-green-500/50 text-green-400 bg-green-500/10"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          Attach Audio
        </button>
      </div>

      {showAudioPanel && (
        <div className="space-y-2 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
          <input
            value={audioTitle}
            onChange={(e) => onAudioTitleChange(e.target.value)}
            placeholder="Track title (e.g. My Song - Artist Name)"
            className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-green-500/50"
          />
          <input
            value={audioUrl}
            onChange={(e) => onAudioUrlChange(e.target.value)}
            placeholder="Audio URL (direct link to mp3/wav/ogg)"
            className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-green-500/50"
          />
        </div>
      )}
    </div>
  );
}

// --- Music Search Panel ---

function MusicSearchPanel({
  onSelect,
  onClose,
}: {
  onSelect: (track: MusicTrackResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicTrackResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/music/search?q=${encodeURIComponent(q)}&limit=8`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  return (
    <div className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Search & embed a track
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search for a song..."
          autoFocus
          className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      {results.length > 0 && (
        <div className="max-h-60 overflow-y-auto rounded-lg border border-border/30 divide-y divide-border/20">
          {results.map((track, i) => (
            <button
              key={`${track.provider}-${track.providerTrackId}-${i}`}
              onClick={() => onSelect(track)}
              className="w-full flex items-center gap-2.5 p-2 hover:bg-muted/50 transition-colors text-left"
            >
              {track.albumArtUrl ? (
                <Image
                  src={track.albumArtUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <Music className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artist}
                  {track.album && ` · ${track.album}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
