"use client";

import { useRef, useState } from "react";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import type { MentionCandidate } from "@/lib/schemas";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled?: boolean;
  variant?: "home" | "thread";
  mentionCandidates?: MentionCandidate[];
  placeholder?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  loading,
  disabled = false,
  variant = "thread",
  mentionCandidates = [],
  placeholder,
  inputRef: externalRef,
}: Props) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef ?? internalRef;
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");

  const canSend = !loading && !disabled && value.trim().length > 0;

  const filteredMentions = mentionCandidates.filter((c) =>
    c.label.toLowerCase().includes(mentionFilter.toLowerCase()),
  );

  const insertMention = (candidate: MentionCandidate) => {
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart;
    const before = value.slice(0, cursor);
    const atIndex = before.lastIndexOf("@");
    if (atIndex < 0) return;
    const after = value.slice(cursor);
    const next = `${value.slice(0, atIndex)}@${candidate.label} ${after}`;
    onChange(next);
    setMentionOpen(false);
    setMentionFilter("");
    requestAnimationFrame(() => {
      const pos = atIndex + candidate.label.length + 2;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handleChange = (next: string) => {
    onChange(next);
    const el = textareaRef.current;
    if (!el || mentionCandidates.length === 0) {
      setMentionOpen(false);
      return;
    }
    const cursor = el.selectionStart;
    const before = next.slice(0, cursor);
    const atIndex = before.lastIndexOf("@");
    if (atIndex >= 0 && !before.slice(atIndex + 1).includes(" ")) {
      setMentionOpen(true);
      setMentionFilter(before.slice(atIndex + 1));
    } else {
      setMentionOpen(false);
      setMentionFilter("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
    if (e.key === "Escape") setMentionOpen(false);
  };

  const isHome = variant === "home";
  const defaultPlaceholder =
    variant === "thread"
      ? "Ask the board… use @CFO or @Chair"
      : "Describe your idea or decision…";

  return (
    <div className="relative shrink-0 border-t border-zinc-200 bg-white/95 px-3 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      {mentionOpen && filteredMentions.length > 0 ? (
        <ul className="absolute bottom-full left-3 right-3 z-10 mb-1 max-h-40 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {filteredMentions.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertMention(c)}
              >
                {c.type === "expert" ? (
                  <ExpertAvatar
                    role={{
                      id: c.id,
                      title: c.label,
                      mandate: "",
                    }}
                    size="sm"
                  />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                    C
                  </span>
                )}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">@{c.label}</span>
                <span className="text-xs text-zinc-500">
                  {c.type === "chair" ? "Chair" : "Expert"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <label htmlFor="brief" className="sr-only">
          Message
        </label>
        <textarea
          ref={textareaRef}
          id="brief"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading || disabled}
          placeholder={placeholder ?? defaultPlaceholder}
          className="min-h-[2.75rem] flex-1 resize-none rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSend}
          aria-label={loading ? "Sending…" : isHome ? "Start board session" : "Send message"}
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
