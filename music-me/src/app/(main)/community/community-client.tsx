"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  MessageCircle,
  Radio,
  ChevronRight,
  ArrowLeft,
  Send,
  Loader2,
  Users,
  Search,
  Hash,
  Smile,
  Plus,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  _count: { threads: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  children: SubCategory[];
  _count: { threads: number };
}

interface ConversationItem {
  id: string;
  other: {
    id: string;
    username: string;
    displayName: string | null;
    profile: { profilePictureUrl: string | null } | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    read: boolean;
  } | null;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    profile: { profilePictureUrl: string | null } | null;
  };
}

interface OnlineUser {
  id: string;
  username: string;
  displayName: string | null;
  profile: { profilePictureUrl: string | null } | null;
}

interface LiveMessage {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  content: string;
  timestamp: Date;
}

interface CommunityClientProps {
  categories: Category[];
  conversations: ConversationItem[];
  currentUserId: string;
  onlineUsers: OnlineUser[];
}

type Tab = "forum" | "messages" | "live";

export function CommunityClient({
  categories,
  conversations,
  currentUserId,
  onlineUsers,
}: CommunityClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as Tab) || "forum";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [showOnline, setShowOnline] = useState(false);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/community?tab=${tab}`, { scroll: false });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "forum", label: "Forum", icon: <MessageSquare className="w-4 h-4" /> },
    {
      id: "messages",
      label: "Messages",
      icon: <MessageCircle className="w-4 h-4" />,
      count: conversations.filter(
        (c) => c.lastMessage && !c.lastMessage.read && c.lastMessage.senderId !== currentUserId
      ).length,
    },
    { id: "live", label: "Live Chat", icon: <Radio className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto flex">
      <div className="flex-1 min-w-0">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">
                Community
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Connect, discuss, and vibe with other music lovers
              </p>
            </div>
            <button
              onClick={() => setShowOnline(!showOnline)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="text-xs">{onlineUsers.length}</span>
            </button>
          </div>

          <div className="flex gap-1 border-b border-border/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.count && tab.count > 0 ? (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                    {tab.count}
                  </span>
                ) : null}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeTab === "forum" && <ForumTab categories={categories} />}
          {activeTab === "messages" && (
            <MessagesTab conversations={conversations} currentUserId={currentUserId} onlineUsers={onlineUsers} />
          )}
          {activeTab === "live" && (
            <LiveChatTab currentUserId={currentUserId} onlineUsers={onlineUsers} />
          )}
        </div>
      </div>

      <div className="hidden lg:block w-64 border-l border-border/50 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <OnlineSidebar users={onlineUsers} />
      </div>

      {showOnline && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOnline(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-background border-l border-border/50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Online</h3>
              <button onClick={() => setShowOnline(false)} className="p-1 hover:bg-muted rounded">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
            <OnlineSidebar users={onlineUsers} />
          </div>
        </div>
      )}
    </div>
  );
}

function OnlineSidebar({ users }: { users: OnlineUser[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Online &mdash; {users.length}
        </h3>
      </div>
      <div className="space-y-1">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/${user.username}`}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors group"
          >
            <div className="relative">
              <Avatar src={user.profile?.profilePictureUrl} alt={user.displayName ?? user.username} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-background" />
            </div>
            <span className="text-sm truncate group-hover:text-foreground text-muted-foreground">
              {user.displayName ?? user.username}
            </span>
          </Link>
        ))}
        {users.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-4">No one else online right now</p>
        )}
      </div>
    </div>
  );
}

function ForumTab({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category.id}>
          <div className="flex items-center gap-2 px-2 py-2">
            <span className="text-lg">{category.icon}</span>
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: category.color ?? "#8b5cf6" }}
            >
              {category.name}
            </h2>
            {category.description && (
              <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
                &mdash; {category.description}
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            {category.children.map((sub) => (
              <Link
                key={sub.id}
                href={`/forum/${sub.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors group"
              >
                <span className="text-lg w-7 text-center flex-shrink-0">{sub.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{sub.name}</p>
                  {sub.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-1 text-xs">
                    <Hash className="w-3 h-3" />
                    <span>{sub._count.threads}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesTab({
  conversations,
  currentUserId,
  onlineUsers,
}: {
  conversations: ConversationItem[];
  currentUserId: string;
  onlineUsers: OnlineUser[];
}) {
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchResults, setSearchResults] = useState<OnlineUser[]>([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeItem = conversations.find((c) => c.id === activeConvo);
  const onlineIds = new Set(onlineUsers.map((u) => u.id));

  useEffect(() => {
    if (!activeConvo) return;
    setLoading(true);
    fetch(`/api/messages/${activeConvo}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConvo) return;
    const interval = setInterval(() => {
      fetch(`/api/messages/${activeConvo}`)
        .then((r) => r.json())
        .then((data) => { if (data.items) setMessages(data.items); })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [activeConvo]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeItem || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: activeItem.other.id, content: newMessage.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const msg = await res.json();
      setMessages((prev) => [...prev, {
        ...msg,
        createdAt: typeof msg.createdAt === "string" ? msg.createdAt : new Date(msg.createdAt).toISOString(),
        sender: { id: currentUserId, username: "", displayName: "You", profile: null },
      }]);
      setNewMessage("");
    } catch { /* ignore */ } finally { setSending(false); }
  };

  const handleNewMessage = async (recipientId: string) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, content: "\ud83d\udc4b" }),
      });
      if (res.ok) window.location.href = "/community?tab=messages";
    } catch { /* ignore */ }
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=users`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults((data.users ?? []).filter((u: OnlineUser) => u.id !== currentUserId).slice(0, 8));
      }
    } catch { /* ignore */ } finally { setSearching(false); }
  }, [currentUserId]);

  if (showNewMessage) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setShowNewMessage(false)} className="p-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-sm">New Message</h2>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for a user..."
            className="w-full bg-muted/30 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            autoFocus
          />
        </div>
        {searching && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
        <div className="space-y-1">
          {searchResults.map((user) => (
            <button key={user.id} onClick={() => handleNewMessage(user.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors text-left">
              <div className="relative">
                <Avatar src={user.profile?.profilePictureUrl} alt={user.displayName ?? user.username} size="md" />
                {onlineIds.has(user.id) && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-background" />}
              </div>
              <div>
                <p className="font-medium text-sm">{user.displayName ?? user.username}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </button>
          ))}
          {searchQuery && !searching && searchResults.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users found</p>}
        </div>
      </div>
    );
  }

  if (!activeConvo) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
          <button onClick={() => setShowNewMessage(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />New
          </button>
        </div>
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No conversations yet</p>
            <button onClick={() => setShowNewMessage(true)} className="text-sm text-primary hover:underline">Start a conversation</button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((c) => {
              const isOnline = onlineIds.has(c.other.id);
              const unread = c.lastMessage && !c.lastMessage.read && c.lastMessage.senderId !== currentUserId;
              return (
                <button key={c.id} onClick={() => setActiveConvo(c.id)} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left", unread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30")}>
                  <div className="relative">
                    <Avatar src={c.other.profile?.profilePictureUrl} alt={c.other.displayName ?? c.other.username} size="md" />
                    {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-sm truncate", unread ? "font-semibold" : "font-medium")}>{c.other.displayName ?? c.other.username}</p>
                      {c.lastMessage && <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">{formatDistanceToNow(new Date(c.lastMessage.createdAt), { addSuffix: false })}</span>}
                    </div>
                    {c.lastMessage && <p className={cn("text-xs truncate mt-0.5", unread ? "text-foreground" : "text-muted-foreground")}>{c.lastMessage.senderId === currentUserId ? "You: " : ""}{c.lastMessage.content}</p>}
                  </div>
                  {unread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-3 pb-3 border-b border-border/30 mb-3">
        <button onClick={() => setActiveConvo(null)} className="p-1.5 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        {activeItem && (
          <Link href={`/${activeItem.other.username}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="relative">
              <Avatar src={activeItem.other.profile?.profilePictureUrl} alt={activeItem.other.displayName ?? activeItem.other.username} size="sm" />
              {onlineIds.has(activeItem.other.id) && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border-2 border-background" />}
            </div>
            <div>
              <p className="font-medium text-sm">{activeItem.other.displayName ?? activeItem.other.username}</p>
              <p className="text-[10px] text-muted-foreground">{onlineIds.has(activeItem.other.id) ? "Online" : "Offline"}</p>
            </div>
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10"><Smile className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Start the conversation!</p></div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm", isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted/50 rounded-bl-md")}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={cn("text-[10px] mt-1", isMe ? "text-primary-foreground/50" : "text-muted-foreground")}>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="pt-3 mt-auto flex items-center gap-2">
        <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Type a message..." className="flex-1 bg-muted/30 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
        <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function LiveChatTab({ currentUserId, onlineUsers }: { currentUserId: string; onlineUsers: OnlineUser[] }) {
  const [messages, setMessages] = useState<LiveMessage[]>([
    { id: "system-1", username: "system", displayName: "remixd", avatar: null, content: "Welcome to Live Chat! Say hello to fellow music lovers.", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, username: "you", displayName: "You", avatar: null, content: input.trim(), timestamp: new Date() }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-2 pb-3 border-b border-border/30 mb-3">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live</span>
        <span className="text-xs text-muted-foreground">&middot; {onlineUsers.length + 1} listening</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2.5">
            {msg.username === "system" ? (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"><Radio className="w-4 h-4 text-primary" /></div>
            ) : (
              <Avatar src={msg.avatar} alt={msg.displayName ?? msg.username} size="sm" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className={cn("text-sm font-medium", msg.username === "system" ? "text-primary" : "")}>{msg.displayName ?? msg.username}</span>
                <span className="text-[10px] text-muted-foreground">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="pt-3 mt-auto flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Say something..." className="flex-1 bg-muted/30 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
        <button onClick={handleSend} disabled={!input.trim()} className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
