"use client";

import { ChairAvatar } from "@/components/ChairAvatar";
import { ChatParticipantTurn } from "@/components/chat/ChatParticipantTurn";
import type { ChatGroupFlags } from "@/lib/chat-grouping";

type Props = {
  content: string;
  streaming?: boolean;
} & ChatGroupFlags;

export function ChatChairMessage({
  content,
  streaming = false,
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
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {content}
        {streaming ? (
          <span
            className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-400 align-middle dark:bg-zinc-500"
            aria-hidden
          />
        ) : null}
      </p>
    </ChatParticipantTurn>
  );
}
