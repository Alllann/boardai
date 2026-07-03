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
      <p className="whitespace-pre-wrap">
        {content}
        {streaming ? (
          <span
            className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-[var(--text-tertiary)] align-middle"
            aria-hidden
          />
        ) : null}
      </p>
    </ChatParticipantTurn>
  );
}
