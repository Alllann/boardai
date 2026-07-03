"use client";

import { useRef, useState } from "react";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import { ChairAvatar } from "@/components/ChairAvatar";
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
  const isHome = variant === "home";

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

  const defaultPlaceholder = isHome
    ? "Ask anything…"
    : "Message the board…";

  const mentionList =
    mentionOpen && filteredMentions.length > 0 ? (
      <ul className="absolute bottom-full left-0 right-0 z-10 mb-2 max-h-40 overflow-y-auto rounded-2xl bg-[var(--surface-raised)] py-1 shadow-[var(--shadow-soft)]">
        {filteredMentions.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-[var(--surface-hover)]"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertMention(c)}
            >
              {c.type === "expert" ? (
                <ExpertAvatar
                  role={{ id: c.id, title: c.label, mandate: "" }}
                  size="sm"
                />
              ) : (
                <ChairAvatar size="sm" />
              )}
              <span className="font-medium text-[var(--text-primary)]">@{c.label}</span>
              <span className="text-xs text-[var(--text-tertiary)]">
                {c.type === "chair" ? "Chair" : "Expert"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  const sendButton = (
    <button
      type="button"
      onClick={onSubmit}
      disabled={!canSend}
      aria-label={loading ? "Sending…" : isHome ? "Start board session" : "Send message"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] transition enabled:hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-25"
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent-fg)]/30 border-t-[var(--accent-fg)]" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M3.4 20.6 21 12 3.4 3.4l1.65 7.15L16 12l-10.95 1.45L3.4 20.6Z" />
        </svg>
      )}
    </button>
  );

  const textarea = (
    <textarea
      ref={textareaRef}
      id="brief"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      rows={isHome ? 3 : 1}
      disabled={loading || disabled}
      placeholder={placeholder ?? defaultPlaceholder}
      className={`w-full resize-none border-0 bg-transparent text-[15px] leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] disabled:opacity-50 ${
        isHome ? "min-h-[4.5rem] px-1 py-0.5" : "min-h-[1.5rem] max-h-32 flex-1 px-1 py-1"
      }`}
    />
  );

  if (isHome) {
    return (
      <div className="relative w-full">
        {mentionList}
        <label htmlFor="brief" className="sr-only">
          Message
        </label>
        <div className="composer-pill rounded-[1.75rem] px-4 pb-3 pt-4">
          {textarea}
          <div className="mt-1 flex justify-end">{sendButton}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative shrink-0 px-4 pb-4 pt-2">
      <div className="relative mx-auto w-full max-w-4xl">
        {mentionList}
        <label htmlFor="brief" className="sr-only">
          Message
        </label>
        <div className="composer-pill flex items-end gap-2 rounded-[1.75rem] px-4 py-2.5">
          {textarea}
          {sendButton}
        </div>
      </div>
    </div>
  );
}
