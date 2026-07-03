"use client";

import { parseMentions, renderMessageWithMentions } from "@/lib/mentions";
import type { MentionCandidate } from "@/lib/schemas";

type Props = {
  text: string;
  mentionCandidates?: MentionCandidate[];
  showName?: boolean;
};

export function ChatUserBubble({
  text,
  mentionCandidates = [],
  showName = true,
}: Props) {
  const mentions = parseMentions(text, mentionCandidates);
  const parts = renderMessageWithMentions(text, mentions);

  return (
    <li className={`flex justify-end ${showName ? "py-0.5" : "py-0"}`}>
      <div className="flex max-w-[min(28rem,85%)] flex-col items-end gap-1">
        {showName ? (
          <p className="px-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">You</p>
        ) : null}
        <div className="rounded-3xl bg-[var(--user-msg-bg)] px-4 py-2.5 text-sm leading-relaxed text-[var(--text-primary)]">
          <p className="whitespace-pre-wrap">
            {parts.map((part, i) =>
              part.type === "mention" ? (
                <span
                  key={i}
                  className="font-semibold text-emerald-700 dark:text-emerald-400"
                >
                  {part.value}
                </span>
              ) : (
                <span key={i}>{part.value}</span>
              ),
            )}
          </p>
        </div>
      </div>
    </li>
  );
}
