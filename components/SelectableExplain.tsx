"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { AnnotatedText } from "@/components/AnnotatedText";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useFloatingViewportPosition } from "@/hooks/use-floating-viewport-position";
import { clampFloatingToViewport } from "@/lib/floating-viewport";
import {
  EXPLAIN_MAX_SELECTION_CHARS,
  EXPLAIN_MIN_SELECTION_CHARS,
} from "@/lib/board-constants";
import {
  explainCacheKey,
  getCachedExplanation,
  setCachedExplanation,
} from "@/lib/explain-cache";
import {
  explainHighlightsKey,
  getStoredExplainHighlights,
  mergeExplainHighlight,
  setStoredExplainHighlights,
  type ExplainHighlight,
} from "@/lib/explain-highlights";
import { selectionOffsetsInRoot } from "@/lib/selection-offsets";
import type { BriefingSection, ExplainRequest, GlossaryEntry } from "@/lib/schemas";

export type ExplainContextParams = {
  source: "transcript" | "briefing";
  userBrief: string;
  meetingGoal?: string;
  turnId?: number;
  section?: BriefingSection;
  sectionIndex?: number;
  transcriptSnippet?: string;
  briefingSnippet?: string;
};

type ToolbarState = {
  x: number;
  y: number;
};

type PopoverState =
  | { status: "loading"; selection: string }
  | { status: "ready"; selection: string; explanation: string }
  | { status: "error"; selection: string; message: string };

type Props = {
  text: string;
  glossaryEntries: GlossaryEntry[];
  context: ExplainContextParams;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  markdown?: boolean;
};

function selectionMeetsMin(text: string): boolean {
  const t = text.trim();
  if (t.length < EXPLAIN_MIN_SELECTION_CHARS) return false;
  const words = t.split(/\s+/).filter(Boolean);
  return words.length >= 2 || t.length >= EXPLAIN_MIN_SELECTION_CHARS;
}

function clampSelection(text: string): string {
  const t = text.trim();
  if (t.length <= EXPLAIN_MAX_SELECTION_CHARS) return t;
  return t.slice(0, EXPLAIN_MAX_SELECTION_CHARS);
}

export function SelectableExplain({
  text,
  glossaryEntries,
  children,
  context,
  disabled = false,
  className,
  markdown = false,
}: Props) {
  const selectableRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [pendingOffsets, setPendingOffsets] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [surrounding, setSurrounding] = useState("");
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<ToolbarState | null>(null);
  const [highlights, setHighlights] = useState<ExplainHighlight[]>([]);
  const [loadingHighlight, setLoadingHighlight] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const scopeKey = explainHighlightsKey({
    source: context.source,
    turnId: context.turnId,
    section: context.section,
    sectionIndex: context.sectionIndex,
  });

  useEffect(() => {
    setHighlights(getStoredExplainHighlights(scopeKey));
  }, [scopeKey]);

  const addHighlight = useCallback(
    (
      offsets: { start: number; end: number },
      selection: string,
      explanation: string,
    ) => {
      setHighlights((prev) => {
        const next = mergeExplainHighlight(prev, {
          start: offsets.start,
          end: offsets.end,
          selection,
          explanation,
        });
        setStoredExplainHighlights(scopeKey, next);
        return next;
      });
    },
    [scopeKey],
  );

  const dismissPopover = useCallback(() => {
    setToolbar(null);
    setPendingSelection(null);
    setPendingOffsets(null);
    setLoadingHighlight(null);
    setPopover(null);
    setPopoverAnchor(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissPopover();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissPopover]);

  useEffect(() => {
    if (!toolbar && !popover) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (toolbarRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-explain-highlight]")) {
        return;
      }
      dismissPopover();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [toolbar, popover, dismissPopover]);

  const buildRequest = useCallback(
    (selection: string, surroundingParagraph: string): ExplainRequest => ({
      selection: clampSelection(selection),
      surroundingParagraph: surroundingParagraph.slice(0, 2000) || undefined,
      source: context.source,
      turnId: context.turnId,
      section: context.section,
      sectionIndex: context.sectionIndex,
      userBrief: context.userBrief,
      meetingGoal: context.meetingGoal,
      transcriptSnippet: context.transcriptSnippet,
      briefingSnippet: context.briefingSnippet,
    }),
    [context],
  );

  const openPopoverAt = useCallback(
    (anchor: ToolbarState, selection: string, explanation: string) => {
      setToolbar(null);
      setPendingSelection(null);
      setPendingOffsets(null);
      setPopoverAnchor(anchor);
      setPopover({ status: "ready", selection, explanation });
    },
    [],
  );

  const runExplain = useCallback(
    async (
      selection: string,
      surroundingParagraph: string,
      anchor: ToolbarState,
      offsets: { start: number; end: number } | null,
    ) => {
      const trimmed = clampSelection(selection);
      if (!selectionMeetsMin(trimmed)) return;

      const resolvedOffsets =
        offsets ??
        (() => {
          const idx = text.indexOf(trimmed);
          return idx >= 0
            ? { start: idx, end: idx + trimmed.length }
            : null;
        })();

      setToolbar(null);
      setPendingSelection(trimmed);
      setPopoverAnchor(anchor);
      if (resolvedOffsets) {
        setLoadingHighlight(resolvedOffsets);
      } else {
        setLoadingHighlight(null);
      }

      const cacheKey = explainCacheKey({
        selection: trimmed,
        source: context.source,
        turnId: context.turnId,
        section: context.section,
        sectionIndex: context.sectionIndex,
      });
      const cached = getCachedExplanation(cacheKey);
      if (cached) {
        setLoadingHighlight(null);
        setPopover({ status: "ready", selection: trimmed, explanation: cached });
        if (resolvedOffsets) addHighlight(resolvedOffsets, trimmed, cached);
        return;
      }

      setPopover({ status: "loading", selection: trimmed });

      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildRequest(trimmed, surroundingParagraph)),
        });
        const data = (await res.json().catch(() => ({}))) as {
          explanation?: string;
          error?: string;
        };
        if (!res.ok) {
          setLoadingHighlight(null);
          setPopover({
            status: "error",
            selection: trimmed,
            message: data.error ?? `Request failed (${res.status})`,
          });
          return;
        }
        const explanation = data.explanation?.trim();
        if (!explanation) {
          setLoadingHighlight(null);
          setPopover({
            status: "error",
            selection: trimmed,
            message: "Empty explanation",
          });
          return;
        }
        setCachedExplanation(cacheKey, explanation);
        setLoadingHighlight(null);
        setPopover({ status: "ready", selection: trimmed, explanation });
        if (resolvedOffsets) addHighlight(resolvedOffsets, trimmed, explanation);
      } catch (e) {
        setLoadingHighlight(null);
        setPopover({
          status: "error",
          selection: trimmed,
          message: e instanceof Error ? e.message : "Network error",
        });
      }
    },
    [addHighlight, buildRequest, context, text],
  );

  const readSelection = useCallback(() => {
    const root = selectableRef.current;
    if (!root || disabled) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setToolbar(null);
      setPendingSelection(null);
      setPendingOffsets(null);
      return;
    }

    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) {
      setToolbar(null);
      return;
    }

    const text = sel.toString().trim();
    if (!selectionMeetsMin(text)) {
      setToolbar(null);
      return;
    }

    const offsets = selectionOffsetsInRoot(root, range);
    const rect = range.getBoundingClientRect();
    const anchor = {
      x: rect.left + rect.width / 2,
      y: Math.max(8, rect.top - 8),
    };
    setPendingSelection(clampSelection(text));
    setPendingOffsets(offsets);
    setSurrounding(root.textContent?.slice(0, 2000) ?? "");
    setPopover(null);
    setPopoverAnchor(null);
    setToolbar(anchor);
  }, [disabled]);

  const handleExplainClick = () => {
    if (!pendingSelection || !toolbar) return;
    void runExplain(pendingSelection, surrounding, toolbar, pendingOffsets);
  };

  const handleHighlightClick = useCallback(
    (highlight: ExplainHighlight, element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      openPopoverAt(
        {
          x: rect.left + rect.width / 2,
          y: Math.max(8, rect.top - 8),
        },
        highlight.selection,
        highlight.explanation,
      );
    },
    [openPopoverAt],
  );

  const anchor = toolbar ?? popoverAnchor;
  const showToolbar = Boolean(toolbar && !popover);
  const showPopover = Boolean(popover);

  const popoverContentKey =
    popover?.status === "ready"
      ? `ready-${popover.explanation.length}`
      : popover?.status === "error"
        ? `error-${popover.message.length}`
        : (popover?.status ?? "");

  const toolbarPos = useFloatingViewportPosition(
    anchor,
    "above",
    toolbarRef,
    showToolbar,
  );
  const popoverPos = useFloatingViewportPosition(
    anchor,
    "below",
    popoverRef,
    showPopover,
    popoverContentKey,
  );

  const toolbarFallback =
    anchor && !toolbarPos
      ? clampFloatingToViewport(anchor, { width: 72, height: 36 }, "above")
      : null;
  const popoverFallback =
    anchor && !popoverPos
      ? clampFloatingToViewport(
          anchor,
          {
            width: Math.min(
              352,
              typeof window !== "undefined" ? window.innerWidth - 24 : 352,
            ),
            height: 160,
          },
          "below",
          12,
        )
      : null;

  const overlay =
    mounted && (toolbar || popover) && anchor ? (
      <>
        {showToolbar ? (
          <div
            ref={toolbarRef}
            role="toolbar"
            aria-label="Selection actions"
            className="fixed z-50"
            style={{
              left: toolbarPos?.left ?? toolbarFallback?.left ?? anchor.x,
              top: toolbarPos?.top ?? toolbarFallback?.top ?? anchor.y,
            }}
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleExplainClick}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-lg hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Explain
            </button>
          </div>
        ) : null}

        {showPopover && popover ? (
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label="Explanation"
            className="fixed z-50 max-h-[min(24rem,70vh)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-xl dark:border-zinc-600 dark:bg-zinc-900"
            style={{
              left: popoverPos?.left ?? popoverFallback?.left ?? anchor.x,
              top: popoverPos?.top ?? popoverFallback?.top ?? anchor.y + 12,
            }}
          >
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Explaining
            </p>
            <p className="mb-2 line-clamp-2 text-xs italic text-zinc-600 dark:text-zinc-400">
              &ldquo;{popover.selection.slice(0, 120)}
              {popover.selection.length > 120 ? "\u2026" : ""}&rdquo;
            </p>
            {popover.status === "loading" ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
            ) : null}
            {popover.status === "ready" ? (
              <p className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                {popover.explanation}
              </p>
            ) : null}
            {popover.status === "error" ? (
              <p className="text-xs text-red-700 dark:text-red-300">
                {popover.message}
              </p>
            ) : null}
            <button
              type="button"
              onClick={dismissPopover}
              className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </>
    ) : null;

  const annotatedRenderer = useCallback(
    (chunk: string) => (
      <AnnotatedText
        text={chunk}
        entries={glossaryEntries}
        highlights={highlights}
        pendingHighlight={loadingHighlight}
        onExplainHighlightClick={handleHighlightClick}
      />
    ),
    [glossaryEntries, highlights, loadingHighlight, handleHighlightClick],
  );

  const body = markdown ? (
    <MarkdownContent
      text={text}
      glossaryEntries={glossaryEntries}
      renderText={annotatedRenderer}
    />
  ) : (
    <AnnotatedText
      text={text}
      entries={glossaryEntries}
      highlights={highlights}
      pendingHighlight={loadingHighlight}
      onExplainHighlightClick={handleHighlightClick}
    />
  );

  return (
    <>
      <div className={className}>
        <div
          ref={selectableRef}
          onMouseUp={readSelection}
          onKeyUp={readSelection}
        >
          {body}
        </div>
        {children}
      </div>
      {overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
