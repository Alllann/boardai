"use client";

import { useState } from "react";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import { ExpertProfilePopover } from "@/components/ExpertProfilePopover";
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
};

export function DiscussionTurn({
  turn,
  role,
  glossaryEntries,
  explainContext,
  explainDisabled = false,
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
    <li className="flex items-end gap-3 py-0.5">
      <div className="relative shrink-0">
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

      <div className="max-w-[min(36rem,92%)] rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {fallbackRole.title}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Board seat
          </p>
        </div>
        {context ? (
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
      </div>
    </li>
  );
}
