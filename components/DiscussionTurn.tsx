"use client";

import { GlossaryText } from "@/components/GlossaryText";
import { RoleBadge } from "@/components/RoleBadge";
import {
  SelectableExplain,
  type ExplainContextParams,
} from "@/components/SelectableExplain";
import { getRolePalette } from "@/lib/role-colors";
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
  const palette = getRolePalette(turn.roleId);
  const fallbackRole = role ?? {
    id: turn.roleId,
    title: turn.roleName,
    mandate: "Expert on this board.",
  };

  const context: ExplainContextParams | undefined = explainContext
    ? {
        ...explainContext,
        source: "transcript",
        turnId: turn.id,
      }
    : undefined;

  return (
    <li className="flex justify-start py-0.5">
      <div
        className={`max-w-[min(36rem,92%)] rounded-2xl rounded-tl-sm border px-3.5 py-2.5 shadow-sm ${palette.border} ${palette.bg}`}
      >
        <RoleBadge role={fallbackRole} compact />
        {context ? (
          <SelectableExplain
            text={turn.content}
            glossaryEntries={glossaryEntries}
            context={context}
            disabled={explainDisabled}
            markdown
            className="mt-3 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
          />
        ) : (
          <div className="mt-3 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            <GlossaryText text={turn.content} entries={glossaryEntries} />
          </div>
        )}
      </div>
    </li>
  );
}
