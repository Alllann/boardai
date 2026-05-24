"use client";

import {
  SelectableExplain,
  type ExplainContextParams,
} from "@/components/SelectableExplain";
import type { BriefingSection as BriefingSectionId, GlossaryEntry } from "@/lib/schemas";

type Props = {
  title: string;
  text: string;
  section: BriefingSectionId;
  sectionIndex?: number;
  glossaryEntries: GlossaryEntry[];
  explainContext: ExplainContextParams;
  explainDisabled: boolean;
  asListItem?: boolean;
  titleTone?: "default" | "warning";
};

export function BriefingSection({
  title,
  text,
  section,
  sectionIndex,
  glossaryEntries,
  explainContext,
  explainDisabled,
  asListItem = false,
  titleTone = "default",
}: Props) {
  const context: ExplainContextParams = {
    ...explainContext,
    source: "briefing",
    section,
    sectionIndex,
  };

  const body = (
    <SelectableExplain
      text={text}
      glossaryEntries={glossaryEntries}
      context={context}
      blockText={text}
      showBlockExplain
      disabled={explainDisabled}
    />
  );

  if (asListItem) {
    return <li className="text-sm text-zinc-800 dark:text-zinc-200">{body}</li>;
  }

  const titleClass =
    titleTone === "warning"
      ? "text-xs font-semibold uppercase text-amber-700 dark:text-amber-400"
      : "text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400";

  return (
    <div className="space-y-2">
      {title ? <h3 className={titleClass}>{title}</h3> : null}
      <div className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {body}
      </div>
    </div>
  );
}
