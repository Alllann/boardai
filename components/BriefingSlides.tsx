"use client";

import { useEffect, useMemo, useRef } from "react";
import type { RevealApi } from "reveal.js";
import "reveal.js/reveal.css";
import "./briefing-reveal.css";

import { BriefingSection } from "@/components/BriefingSection";
import { GlossaryText } from "@/components/GlossaryText";
import {
  condenseBriefingItem,
  condensePlanText,
  estimateCardWeight,
  estimateTimelineWeight,
  packItemsByWeight,
  paginateLabel,
  parseBriefingItem,
  parsePlanItem,
  SLIDE_LIMITS,
  splitTextBlocks,
} from "@/lib/briefing-slide-utils";
import type { BriefingSection as BriefingSectionId, ChairBriefing, GlossaryEntry } from "@/lib/schemas";

type SlideItem = {
  text: string;
  section: BriefingSectionId;
  sectionIndex?: number;
};

type SlideTheme = "hero" | "cards" | "timeline" | "quote" | "warning";
type SlideTransition = "fade" | "slide" | "convex" | "zoom";

export type BriefingSlide = {
  id: string;
  title: string;
  subtitle?: string;
  kind: "headline" | "list" | "text";
  theme: SlideTheme;
  transition: SlideTransition;
  backgroundColor: string;
  text?: string;
  section?: BriefingSectionId;
  items?: SlideItem[];
  ordered?: boolean;
  titleTone?: "warning";
  pageLabel?: string;
};

function listSlides(
  id: string,
  title: string,
  items: SlideItem[],
  opts: {
    subtitle?: string;
    ordered?: boolean;
    theme?: SlideTheme;
    transition?: SlideTransition;
    backgroundColor?: string;
    pack?: "cards" | "timeline";
  } = {},
): BriefingSlide[] {
  const packKind = opts.pack ?? (opts.theme === "timeline" ? "timeline" : "cards");
  const chunks =
    packKind === "timeline"
      ? packItemsByWeight(
          items,
          (item, index) => estimateTimelineWeight(item.text, index),
          SLIDE_LIMITS.timelineSlideWeight,
          SLIDE_LIMITS.maxTimelinePerSlide,
        )
      : packItemsByWeight(
          items,
          (item) => estimateCardWeight(item.text),
          SLIDE_LIMITS.cardSlideWeight,
          SLIDE_LIMITS.maxCardsPerSlide,
        );

  return chunks.map((chunk, pageIndex) => ({
    id: chunks.length > 1 ? `${id}-${pageIndex + 1}` : id,
    title,
    subtitle: opts.subtitle,
    kind: "list" as const,
    theme: opts.theme ?? "cards",
    transition: opts.transition ?? "slide",
    backgroundColor: opts.backgroundColor ?? "var(--briefing-bg-default)",
    items: chunk,
    ordered: opts.ordered,
    pageLabel: paginateLabel(pageIndex, chunks.length),
  }));
}

function textSlides(
  id: string,
  title: string,
  text: string,
  opts: {
    subtitle?: string;
    theme: SlideTheme;
    transition: SlideTransition;
    backgroundColor: string;
    section: BriefingSectionId;
    titleTone?: "warning";
  },
): BriefingSlide[] {
  const maxChars =
    opts.theme === "quote" || opts.theme === "warning"
      ? SLIDE_LIMITS.quoteBody
      : SLIDE_LIMITS.heroHeadline;
  const blocks = splitTextBlocks(text, maxChars);

  return blocks.map((block, pageIndex) => ({
    id: blocks.length > 1 ? `${id}-${pageIndex + 1}` : id,
    title,
    subtitle: opts.subtitle,
    kind: "text" as const,
    theme: opts.theme,
    transition: opts.transition,
    backgroundColor: opts.backgroundColor,
    text: block,
    section: opts.section,
    titleTone: opts.titleTone,
    pageLabel: paginateLabel(pageIndex, blocks.length),
  }));
}

export function buildBriefingSlides(briefing: ChairBriefing): BriefingSlide[] {
  const headlineBlocks = splitTextBlocks(briefing.headline, SLIDE_LIMITS.heroHeadline);
  const slides: BriefingSlide[] = headlineBlocks.map((block, pageIndex) => ({
    id: headlineBlocks.length > 1 ? `headline-${pageIndex + 1}` : "headline",
    title: "Executive summary",
    subtitle: pageIndex === 0 ? "Bottom line up front" : "Executive summary (continued)",
    kind: "headline" as const,
    theme: "hero" as const,
    transition: "fade" as const,
    backgroundColor: "var(--briefing-bg-hero)",
    text: block,
    section: "headline" as const,
    pageLabel: paginateLabel(pageIndex, headlineBlocks.length),
  }));

  slides.push(
    ...listSlides("takeaways", "Key takeaways", briefing.keyTakeaways.map((text, i) => ({
      text,
      section: "keyTakeaways" as const,
      sectionIndex: i,
    })), {
      theme: "cards",
      transition: "slide",
      backgroundColor: "var(--briefing-bg-default)",
      pack: "cards",
    }),
    ...textSlides("thesis", "Board conclusion", briefing.thesis, {
      theme: "quote",
      transition: "fade",
      backgroundColor: "var(--briefing-bg-quote)",
      section: "thesis",
    }),
    ...listSlides("risks", "Key risks", briefing.keyRisks.map((text, i) => ({
      text,
      section: "keyRisks" as const,
      sectionIndex: i,
    })), {
      subtitle: "Risks & validation",
      theme: "cards",
      transition: "convex",
      backgroundColor: "var(--briefing-bg-risk)",
      pack: "cards",
    }),
    ...listSlides("experiments", "Experiments", briefing.experiments.map((text, i) => ({
      text,
      section: "experiments" as const,
      sectionIndex: i,
    })), {
      subtitle: "Risks & validation",
      theme: "cards",
      transition: "slide",
      backgroundColor: "var(--briefing-bg-experiment)",
      pack: "cards",
    }),
    ...listSlides("plan", "Next steps", briefing.sevenDayPlan.map((text, i) => ({
      text,
      section: "sevenDayPlan" as const,
      sectionIndex: i,
    })), {
      subtitle: "7-day plan",
      ordered: true,
      theme: "timeline",
      transition: "slide",
      backgroundColor: "var(--briefing-bg-plan)",
      pack: "timeline",
    }),
  );

  if (briefing.openQuestions.length > 0) {
    slides.push(
      ...listSlides("questions", "Open questions", briefing.openQuestions.map((text, i) => ({
        text,
        section: "openQuestions" as const,
        sectionIndex: i,
      })), {
        theme: "cards",
        transition: "fade",
        backgroundColor: "var(--briefing-bg-question)",
        pack: "cards",
      }),
    );
  }

  if (briefing.dissentOrUnresolved?.trim()) {
    slides.push(
      ...textSlides("dissent", "Dissent / unresolved", briefing.dissentOrUnresolved, {
        theme: "warning",
        transition: "fade",
        backgroundColor: "var(--briefing-bg-warning)",
        section: "dissentOrUnresolved",
        titleTone: "warning",
      }),
    );
  }

  return slides;
}

type Props = {
  briefing: ChairBriefing;
  glossaryEntries: GlossaryEntry[];
};

function BriefingSlideHeader({ slide }: { slide: BriefingSlide }) {
  return (
    <>
      {slide.subtitle ? <p className="briefing-slide-subtitle">{slide.subtitle}</p> : null}
      <h3 className="briefing-slide-title">{slide.title}</h3>
      {slide.pageLabel ? <p className="briefing-slide-page-label">{slide.pageLabel}</p> : null}
    </>
  );
}

function BriefingHeroSlide({
  slide,
  glossaryEntries,
}: {
  slide: BriefingSlide;
  glossaryEntries: GlossaryEntry[];
}) {
  if (!slide.text) return null;

  return (
    <div className="briefing-hero r-vstack">
      {slide.subtitle ? <p className="briefing-kicker">{slide.subtitle}</p> : null}
      <h2 className="briefing-hero-title">{slide.title}</h2>
      <div className="briefing-hero-headline">
        <GlossaryText text={slide.text} entries={glossaryEntries} />
      </div>
    </div>
  );
}

function BriefingCardsSlide({
  slide,
  glossaryEntries,
}: {
  slide: BriefingSlide;
  glossaryEntries: GlossaryEntry[];
}) {
  if (!slide.items?.length) return null;

  return (
    <>
      <BriefingSlideHeader slide={slide} />
      <ul className="briefing-card-list">
        {slide.items.map((item, i) => {
          const parsed = condenseBriefingItem(item.text);
          return (
            <li key={`${slide.id}-${i}`} className="briefing-card" style={{ animationDelay: `${i * 70}ms` }}>
              <p className="briefing-card-lead">
                <GlossaryText text={parsed.lead} entries={glossaryEntries} />
              </p>
              {parsed.detail ? (
                <p className="briefing-card-detail">
                  <GlossaryText text={parsed.detail} entries={glossaryEntries} />
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function BriefingTimelineSlide({
  slide,
  glossaryEntries,
}: {
  slide: BriefingSlide;
  glossaryEntries: GlossaryEntry[];
}) {
  if (!slide.items?.length) return null;

  return (
    <>
      <BriefingSlideHeader slide={slide} />
      <ol className="briefing-timeline">
        {slide.items.map((item, i) => {
          const parsed = parsePlanItem(item.text, item.sectionIndex ?? i);
          const parsedBody = condenseBriefingItem(condensePlanText(parsed.text));
          return (
            <li key={`${slide.id}-${i}`} className="briefing-timeline-row" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="briefing-timeline-badge">{parsed.dayLabel}</span>
              <div className="briefing-timeline-body">
                <p className="briefing-timeline-lead">
                  <GlossaryText text={parsedBody.lead} entries={glossaryEntries} />
                </p>
                {parsedBody.detail ? (
                  <p className="briefing-timeline-detail">
                    <GlossaryText text={parsedBody.detail} entries={glossaryEntries} />
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function BriefingQuoteSlide({
  slide,
  glossaryEntries,
}: {
  slide: BriefingSlide;
  glossaryEntries: GlossaryEntry[];
}) {
  if (!slide.text) return null;

  return (
    <>
      <BriefingSlideHeader slide={slide} />
      <blockquote className="briefing-quote">
        <GlossaryText text={slide.text} entries={glossaryEntries} />
      </blockquote>
    </>
  );
}

function BriefingWarningSlide({
  slide,
  glossaryEntries,
}: {
  slide: BriefingSlide;
  glossaryEntries: GlossaryEntry[];
}) {
  if (!slide.text) return null;

  return (
    <>
      <BriefingSlideHeader slide={slide} />
      <div className="briefing-callout">
        <BriefingSection
          title=""
          text={slide.text}
          glossaryEntries={glossaryEntries}
          titleTone="warning"
        />
      </div>
    </>
  );
}

function BriefingSlideBody({
  slide,
  glossaryEntries,
}: {
  slide: BriefingSlide;
  glossaryEntries: GlossaryEntry[];
}) {
  switch (slide.theme) {
    case "hero":
      return <BriefingHeroSlide slide={slide} glossaryEntries={glossaryEntries} />;
    case "cards":
      return <BriefingCardsSlide slide={slide} glossaryEntries={glossaryEntries} />;
    case "timeline":
      return <BriefingTimelineSlide slide={slide} glossaryEntries={glossaryEntries} />;
    case "quote":
      return <BriefingQuoteSlide slide={slide} glossaryEntries={glossaryEntries} />;
    case "warning":
      return <BriefingWarningSlide slide={slide} glossaryEntries={glossaryEntries} />;
    default:
      return null;
  }
}

function sectionClassName(slide: BriefingSlide): string {
  const classes = [`briefing-slide-${slide.theme}`];
  if (slide.theme === "hero") classes.push("center");
  return classes.join(" ");
}

export function BriefingSlides({ briefing, glossaryEntries }: Props) {
  const slides = useMemo(() => buildBriefingSlides(briefing), [briefing]);
  const shellRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const deckEl = deckRef.current;
    const shellEl = shellRef.current;
    if (!deckEl || !shellEl || slides.length === 0) return;

    let cancelled = false;
    let api: RevealApi | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const measureShell = () => {
      let width = shellEl.clientWidth;
      let height = shellEl.clientHeight;
      if (width === 0) {
        width = shellEl.parentElement?.clientWidth ?? 0;
      }
      if (width === 0) {
        width = Math.round(shellEl.getBoundingClientRect().width);
      }
      return {
        width: Math.max(width, 280),
        height: Math.max(height, 288),
      };
    };

    const init = async () => {
      for (let i = 0; i < 60; i++) {
        const { width, height } = measureShell();
        if (width > 0 && height > 0) break;
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      }
      const { width, height } = measureShell();
      if (cancelled || !deckRef.current || width === 0 || height === 0) return;

      const { default: Reveal } = await import("reveal.js");
      if (cancelled || !deckRef.current) return;

      const deck = new Reveal(deckRef.current, {});
      api = deck;
      await deck.initialize({
        embedded: true,
        autoAnimate: false,
        fragments: false,
        width,
        height,
        margin: 0.04,
        minScale: 0.5,
        maxScale: 1,
        controls: true,
        controlsLayout: "bottom-right",
        progress: true,
        slideNumber: "c/t",
        hash: false,
        respondToHashChanges: false,
        keyboard: true,
        keyboardCondition: "focused",
        overview: false,
        center: false,
        touch: true,
        transition: "slide",
        backgroundTransition: "fade",
        help: false,
        pause: false,
      });

      if (cancelled) {
        deck.destroy();
        api = null;
        return;
      }

      deck.slide(0, 0);
      deck.layout();
      requestAnimationFrame(() => {
        if (!cancelled) deck.layout();
      });

      resizeObserver = new ResizeObserver(() => {
        if (!api) return;
        const next = measureShell();
        if (next.width === 0 || next.height === 0) return;
        api.configure({ width: next.width, height: next.height });
        api.layout();
      });
      resizeObserver.observe(shellEl);
    };

    void init();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      api?.destroy();
      document.documentElement.classList.remove("reveal-full-page");
    };
  }, [slides]);

  return (
    <div
      ref={shellRef}
      className="briefing-reveal-shell w-full"
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Executive brief slides"
    >
      <div ref={deckRef} className="reveal">
        <div className="slides">
          {slides.map((slide) => (
            <section
              key={slide.id}
              className={sectionClassName(slide)}
              data-transition={slide.transition}
              data-background-color={slide.backgroundColor}
              data-background-transition="fade"
            >
              <div className="briefing-slide-inner">
                <BriefingSlideBody slide={slide} glossaryEntries={glossaryEntries} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
