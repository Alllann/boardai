"use client";

import { useState } from "react";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import { ExpertProfilePopover } from "@/components/ExpertProfilePopover";
import { ChatParticipantTurn } from "@/components/chat/ChatParticipantTurn";
import { GlossaryText } from "@/components/GlossaryText";
import {
  SelectableExplain,
  type ExplainContextParams,
} from "@/components/SelectableExplain";
import type { GlossaryEntry, MeetingPlan, TranscriptTurn } from "@/lib/schemas";
import type { ChatGroupFlags } from "@/lib/chat-grouping";

type Props = {
  turn: TranscriptTurn;
  role: MeetingPlan["roles"][number] | undefined;
  glossaryEntries: GlossaryEntry[];
  explainContext?: ExplainContextParams;
  explainDisabled?: boolean;
  streaming?: boolean;
} & ChatGroupFlags;

export function DiscussionTurn({
  turn,
  role,
  glossaryEntries,
  explainContext,
  explainDisabled = false,
  streaming = false,
  showAvatar = true,
  showName = true,
}: Props) {
  const [profileOpen, setProfileOpen] = useState(false);

  const fallbackRole: MeetingPlan["roles"][number] = role ?? {
    id: turn.roleId,
    title: turn.roleName,
    mandate: "Expert on this board.",
    background: undefined,
  };

  const context: ExplainContextParams | undefined = explainContext
    ? {
        ...explainContext,
        source: "transcript",
        turnId: turn.id,
      }
    : undefined;

  return (
    <ChatParticipantTurn
      avatar={
        <div className="relative">
          <ExpertAvatar
            role={fallbackRole}
            size="md"
            onClick={() => setProfileOpen((v) => !v)}
          />
          <ExpertProfilePopover
            role={fallbackRole}
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
          />
        </div>
      }
      title={fallbackRole.title}
      subtitle="Expert"
      showAvatar={showAvatar}
      showName={showName}
    >
      {streaming ? (
        <p className="whitespace-pre-wrap">
          {turn.content}
          <span
            className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-[var(--text-tertiary)] align-middle"
            aria-hidden
          />
        </p>
      ) : context ? (
        <SelectableExplain
          text={turn.content}
          glossaryEntries={glossaryEntries}
          context={context}
          disabled={explainDisabled}
          markdown
          className="text-[var(--text-primary)]"
        />
      ) : (
        <div className="text-[var(--text-primary)]">
          <GlossaryText text={turn.content} entries={glossaryEntries} />
        </div>
      )}
    </ChatParticipantTurn>
  );
}
