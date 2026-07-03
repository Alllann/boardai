"use client";

import { BriefingSlides } from "@/components/BriefingSlides";
import type { ExplainContextParams } from "@/components/SelectableExplain";
import type { ChairBriefing, GlossaryEntry } from "@/lib/schemas";

type Props = {
  briefing: ChairBriefing;
  glossaryEntries: GlossaryEntry[];
  explainContext: ExplainContextParams;
  explainDisabled: boolean;
};

export function ChatBriefingCard({
  briefing,
  glossaryEntries,
  explainContext,
  explainDisabled,
}: Props) {
  return (
    <li className="flex justify-start py-2">
      <div className="w-full max-w-[min(48rem,95%)] rounded-[var(--radius-soft)] bg-[var(--peer-msg-bg)] px-5 py-4">
        <div className="mb-4 flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[11px] font-medium text-[var(--text-primary)]"
            aria-hidden
          >
            C
          </span>
          <div>
            <p className="text-sm font-normal text-[var(--text-primary)]">Executive brief</p>
            <p className="text-xs text-[var(--text-tertiary)]">Swipe or use arrows · select text to explain</p>
          </div>
        </div>

        <BriefingSlides
          briefing={briefing}
          glossaryEntries={glossaryEntries}
          explainContext={explainContext}
          explainDisabled={explainDisabled}
        />
      </div>
    </li>
  );
}
