"use client";

import { parseMentions, renderMessageWithMentions } from "@/lib/mentions";
import type { MentionCandidate } from "@/lib/schemas";

type Props = {
  text: string;
  mentionCandidates?: MentionCandidate[];
};

export function ChatUserBubble({ text, mentionCandidates = [] }: Props) {
  const mentions = parseMentions(text, mentionCandidates);
  const parts = renderMessageWithMentions(text, mentions);

  return (
    <li className="flex justify-end py-1">
      <div className="max-w-[min(28rem,85%)] rounded-3xl bg-[var(--user-msg-bg)] px-4 py-2.5 text-sm leading-relaxed text-[var(--text-primary)]">
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
    </li>
  );
}
