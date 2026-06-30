"use client";

import { ChairAvatar } from "@/components/ChairAvatar";
import { ChatParticipantTurn } from "@/components/chat/ChatParticipantTurn";

type Props = {
  content: string;
  streaming?: boolean;
};

export function ChatChairMessage({ content, streaming = false }: Props) {
  return (
    <ChatParticipantTurn avatar={<ChairAvatar size="md" />} title="Chair" subtitle="Facilitator">
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
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
