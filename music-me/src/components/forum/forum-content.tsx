"use client";

import { useState, useRef, Fragment } from "react";
import { Play, Pause, ExternalLink, Volume2 } from "lucide-react";

/**
 * Renders forum post content with BBCode-style formatting.
 *
 * Supported tags:
 * [b]...[/b], [i]...[/i], [u]...[/u], [s]...[/s]
 * [h1]...[/h1], [h2]...[/h2]
 * [left]...[/left], [center]...[/center]
 * [url=...]...[/url], [url]...[/url]
 * [img]...[/img], [img=WxH]...[/img]
 * [quote]...[/quote], [quote=author]...[/quote]
 * [code]...[/code]
 * [list]...[/list], [list=1]...[/list] with [*] items
 * [color=...]...[/color], [size=...]...[/size]
 * [hr]
 * [music title="..." artist="..." art="..." preview="..." url="..."]...[/music]
 */
export function ForumContent({
  content,
  mediaUrls,
}: {
  content: string;
  mediaUrls?: string[];
}) {
  return (
    <div className="forum-content">
      <div
        className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed break-words"
        dangerouslySetInnerHTML={{ __html: parseBBCode(content) }}
      />
      {/* Inline music embeds are rendered via dangerouslySetInnerHTML with custom elements,
          but we need React components for audio players. Parse them separately. */}
      <MusicEmbeds content={content} />
      {/* Attached images */}
      {mediaUrls && mediaUrls.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {mediaUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Attachment ${i + 1}`}
              className="rounded-lg border border-border/30 max-h-80 object-cover w-full"
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- BBCode Parser ---

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseBBCode(raw: string): string {
  let s = escapeHtml(raw);

  // [hr]
  s = s.replace(/\[hr\]/gi, '<hr class="border-border/30 my-3" />');

  // [b], [i], [u], [s]
  s = s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
  s = s.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
  s = s.replace(
    /\[u\]([\s\S]*?)\[\/u\]/gi,
    '<span class="underline">$1</span>'
  );
  s = s.replace(
    /\[s\]([\s\S]*?)\[\/s\]/gi,
    '<span class="line-through">$1</span>'
  );

  // [h1], [h2]
  s = s.replace(
    /\[h1\]([\s\S]*?)\[\/h1\]/gi,
    '<h3 class="text-lg font-bold font-[family-name:var(--font-space-grotesk)] mt-4 mb-2">$1</h3>'
  );
  s = s.replace(
    /\[h2\]([\s\S]*?)\[\/h2\]/gi,
    '<h4 class="text-base font-semibold mt-3 mb-1.5">$1</h4>'
  );

  // [left], [center]
  s = s.replace(
    /\[left\]([\s\S]*?)\[\/left\]/gi,
    '<div class="text-left">$1</div>'
  );
  s = s.replace(
    /\[center\]([\s\S]*?)\[\/center\]/gi,
    '<div class="text-center">$1</div>'
  );

  // [color=...], [size=...]
  s = s.replace(
    /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi,
    (_m, color: string, text: string) => {
      const safe = color.replace(/[^a-zA-Z0-9#,().%\s-]/g, "");
      return `<span style="color:${safe}">${text}</span>`;
    }
  );
  s = s.replace(
    /\[size=([^\]]+)\]([\s\S]*?)\[\/size\]/gi,
    (_m, size: string, text: string) => {
      const sizeMap: Record<string, string> = {
        "1": "0.75rem",
        "2": "0.85rem",
        "3": "1rem",
        "4": "1.15rem",
        "5": "1.3rem",
        "6": "1.5rem",
        "7": "2rem",
        small: "0.85rem",
        medium: "1rem",
        large: "1.25rem",
        xlarge: "1.5rem",
      };
      const fontSize = sizeMap[size] || size;
      return `<span style="font-size:${fontSize}">${text}</span>`;
    }
  );

  // [url=...]...[/url] and [url]...[/url]
  s = s.replace(
    /\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi,
    (_m, url: string, text: string) => {
      const safeUrl = sanitizeUrl(url);
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${text}</a>`;
    }
  );
  s = s.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_m, url: string) => {
    const safeUrl = sanitizeUrl(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${url}</a>`;
  });

  // [img=WxH]...[/img] and [img]...[/img]
  s = s.replace(
    /\[img=(\d+)x(\d+)\]([\s\S]*?)\[\/img\]/gi,
    (_m, w: string, h: string, url: string) => {
      const safeUrl = sanitizeUrl(url);
      return `<img src="${safeUrl}" width="${w}" height="${h}" class="rounded-lg max-w-full my-2 inline-block" alt="" loading="lazy" />`;
    }
  );
  s = s.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, (_m, url: string) => {
    const safeUrl = sanitizeUrl(url);
    return `<img src="${safeUrl}" class="rounded-lg max-w-full max-h-96 my-2 inline-block" alt="" loading="lazy" />`;
  });

  // [quote=author]...[/quote] and [quote]...[/quote]
  s = s.replace(
    /\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/gi,
    (_m, author: string, text: string) =>
      `<blockquote class="border-l-3 border-primary/40 pl-3 py-1 my-2 text-muted-foreground bg-muted/20 rounded-r-lg pr-3"><div class="text-xs font-medium text-primary/70 mb-1">${author} said:</div>${text}</blockquote>`
  );
  s = s.replace(
    /\[quote\]([\s\S]*?)\[\/quote\]/gi,
    '<blockquote class="border-l-3 border-primary/40 pl-3 py-1 my-2 text-muted-foreground bg-muted/20 rounded-r-lg pr-3">$1</blockquote>'
  );

  // [code]...[/code]
  s = s.replace(
    /\[code\]([\s\S]*?)\[\/code\]/gi,
    '<pre class="bg-muted/40 border border-border/30 rounded-lg p-3 my-2 text-xs font-mono overflow-x-auto whitespace-pre-wrap"><code>$1</code></pre>'
  );

  // [list=1]...[/list] and [list]...[/list]
  s = s.replace(
    /\[list=1\]([\s\S]*?)\[\/list\]/gi,
    (_m, content: string) => {
      const items = content.split(/\[\*\]/).filter((i) => i.trim());
      return `<ol class="list-decimal list-inside my-2 space-y-1">${items
        .map((item) => `<li>${item.trim()}</li>`)
        .join("")}</ol>`;
    }
  );
  s = s.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_m, content: string) => {
    const items = content.split(/\[\*\]/).filter((i) => i.trim());
    return `<ul class="list-disc list-inside my-2 space-y-1">${items
      .map((item) => `<li>${item.trim()}</li>`)
      .join("")}</ul>`;
  });

  // Strip [music]...[/music] tags from HTML output (rendered separately as React components)
  s = s.replace(/\[music[^\]]*\][\s\S]*?\[\/music\]/gi, "");

  // Auto-link bare URLs that aren't already in tags
  s = s.replace(
    /(?<!")(?<!=)(https?:\/\/[^\s<"]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
  );

  // Newlines to <br>
  s = s.replace(/\n/g, "<br />");

  return s;
}

function sanitizeUrl(url: string): string {
  const decoded = url
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  // Only allow http, https, and data URLs
  if (
    decoded.startsWith("http://") ||
    decoded.startsWith("https://") ||
    decoded.startsWith("data:")
  ) {
    return escapeHtml(decoded);
  }
  return "#";
}

// --- Music Embed Components ---

interface MusicEmbed {
  title: string;
  artist: string;
  art: string | null;
  preview: string | null;
  url: string | null;
  displayText: string;
}

function parseMusicEmbeds(content: string): MusicEmbed[] {
  const regex =
    /\[music(?:\s+title="([^"]*)")?(?:\s+artist="([^"]*)")?(?:\s+art="([^"]*)")?(?:\s+preview="([^"]*)")?(?:\s+url="([^"]*)")?\]([\s\S]*?)\[\/music\]/gi;
  const embeds: MusicEmbed[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    embeds.push({
      title: match[1] || "",
      artist: match[2] || "",
      art: match[3] || null,
      preview: match[4] || null,
      url: match[5] || null,
      displayText: match[6] || "",
    });
  }
  return embeds;
}

function MusicEmbeds({ content }: { content: string }) {
  const embeds = parseMusicEmbeds(content);
  if (embeds.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {embeds.map((embed, i) => (
        <MusicEmbedCard key={i} embed={embed} />
      ))}
    </div>
  );
}

function MusicEmbedCard({ embed }: { embed: MusicEmbed }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
      {embed.art && (
        <img
          src={embed.art}
          alt=""
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      )}
      {embed.preview && (
        <>
          <audio
            ref={audioRef}
            src={embed.preview}
            onTimeUpdate={() =>
              setProgress(audioRef.current?.currentTime ?? 0)
            }
            onLoadedMetadata={() =>
              setDuration(audioRef.current?.duration ?? 0)
            }
            onEnded={() => setPlaying(false)}
          />
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors flex-shrink-0"
          >
            {playing ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>
        </>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{embed.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {embed.artist}
        </p>
        {embed.preview && duration > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div
              className="flex-1 h-1 rounded-full bg-muted/50 cursor-pointer overflow-hidden"
              onClick={(e) => {
                if (!audioRef.current || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = pct * duration;
              }}
            >
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: duration
                    ? `${(progress / duration) * 100}%`
                    : "0%",
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatTime(progress)}/{formatTime(duration)}
            </span>
          </div>
        )}
      </div>
      {embed.url && (
        <a
          href={embed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          title="Open in streaming service"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
