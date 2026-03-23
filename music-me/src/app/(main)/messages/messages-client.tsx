"use client";

import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, Loader2, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

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

interface MessagesClientProps {
  conversations: ConversationItem[];
  currentUserId: string;
}

export function MessagesClient({
  conversations,
  currentUserId,
}: MessagesClientProps) {
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeItem = conversations.find((c) => c.id === activeConvo);

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

  const handleSend = async () => {
    if (!newMessage.trim() || !activeItem || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: activeItem.other.id,
          content: newMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const msg = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          createdAt:
            typeof msg.createdAt === "string"
              ? msg.createdAt
              : new Date(msg.createdAt).toISOString(),
          sender: {
            id: currentUserId,
            username: "",
            displayName: "You",
            profile: null,
          },
        },
      ]);
      setNewMessage("");
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  // Conversation list
  if (!activeConvo) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="px-4 py-4 border-b border-border/50">
          <h1 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
            Messages
          </h1>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-20 px-4">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No conversations yet. Send a message from someone&apos;s profile to start chatting.
            </p>
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConvo(c.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/30 text-left"
            >
              <Avatar
                src={c.other.profile?.profilePictureUrl}
                alt={c.other.displayName ?? c.other.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">
                    {c.other.displayName ?? c.other.username}
                  </p>
                  {c.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.lastMessage.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                {c.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.lastMessage.senderId === currentUserId ? "You: " : ""}
                    {c.lastMessage.content}
                  </p>
                )}
              </div>
              {c.lastMessage &&
                !c.lastMessage.read &&
                c.lastMessage.senderId !== currentUserId && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
            </button>
          ))
        )}
      </div>
    );
  }

  // Active conversation
  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <button
          onClick={() => setActiveConvo(null)}
          className="p-1.5 rounded-lg hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {activeItem && (
          <>
            <Avatar
              src={activeItem.other.profile?.profilePictureUrl}
              alt={activeItem.other.displayName ?? activeItem.other.username}
              size="sm"
            />
            <p className="font-medium text-sm">
              {activeItem.other.displayName ?? activeItem.other.username}
            </p>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-4 py-3 flex items-center gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 bg-muted/30 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
