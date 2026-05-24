"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled?: boolean;
  variant?: "home" | "thread";
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  loading,
  disabled = false,
  variant = "thread",
}: Props) {
  const canSend = !loading && !disabled && value.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  };

  const isHome = variant === "home";

  return (
    <div className="shrink-0 border-t border-zinc-200 bg-white/95 px-3 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <label htmlFor="brief" className="sr-only">
          Your brief
        </label>
        <textarea
          id="brief"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
          placeholder="Describe your idea or decision…"
          className="min-h-[2.75rem] flex-1 resize-none rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSend}
          aria-label={loading ? "Session in progress" : "Start board session"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M3.4 20.6 21 12 3.4 3.4l1.65 7.15L16 12l-10.95 1.45L3.4 20.6Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
