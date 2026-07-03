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
    <li className={`flex justify-end ${showName ? "py-1.5" : "py-0.5"}`}>
      <div className="flex max-w-[min(40rem,88%)] flex-col items-end gap-1">
        {showName ? (
          <p className="px-1 text-[11px] text-[var(--text-tertiary)]">You</p>
        ) : null}
        <div className="rounded-[var(--radius-bubble)] rounded-br-md bg-[var(--user-msg-bg)] px-4 py-2.5 text-[15px] leading-relaxed text-[var(--user-msg-fg)]">
          <p className="whitespace-pre-wrap">
            {parts.map((part, i) =>
              part.type === "mention" ? (
                <span key={i} className="font-medium opacity-70">
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
