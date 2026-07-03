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
      subtitle="Board seat"
      showAvatar={showAvatar}
      showName={showName}
    >
      <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex gap-0.5" aria-hidden>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
        </span>
        is speaking…
      </p>
    </ChatParticipantTurn>
  );
}
