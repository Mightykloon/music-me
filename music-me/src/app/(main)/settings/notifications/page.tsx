"use client";

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
          Notification Preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose what notifications you receive.
        </p>
      </div>

      <div className="space-y-4">
        {[
          { label: "New followers", description: "When someone follows you" },
          { label: "Reactions", description: "When someone reacts to your post" },
          { label: "Comments", description: "When someone comments on your post" },
          { label: "Reposts", description: "When someone reposts your content" },
          { label: "Mentions", description: "When someone mentions you" },
          { label: "Direct messages", description: "When you receive a message" },
        ].map((item) => (
          <label
            key={item.label}
            className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 accent-primary"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
