"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { BriefingSection } from "@/components/BriefingSection";
import type { ExplainContextParams } from "@/components/SelectableExplain";
import type { BriefingSection as BriefingSectionId, ChairBriefing, GlossaryEntry } from "@/lib/schemas";

type SlideItem = {
  text: string;
  section: BriefingSectionId;
  sectionIndex?: number;
};

export type BriefingSlide = {
  id: string;
  title: string;
  subtitle?: string;
  kind: "headline" | "list" | "text";
  text?: string;
  section?: BriefingSectionId;
  items?: SlideItem[];
  ordered?: boolean;
  titleTone?: "warning";
};

export function buildBriefingSlides(briefing: ChairBriefing): BriefingSlide[] {
  const slides: BriefingSlide[] = [
    {
      id: "headline",
      title: "Executive summary",
      subtitle: "Bottom line up front",
      kind: "headline",
      text: briefing.headline,
      section: "headline",
    },
    {
      id: "takeaways",
      title: "Key takeaways",
      kind: "list",
      items: briefing.keyTakeaways.map((text, i) => ({
        text,
        section: "keyTakeaways",
        sectionIndex: i,
      })),
    },
    {
      id: "thesis",
      title: "Board conclusion",
      kind: "text",
      text: briefing.thesis,
      section: "thesis",
    },
    {
      id: "risks",
      title: "Key risks",
      subtitle: "Risks & validation",
      kind: "list",
      items: briefing.keyRisks.map((text, i) => ({
        text,
        section: "keyRisks",
        sectionIndex: i,
      })),
    },
    {
      id: "experiments",
      title: "Experiments",
      subtitle: "Risks & validation",
      kind: "list",
      items: briefing.experiments.map((text, i) => ({
        text,
        section: "experiments",
        sectionIndex: i,
      })),
    },
    {
      id: "plan",
      title: "Next steps",
      subtitle: "7-day plan",
      kind: "list",
      ordered: true,
      items: briefing.sevenDayPlan.map((text, i) => ({
        text,
        section: "sevenDayPlan",
        sectionIndex: i,
      })),
    },
  ];

  if (briefing.openQuestions.length > 0) {
    slides.push({
      id: "questions",
      title: "Open questions",
      kind: "list",
      items: briefing.openQuestions.map((text, i) => ({
        text,
        section: "openQuestions",
        sectionIndex: i,
      })),
    });
  }

  if (briefing.dissentOrUnresolved?.trim()) {
    slides.push({
      id: "dissent",
      title: "Dissent / unresolved",
      kind: "text",
      text: briefing.dissentOrUnresolved,
      section: "dissentOrUnresolved",
      titleTone: "warning",
    });
  }

  return slides;
}

type Props = {
  briefing: ChairBriefing;
  glossaryEntries: GlossaryEntry[];
  explainContext: ExplainContextParams;
  explainDisabled: boolean;
};

export function BriefingSlides({
  briefing,
  glossaryEntries,
  explainContext,
  explainDisabled,
}: Props) {
  const slides = useMemo(() => buildBriefingSlides(briefing), [briefing]);
  const [index, setIndex] = useState(0);

  const slide = slides[index]!;
  const atStart = index === 0;
  const atEnd = index >= slides.length - 1;

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    setIndex(0);
  }, [briefing]);

  const onSlidesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  };

  const listClass = slide.ordered
    ? "list-outside list-decimal space-y-2.5 pl-4"
    : "list-outside list-disc space-y-2.5 pl-4";

  return (
    <div
      className="space-y-4 outline-none"
      tabIndex={0}
      onKeyDown={onSlidesKeyDown}
      aria-roledescription="carousel"
      aria-label="Executive brief slides"
    >
      <div className="min-h-[16rem] rounded-[var(--radius-soft)] bg-[var(--surface-raised)] px-5 py-5 md:min-h-[18rem] md:px-6 md:py-6">
        <div className="mb-4">
          {slide.subtitle ? (
            <p className="text-xs text-[var(--text-tertiary)]">{slide.subtitle}</p>
          ) : null}
          <h3
            className={`mt-0.5 text-lg font-medium leading-snug text-[var(--text-primary)] ${
              slide.titleTone === "warning" ? "text-[var(--text-primary)]" : ""
            }`}
          >
            {slide.title}
          </h3>
        </div>

        {slide.kind === "headline" && slide.text && slide.section ? (
          <div className="text-[17px] font-medium leading-snug text-[var(--text-primary)] md:text-xl">
            <BriefingSection
              title=""
              text={slide.text}
              section={slide.section}
              glossaryEntries={glossaryEntries}
              explainContext={explainContext}
              explainDisabled={explainDisabled}
            />
          </div>
        ) : null}

        {slide.kind === "text" && slide.text && slide.section ? (
          <BriefingSection
            title=""
            text={slide.text}
            section={slide.section}
            glossaryEntries={glossaryEntries}
            explainContext={explainContext}
            explainDisabled={explainDisabled}
            titleTone={slide.titleTone}
          />
        ) : null}

        {slide.kind === "list" && slide.items ? (
          slide.ordered ? (
            <ol className={`${listClass} text-[var(--text-secondary)]`}>
              {slide.items.map((item, i) => (
                <BriefingSection
                  key={`${slide.id}-${i}`}
                  title=""
                  text={item.text}
                  section={item.section}
                  sectionIndex={item.sectionIndex}
                  glossaryEntries={glossaryEntries}
                  explainContext={explainContext}
                  explainDisabled={explainDisabled}
                  asListItem
                />
              ))}
            </ol>
          ) : (
            <ul className={`${listClass} text-[var(--text-secondary)]`}>
              {slide.items.map((item, i) => (
                <BriefingSection
                  key={`${slide.id}-${i}`}
                  title=""
                  text={item.text}
                  section={item.section}
                  sectionIndex={item.sectionIndex}
                  glossaryEntries={glossaryEntries}
                  explainContext={explainContext}
                  explainDisabled={explainDisabled}
                  asListItem
                />
              ))}
            </ul>
          )
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={atStart}
          aria-label="Previous slide"
          className="rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Briefing slides">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${s.title}, slide ${i + 1} of ${slides.length}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-5 bg-[var(--text-primary)]"
                    : "w-1.5 bg-[var(--border-medium)] hover:bg-[var(--text-tertiary)]"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] tabular-nums text-[var(--text-tertiary)]">
            {index + 1} / {slides.length}
          </p>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={atEnd}
          aria-label="Next slide"
          className="rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
