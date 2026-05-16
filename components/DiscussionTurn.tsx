"use client";

import { useEffect, useState } from "react";

import { GlossaryText } from "@/components/GlossaryText";
import { RoleBadge } from "@/components/RoleBadge";
import { getRolePalette } from "@/lib/role-colors";
import type { GlossaryEntry, MeetingPlan, TranscriptTurn } from "@/lib/schemas";

const EXPLANATIONS_EXPANDED_KEY = "boardai-explanations-expanded";

type Props = {
  turn: TranscriptTurn;
  role: MeetingPlan["roles"][number] | undefined;
  glossaryEntries: GlossaryEntry[];
  explanation?: string;
  showExplanationToggle: boolean;
};

export function DiscussionTurn({
  turn,
  role,
  glossaryEntries,
  explanation,
  showExplanationToggle,
}: Props) {
  const palette = getRolePalette(turn.roleId);
  const fallbackRole = role ?? {
    id: turn.roleId,
    title: turn.roleName,
    mandate: "Expert on this board.",
  };

  const [explanationsExpanded, setExplanationsExpanded] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(EXPLANATIONS_EXPANDED_KEY);
      if (stored === "0") setExplanationsExpanded(false);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleExplanations = () => {
    setExplanationsExpanded((v) => {
      const next = !v;
      try {
        sessionStorage.setItem(EXPLANATIONS_EXPANDED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const hasExplanation = Boolean(explanation?.trim());

  return (
    <li className="ml-0 flex justify-start sm:ml-4">
      <div
        className={`max-w-[min(36rem,92%)] rounded-2xl rounded-tl-sm border px-4 py-3 shadow-sm ${palette.border} ${palette.bg}`}
      >
        <RoleBadge role={fallbackRole} />
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          <GlossaryText text={turn.content} entries={glossaryEntries} />
        </div>

        {hasExplanation ? (
          <div className="mt-3 border-l-2 border-zinc-300 pl-3 dark:border-zinc-600">
            {showExplanationToggle ? (
              <button
                type="button"
                onClick={toggleExplanations}
                className="mb-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                aria-expanded={explanationsExpanded}
              >
                Plain-language explanation
                <span className="ml-1">{explanationsExpanded ? "▾" : "▸"}</span>
              </button>
            ) : (
              <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Plain-language explanation
              </p>
            )}
            {explanationsExpanded || !showExplanationToggle ? (
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {explanation}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
