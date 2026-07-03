"use client";

import { ChairAvatar } from "@/components/ChairAvatar";
import { ChatParticipantTurn } from "@/components/chat/ChatParticipantTurn";
import type { ChatGroupFlags } from "@/lib/chat-grouping";

type Props = ChatGroupFlags;

export function ChairTypingIndicator({
  showAvatar = true,
  showName = true,
}: Props) {
  return (
    <ChatParticipantTurn
      avatar={<ChairAvatar size="md" />}
      title="Chair"
      subtitle="Facilitator"
      showAvatar={showAvatar}
      showName={showName}
    >
      <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex gap-0.5" aria-hidden>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
        </span>
        is thinking…
      </p>
    </ChatParticipantTurn>
  );
}
