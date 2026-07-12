"use client";

import { ChairAvatar } from "@/components/ChairAvatar";
import { BriefingSlides } from "@/components/BriefingSlides";
import { ChatParticipantTurn } from "@/components/chat/ChatParticipantTurn";
import type { ChatGroupFlags } from "@/lib/chat-grouping";
import type { ChairBriefing, GlossaryEntry } from "@/lib/schemas";

type Props = {
  briefing: ChairBriefing;
  glossaryEntries: GlossaryEntry[];
} & ChatGroupFlags;

export function ChatBriefingCard({
  briefing,
  glossaryEntries,
  showAvatar = true,
  showName = true,
}: Props) {
  const bubbleTail = showAvatar ? "rounded-tl-md" : "";

  return (
    <ChatParticipantTurn
      avatar={<ChairAvatar size="md" />}
      title="Chair"
      subtitle="Facilitator"
      showAvatar={showAvatar}
      showName={showName}
      contentClassName={`block w-full overflow-hidden rounded-[var(--radius-bubble)] bg-[var(--peer-msg-bg)] ${bubbleTail}`}
    >
      <BriefingSlides briefing={briefing} glossaryEntries={glossaryEntries} />
    </ChatParticipantTurn>
  );
}
