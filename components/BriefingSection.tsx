"use client";

import { GlossaryText } from "@/components/GlossaryText";
import type { GlossaryEntry } from "@/lib/schemas";

type Props = {
  title: string;
  text: string;
  glossaryEntries: GlossaryEntry[];
  asListItem?: boolean;
  titleTone?: "default" | "warning";
};

export function BriefingSection({
  title,
  text,
  glossaryEntries,
  asListItem = false,
  titleTone = "default",
}: Props) {
  const body = <GlossaryText text={text} entries={glossaryEntries} />;

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
