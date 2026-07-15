"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
  getSlideLimits,
  packItemsByWeight,
  paginateLabel,
  parsePlanItem,
  splitTextBlocks,
  type BriefingDensity,
} from "@/lib/briefing-slide-utils";
import type { BriefingSection as BriefingSectionId, ChairBriefing, GlossaryEntry } from "@/lib/schemas";

type SlideItem = {
  text: string;
  section: BriefingSectionId;
  sectionIndex?: number;
};

type SlideTheme = "hero" | "cards" | "timeline" | "milestones" | "quote" | "warning";
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

const SWIPE_THRESHOLD = 36;

function listSlides(
  id: string,
  title: string,
  items: SlideItem[],
  density: BriefingDensity,
  opts: {
    subtitle?: string;
    ordered?: boolean;
    theme?: SlideTheme;
    transition?: SlideTransition;
    backgroundColor?: string;
    pack?: "cards" | "timeline" | "milestones";
  } = {},
): BriefingSlide[] {
  const limits = getSlideLimits(density);
  const packKind = opts.pack ?? (opts.theme === "timeline" ? "timeline" : "cards");
  const chunks =
    packKind === "milestones"
      ? // Keep selective milestones on a single slide when possible.
        packItemsByWeight(
          items,
          (item) => estimateCardWeight(item.text, density),
          limits.milestoneSlideWeight,
          limits.maxMilestonesPerSlide,
        )
      : packKind === "timeline"
        ? packItemsByWeight(
            items,
            (item, index) => estimateTimelineWeight(item.text, index, density),
            limits.timelineSlideWeight,
            limits.maxTimelinePerSlide,
          )
        : packItemsByWeight(
            items,
            (item) => estimateCardWeight(item.text, density),
            limits.cardSlideWeight,
            limits.maxCardsPerSlide,
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
  density: BriefingDensity,
  opts: {
    subtitle?: string;
    theme: SlideTheme;
    transition: SlideTransition;
    backgroundColor: string;
    section: BriefingSectionId;
    titleTone?: "warning";
  },
): BriefingSlide[] {
  const limits = getSlideLimits(density);
  const maxChars =
    opts.theme === "quote" || opts.theme === "warning"
      ? limits.quoteBody
      : limits.heroHeadline;
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

export function buildBriefingSlides(
  briefing: ChairBriefing,
  density: BriefingDensity = "compact",
): BriefingSlide[] {
  const limits = getSlideLimits(density);
  const headlineBlocks = splitTextBlocks(briefing.headline, limits.heroHeadline);
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
    })), density, {
      theme: "cards",
      transition: "slide",
      backgroundColor: "var(--briefing-bg-default)",
      pack: "cards",
    }),
    ...textSlides("thesis", "Board conclusion", briefing.thesis, density, {
      theme: "quote",
      transition: "fade",
      backgroundColor: "var(--briefing-bg-quote)",
      section: "thesis",
    }),
    ...listSlides("risks", "Key risks", briefing.keyRisks.map((text, i) => ({
      text,
      section: "keyRisks" as const,
      sectionIndex: i,
    })), density, {
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
    })), density, {
      subtitle: "Risks & validation",
      theme: "cards",
      transition: "slide",
      backgroundColor: "var(--briefing-bg-experiment)",
      pack: "cards",
    }),
    ...listSlides(
      "milestones",
      "Suggested milestones",
      briefing.suggestedMilestones.map((text, i) => ({
        text,
        section: "suggestedMilestones" as const,
        sectionIndex: i,
      })),
      density,
      {
        subtitle: "Do these next",
        theme: "milestones",
        transition: "slide",
        backgroundColor: "var(--briefing-bg-plan)",
        pack: "milestones",
      },
    ),
  );

  if (briefing.openQuestions.length > 0) {
    slides.push(
      ...listSlides("questions", "Open questions", briefing.openQuestions.map((text, i) => ({
        text,
        section: "openQuestions" as const,
        sectionIndex: i,
      })), density, {
        theme: "cards",
        transition: "fade",
        backgroundColor: "var(--briefing-bg-question)",
        pack: "cards",
      }),
    );
  }

  if (briefing.dissentOrUnresolved?.trim()) {
    slides.push(
      ...textSlides("dissent", "Dissent / unresolved", briefing.dissentOrUnresolved, density, {
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

type DeckProps = {
  briefing: ChairBriefing;
  glossaryEntries: GlossaryEntry[];
  density?: BriefingDensity;
  initialSlideIndex?: number;
  onSlideIndexChange?: (index: number) => void;
  toolbar?: ReactNode;
};

function BriefingSlideHeader({ slide }: { slide: BriefingSlide }) {
  return (
    <header className="briefing-slide-header">
      {slide.subtitle ? <p className="briefing-slide-subtitle">{slide.subtitle}</p> : null}
      <h3 className="briefing-slide-title">{slide.title}</h3>
      {slide.pageLabel ? <p className="briefing-slide-page-label">{slide.pageLabel}</p> : null}
    </header>
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
  density,
}: {
  slide: BriefingSlide;
  glossaryEntries: GlossaryEntry[];
  density: BriefingDensity;
}) {
  if (!slide.items?.length) return null;

  return (
    <>
      <BriefingSlideHeader slide={slide} />
      <ul className="briefing-card-list">
        {slide.items.map((item, i) => {
          const parsed = condenseBriefingItem(item.text, density);
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
  density,
}: {
  slide: BriefingSlide;
  glossaryEntries: GlossaryEntry[];
  density: BriefingDensity;
}) {
  if (!slide.items?.length) return null;

  return (
    <>
      <BriefingSlideHeader slide={slide} />
      <ol className="briefing-timeline">
        {slide.items.map((item, i) => {
          const parsed = parsePlanItem(item.text, item.sectionIndex ?? i);
          const bodyText = condensePlanText(parsed.text, density);
          const parsedBody = condenseBriefingItem(bodyText, density);
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

function BriefingMilestonesSlide({
  slide,
  glossaryEntries,
  density,
}: {
  slide: BriefingSlide;
  glossaryEntries: GlossaryEntry[];
  density: BriefingDensity;
}) {
  if (!slide.items?.length) return null;

  return (
    <>
      <BriefingSlideHeader slide={slide} />
      <ol className="briefing-milestone-list">
        {slide.items.map((item, i) => {
          const parsed = condenseBriefingItem(item.text, density);
          const n = (item.sectionIndex ?? i) + 1;
          return (
            <li
              key={`${slide.id}-${i}`}
              className="briefing-milestone"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="briefing-milestone-index" aria-hidden>
                {n}
              </span>
              <div className="briefing-milestone-body">
                <p className="briefing-milestone-lead">
                  <GlossaryText text={parsed.lead} entries={glossaryEntries} />
                </p>
                {parsed.detail ? (
                  <p className="briefing-milestone-detail">
                    <GlossaryText text={parsed.detail} entries={glossaryEntries} />
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

function BriefingSlideBody({
  slide,
  glossaryEntries,
  density,
}: {
  slide: BriefingSlide;
  glossaryEntries: GlossaryEntry[];
  density: BriefingDensity;
}) {
  switch (slide.theme) {
    case "hero":
      return <BriefingHeroSlide slide={slide} glossaryEntries={glossaryEntries} />;
    case "cards":
      return <BriefingCardsSlide slide={slide} glossaryEntries={glossaryEntries} density={density} />;
    case "milestones":
      return (
        <BriefingMilestonesSlide slide={slide} glossaryEntries={glossaryEntries} density={density} />
      );
    case "timeline":
      return <BriefingTimelineSlide slide={slide} glossaryEntries={glossaryEntries} density={density} />;
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

function MaximizeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function BriefingSlidesDeck({
  briefing,
  glossaryEntries,
  density = "compact",
  initialSlideIndex = 0,
  onSlideIndexChange,
  toolbar,
}: DeckProps) {
  const slides = useMemo(() => buildBriefingSlides(briefing, density), [briefing, density]);
  const shellRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<RevealApi | null>(null);
  const initialSlideRef = useRef(initialSlideIndex);
  const onSlideIndexChangeRef = useRef(onSlideIndexChange);
  const touchRef = useRef<{ x: number; y: number; active: boolean; captured: boolean }>({
    x: 0,
    y: 0,
    active: false,
    captured: false,
  });

  onSlideIndexChangeRef.current = onSlideIndexChange;

  const goBySwipe = useCallback((direction: "left" | "right") => {
    const api = apiRef.current;
    if (!api) return;
    if (direction === "left") api.right();
    else api.left();
  }, []);

  useEffect(() => {
    const deckEl = deckRef.current;
    const shellEl = shellRef.current;
    if (!deckEl || !shellEl || slides.length === 0) return;

    let cancelled = false;
    let api: RevealApi | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const measureShell = () => {
      const rect = shellEl.getBoundingClientRect();
      let width = shellEl.clientWidth || Math.round(rect.width);
      let height = shellEl.clientHeight || Math.round(rect.height);

      if (width === 0) {
        width =
          shellEl.parentElement?.clientWidth ||
          Math.round(shellEl.parentElement?.getBoundingClientRect().width ?? 0);
      }
      if (height === 0) {
        height =
          shellEl.parentElement?.clientHeight ||
          Math.round(shellEl.parentElement?.getBoundingClientRect().height ?? 0);
      }

      // Last resort for expanded modal before layout settles
      if (density === "expanded" && height < 120) {
        height = Math.round(window.innerHeight * 0.85);
      }
      if (density === "expanded" && width < 120) {
        width = Math.round(window.innerWidth * 0.92);
      }

      return {
        width: Math.max(width, 280),
        height: Math.max(height, density === "expanded" ? 320 : 288),
      };
    };

    const onSlideChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ indexh?: number }>).detail;
      const index = typeof detail?.indexh === "number" ? detail.indexh : api?.getIndices().h ?? 0;
      onSlideIndexChangeRef.current?.(index);
    };

    const init = async () => {
      // Wait until the shell has a real laid-out size (critical for portaled modal).
      for (let i = 0; i < 90; i++) {
        const rect = shellEl.getBoundingClientRect();
        if (rect.width >= 120 && rect.height >= 120) break;
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
      apiRef.current = deck;
      await deck.initialize({
        embedded: true,
        autoAnimate: false,
        fragments: false,
        width,
        height,
        margin: density === "expanded" ? 0.02 : 0.04,
        minScale: 0.5,
        maxScale: 1,
        controls: true,
        controlsLayout: "bottom-right",
        controlsBackArrows: "visible",
        progress: true,
        slideNumber: "c/t",
        hash: false,
        respondToHashChanges: false,
        keyboard: true,
        keyboardCondition: "focused",
        overview: false,
        center: false,
        // Parent chat scroll steals gestures before Reveal's embedded threshold;
        // we handle horizontal swipes ourselves on the shell.
        touch: false,
        transition: "slide",
        backgroundTransition: "fade",
        help: false,
        pause: false,
      });

      if (cancelled) {
        deck.destroy();
        api = null;
        apiRef.current = null;
        return;
      }

      const startIndex = Math.min(
        Math.max(initialSlideRef.current, 0),
        slides.length - 1,
      );
      deck.slide(startIndex, 0);

      const relayout = () => {
        if (cancelled || !api) return;
        const next = measureShell();
        api.configure({ width: next.width, height: next.height });
        api.layout();
      };

      relayout();
      requestAnimationFrame(() => {
        requestAnimationFrame(relayout);
      });

      deck.on("slidechanged", onSlideChanged);

      resizeObserver = new ResizeObserver(() => {
        relayout();
      });
      resizeObserver.observe(shellEl);
      if (shellEl.parentElement) {
        resizeObserver.observe(shellEl.parentElement);
      }
    };

    void init();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      api?.off("slidechanged", onSlideChanged);
      api?.destroy();
      apiRef.current = null;
      document.documentElement.classList.remove("reveal-full-page");
    };
  }, [slides, density]);

  // Capture horizontal swipes so the chat scroller does not eat them on mobile.
  useEffect(() => {
    const shellEl = shellRef.current;
    if (!shellEl) return;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      touchRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        active: true,
        captured: false,
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      const state = touchRef.current;
      if (!state.active || event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      const dx = touch.clientX - state.x;
      const dy = touch.clientY - state.y;

      if (!state.captured) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          state.captured = true;
        } else {
          state.active = false;
          return;
        }
      }

      if (state.captured) {
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      const state = touchRef.current;
      if (!state.active) return;
      const touch = event.changedTouches[0];
      if (!touch) {
        touchRef.current.active = false;
        return;
      }

      const dx = touch.clientX - state.x;
      const dy = touch.clientY - state.y;
      touchRef.current.active = false;

      if (!state.captured && !(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= SWIPE_THRESHOLD)) {
        return;
      }

      if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goBySwipe("left");
        else goBySwipe("right");
      }
    };

    shellEl.addEventListener("touchstart", onTouchStart, { passive: true });
    shellEl.addEventListener("touchmove", onTouchMove, { passive: false });
    shellEl.addEventListener("touchend", onTouchEnd, { passive: true });
    shellEl.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      shellEl.removeEventListener("touchstart", onTouchStart);
      shellEl.removeEventListener("touchmove", onTouchMove);
      shellEl.removeEventListener("touchend", onTouchEnd);
      shellEl.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [goBySwipe]);

  const shellClass =
    density === "expanded"
      ? "briefing-reveal-shell briefing-reveal-shell--expanded w-full"
      : "briefing-reveal-shell w-full";

  return (
    <div className="briefing-deck-frame relative w-full">
      {toolbar}
      <div
        ref={shellRef}
        className={shellClass}
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
                  <BriefingSlideBody
                    slide={slide}
                    glossaryEntries={glossaryEntries}
                    density={density}
                  />
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  briefing: ChairBriefing;
  glossaryEntries: GlossaryEntry[];
};

export function BriefingSlides({ briefing, glossaryEntries }: Props) {
  const [maximized, setMaximized] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [compactEpoch, setCompactEpoch] = useState(0);
  const [portalReady, setPortalReady] = useState(false);
  const openIndexRef = useRef(0);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const closeMaximized = useCallback(() => {
    const compactSlides = buildBriefingSlides(briefing, "compact");
    const expandedSlides = buildBriefingSlides(briefing, "expanded");
    const currentId = expandedSlides[slideIndex]?.id ?? expandedSlides[0]?.id;
    if (currentId) {
      const sectionKey = currentId.replace(/-\d+$/, "");
      const matchedIndex = compactSlides.findIndex(
        (slide) =>
          slide.id === currentId ||
          slide.id === sectionKey ||
          slide.id.startsWith(`${sectionKey}-`),
      );
      if (matchedIndex >= 0) setSlideIndex(matchedIndex);
    }
    setMaximized(false);
    setCompactEpoch((value) => value + 1);
  }, [briefing, slideIndex]);

  useEffect(() => {
    if (!maximized) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMaximized();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [maximized, closeMaximized]);

  const openMaximized = () => {
    const compactSlides = buildBriefingSlides(briefing, "compact");
    const expandedSlides = buildBriefingSlides(briefing, "expanded");
    const currentId = compactSlides[slideIndex]?.id ?? compactSlides[0]?.id ?? "headline";
    const sectionKey = currentId.replace(/-\d+$/, "");
    const matchedIndex = expandedSlides.findIndex(
      (slide) => slide.id === currentId || slide.id === sectionKey || slide.id.startsWith(`${sectionKey}-`),
    );
    openIndexRef.current = matchedIndex >= 0 ? matchedIndex : 0;
    setMaximized(true);
  };

  const compactToolbar = (
    <button
      type="button"
      onClick={openMaximized}
      className="briefing-deck-max-btn"
      aria-label="Open brief full screen"
      title="Maximize"
    >
      <MaximizeIcon />
    </button>
  );

  const modal =
    portalReady && maximized
      ? createPortal(
          <div className="briefing-deck-modal" role="dialog" aria-modal="true" aria-label="Executive brief">
            <button
              type="button"
              className="briefing-deck-modal-backdrop"
              aria-label="Close full screen brief"
              onClick={closeMaximized}
            />
            <div className="briefing-deck-modal-panel">
              <div className="briefing-deck-modal-header">
                <div className="min-w-0">
                  <p className="briefing-deck-modal-kicker">Board AI</p>
                  <p className="briefing-deck-modal-title truncate">Executive brief</p>
                </div>
                <button
                  type="button"
                  onClick={closeMaximized}
                  className="briefing-deck-max-btn briefing-deck-max-btn--panel"
                  aria-label="Close full screen brief"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="briefing-deck-modal-body">
                <BriefingSlidesDeck
                  key={`expanded-${openIndexRef.current}`}
                  briefing={briefing}
                  glossaryEntries={glossaryEntries}
                  density="expanded"
                  initialSlideIndex={openIndexRef.current}
                  onSlideIndexChange={setSlideIndex}
                />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {maximized ? (
        <div className="briefing-reveal-shell briefing-reveal-shell--placeholder w-full" aria-hidden />
      ) : (
        <BriefingSlidesDeck
          key={`compact-${compactEpoch}`}
          briefing={briefing}
          glossaryEntries={glossaryEntries}
          density="compact"
          initialSlideIndex={slideIndex}
          onSlideIndexChange={setSlideIndex}
          toolbar={compactToolbar}
        />
      )}
      {modal}
    </>
  );
}
