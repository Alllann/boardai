"use client";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import { ChatParticipantTurn } from "@/components/chat/ChatParticipantTurn";
import type { ChatGroupFlags } from "@/lib/chat-grouping";
import type { MeetingPlan } from "@/lib/schemas";

type Props = {
  role: MeetingPlan["roles"][number];
} & ChatGroupFlags;

export function DiscussionTypingIndicator({
  role,
  showAvatar = true,
  showName = true,
}: Props) {
  return (
    <ChatParticipantTurn
      avatar={<ExpertAvatar role={role} size="md" />}
      title={role.title}
      subtitle="Expert"
      showAvatar={showAvatar}
      showName={showName}
    >
      <p className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
        <span className="inline-flex gap-0.5" aria-hidden>
          <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:0ms]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:150ms]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:300ms]" />
        </span>
        is speaking…
      </p>
    </ChatParticipantTurn>
  );
}
