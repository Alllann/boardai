"use client";

import { GlossaryText } from "@/components/GlossaryText";
import { PlainLanguageBlock } from "@/components/PlainLanguageBlock";
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
  explanation?: string;
  showExplanationToggle: boolean;
  explainContext?: ExplainContextParams;
  explainDisabled?: boolean;
};

export function DiscussionTurn({
  turn,
  role,
  glossaryEntries,
  explanation,
  showExplanationToggle,
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
    <li className="ml-0 flex justify-start sm:ml-4">
      <div
        className={`max-w-[min(36rem,92%)] rounded-2xl rounded-tl-sm border px-4 py-3 shadow-sm ${palette.border} ${palette.bg}`}
      >
        <RoleBadge role={fallbackRole} compact />
        {context ? (
          <SelectableExplain
            text={turn.content}
            glossaryEntries={glossaryEntries}
            context={context}
            blockText={turn.content}
            showBlockExplain
            disabled={explainDisabled}
            className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
          >
            {explanation ? (
              <PlainLanguageBlock
                explanation={explanation}
                showToggle={showExplanationToggle}
              />
            ) : null}
          </SelectableExplain>
        ) : (
          <>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              <GlossaryText text={turn.content} entries={glossaryEntries} />
            </div>
            {explanation ? (
              <PlainLanguageBlock
                explanation={explanation}
                showToggle={showExplanationToggle}
              />
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}
