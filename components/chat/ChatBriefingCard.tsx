"use client";

import { BriefingSection } from "@/components/BriefingSection";
import type { ExplainContextParams } from "@/components/SelectableExplain";
import type { ChairBriefing, GlossaryEntry } from "@/lib/schemas";

type Props = {
  briefing: ChairBriefing;
  glossaryEntries: GlossaryEntry[];
  briefingExplanationByKey: Map<string, string>;
  showExplanationToggle: boolean;
  explainContext: ExplainContextParams;
  explainDisabled: boolean;
};

export function ChatBriefingCard({
  briefing,
  glossaryEntries,
  briefingExplanationByKey,
  showExplanationToggle,
  explainContext,
  explainDisabled,
}: Props) {
  return (
    <li className="flex justify-start py-2">
      <div className="w-full max-w-[min(36rem,95%)] rounded-2xl rounded-tl-sm border border-amber-200/90 bg-gradient-to-b from-amber-50/95 to-white px-4 py-3 shadow-md dark:border-amber-800/60 dark:from-amber-950/50 dark:to-zinc-950/80">
        <div className="mb-3 flex items-center gap-2 border-b border-amber-200/50 pb-2 dark:border-amber-800/40">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-300 text-sm font-semibold text-amber-950 dark:bg-amber-700 dark:text-amber-50"
            aria-hidden
          >
            C
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Chair</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">briefing · pinned</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            <BriefingSection
              title=""
              text={briefing.headline}
              section="headline"
              glossaryEntries={glossaryEntries}
              explanation={briefingExplanationByKey.get("headline")}
              showExplanationToggle={showExplanationToggle}
              explainContext={explainContext}
              explainDisabled={explainDisabled}
            />
          </div>

          <div className="space-y-2 border-t border-amber-100 pt-3 dark:border-amber-900/40">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Key takeaways
            </p>
            <ul className="list-outside list-disc space-y-2 pl-4">
              {briefing.keyTakeaways.map((x, i) => (
                <BriefingSection
                  key={i}
                  title=""
                  text={x}
                  section="keyTakeaways"
                  sectionIndex={i}
                  glossaryEntries={glossaryEntries}
                  explanation={briefingExplanationByKey.get(`keyTakeaways:${i}`)}
                  showExplanationToggle={showExplanationToggle}
                  explainContext={explainContext}
                  explainDisabled={explainDisabled}
                  asListItem
                />
              ))}
            </ul>
          </div>

          <BriefingSection
            title="Board conclusion"
            text={briefing.thesis}
            section="thesis"
            glossaryEntries={glossaryEntries}
            explanation={briefingExplanationByKey.get("thesis")}
            showExplanationToggle={showExplanationToggle}
            explainContext={explainContext}
            explainDisabled={explainDisabled}
          />

          <div className="space-y-3 border-t border-amber-100 pt-3 dark:border-amber-900/40">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Concerns & validation
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Key concerns</p>
              <ul className="list-outside list-disc space-y-2 pl-4">
                {briefing.keyRisks.map((x, i) => (
                  <BriefingSection
                    key={i}
                    title=""
                    text={x}
                    section="keyRisks"
                    sectionIndex={i}
                    glossaryEntries={glossaryEntries}
                    explanation={briefingExplanationByKey.get(`keyRisks:${i}`)}
                    showExplanationToggle={showExplanationToggle}
                    explainContext={explainContext}
                    explainDisabled={explainDisabled}
                    asListItem
                  />
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Experiments</p>
              <ul className="list-outside list-disc space-y-2 pl-4">
                {briefing.experiments.map((x, i) => (
                  <BriefingSection
                    key={i}
                    title=""
                    text={x}
                    section="experiments"
                    sectionIndex={i}
                    glossaryEntries={glossaryEntries}
                    explanation={briefingExplanationByKey.get(`experiments:${i}`)}
                    showExplanationToggle={showExplanationToggle}
                    explainContext={explainContext}
                    explainDisabled={explainDisabled}
                    asListItem
                  />
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-2 border-t border-amber-100 pt-3 dark:border-amber-900/40">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Next steps
            </p>
            <ol className="list-outside list-decimal space-y-2 pl-4">
              {briefing.sevenDayPlan.map((x, i) => (
                <BriefingSection
                  key={i}
                  title=""
                  text={x}
                  section="sevenDayPlan"
                  sectionIndex={i}
                  glossaryEntries={glossaryEntries}
                  explanation={briefingExplanationByKey.get(`sevenDayPlan:${i}`)}
                  showExplanationToggle={showExplanationToggle}
                  explainContext={explainContext}
                  explainDisabled={explainDisabled}
                  asListItem
                />
              ))}
            </ol>
          </div>

          {briefing.openQuestions.length > 0 ? (
            <div className="space-y-2 border-t border-amber-100 pt-3 dark:border-amber-900/40">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Open questions
              </p>
              <ul className="list-outside list-disc space-y-2 pl-4">
                {briefing.openQuestions.map((x, i) => (
                  <BriefingSection
                    key={i}
                    title=""
                    text={x}
                    section="openQuestions"
                    sectionIndex={i}
                    glossaryEntries={glossaryEntries}
                    explanation={briefingExplanationByKey.get(`openQuestions:${i}`)}
                    showExplanationToggle={showExplanationToggle}
                    explainContext={explainContext}
                    explainDisabled={explainDisabled}
                    asListItem
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {briefing.dissentOrUnresolved ? (
            <BriefingSection
              title="Dissent / unresolved"
              text={briefing.dissentOrUnresolved}
              section="dissentOrUnresolved"
              glossaryEntries={glossaryEntries}
              explanation={briefingExplanationByKey.get("dissentOrUnresolved")}
              showExplanationToggle={showExplanationToggle}
              explainContext={explainContext}
              explainDisabled={explainDisabled}
              titleTone="warning"
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}
