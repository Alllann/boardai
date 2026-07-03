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
      disabled={explainDisabled}
    />
  );

  if (asListItem) {
    return <li className="text-sm">{body}</li>;
  }

  const titleClass =
    titleTone === "warning"
      ? "text-xs font-medium text-[var(--text-primary)]"
      : "text-xs font-medium text-[var(--text-tertiary)]";

  return (
    <div className="space-y-2">
      {title ? <h3 className={titleClass}>{title}</h3> : null}
      <div className="text-sm leading-relaxed text-[var(--text-secondary)]">{body}</div>
    </div>
  );
}
