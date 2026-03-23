"use client";

export default function AppearanceSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
          Appearance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize the look of your music.me experience.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Theme</h2>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          {[
            { value: "dark", label: "Dark", bg: "bg-[#0a0a0a]" },
            { value: "midnight", label: "Midnight", bg: "bg-[#0f172a]" },
            { value: "amoled", label: "AMOLED", bg: "bg-black" },
          ].map((theme) => (
            <button
              key={theme.value}
              className="p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-colors text-center space-y-2"
            >
              <div
                className={`w-full h-12 rounded-lg ${theme.bg} border border-border/30`}
              />
              <p className="text-xs font-medium">{theme.label}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Default Feed View</h2>
        <div className="flex gap-2">
          {["Stream", "Grid", "Radio", "Magazine"].map((mode) => (
            <button
              key={mode}
              className="px-3 py-1.5 rounded-lg border border-border/50 text-xs hover:border-primary/50 transition-colors"
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Compact Mode</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-primary" />
          <span className="text-sm text-muted-foreground">
            Use compact spacing for feed posts
          </span>
        </label>
      </section>
    </div>
  );
}
