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

type Props = {
  turn: TranscriptTurn;
  role: MeetingPlan["roles"][number] | undefined;
  glossaryEntries: GlossaryEntry[];
  explainContext?: ExplainContextParams;
  explainDisabled?: boolean;
  streaming?: boolean;
};

export function DiscussionTurn({
  turn,
  role,
  glossaryEntries,
  explainContext,
  explainDisabled = false,
  streaming = false,
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
      subtitle="Board seat"
    >
      {streaming ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {turn.content}
          <span
            className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-400 align-middle dark:bg-zinc-500"
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
          className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
        />
      ) : (
        <div className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          <GlossaryText text={turn.content} entries={glossaryEntries} />
        </div>
      )}
    </ChatParticipantTurn>
  );
}
