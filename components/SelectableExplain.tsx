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

import {
  EXPLAIN_MAX_SELECTION_CHARS,
  EXPLAIN_MIN_SELECTION_CHARS,
} from "@/lib/board-constants";
import {
  explainCacheKey,
  getCachedExplanation,
  setCachedExplanation,
} from "@/lib/explain-cache";
import type { BriefingSection, ExplainRequest } from "@/lib/schemas";

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
  children: ReactNode;
  context: ExplainContextParams;
  blockText?: string;
  showBlockExplain?: boolean;
  disabled?: boolean;
  className?: string;
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
  children,
  context,
  blockText,
  showBlockExplain = false,
  disabled = false,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [surrounding, setSurrounding] = useState("");
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<ToolbarState | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const dismiss = useCallback(() => {
    setToolbar(null);
    setPendingSelection(null);
    setPopover(null);
    setPopoverAnchor(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  useEffect(() => {
    if (!toolbar && !popover) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (toolbarRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      dismiss();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [toolbar, popover, dismiss]);

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

  const runExplain = useCallback(
    async (selection: string, surroundingParagraph: string, anchor: ToolbarState) => {
      const trimmed = clampSelection(selection);
      if (!selectionMeetsMin(trimmed)) return;

      setToolbar(null);
      setPendingSelection(trimmed);
      setPopoverAnchor(anchor);

      const cacheKey = explainCacheKey({
        selection: trimmed,
        source: context.source,
        turnId: context.turnId,
        section: context.section,
        sectionIndex: context.sectionIndex,
      });
      const cached = getCachedExplanation(cacheKey);
      if (cached) {
        setPopover({ status: "ready", selection: trimmed, explanation: cached });
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
          setPopover({
            status: "error",
            selection: trimmed,
            message: data.error ?? `Request failed (${res.status})`,
          });
          return;
        }
        const explanation = data.explanation?.trim();
        if (!explanation) {
          setPopover({
            status: "error",
            selection: trimmed,
            message: "Empty explanation",
          });
          return;
        }
        setCachedExplanation(cacheKey, explanation);
        setPopover({ status: "ready", selection: trimmed, explanation });
      } catch (e) {
        setPopover({
          status: "error",
          selection: trimmed,
          message: e instanceof Error ? e.message : "Network error",
        });
      }
    },
    [buildRequest, context],
  );

  const readSelection = useCallback(() => {
    const root = containerRef.current;
    if (!root || disabled) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setToolbar(null);
      setPendingSelection(null);
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

    const rect = range.getBoundingClientRect();
    const anchor = {
      x: rect.left + rect.width / 2,
      y: Math.max(8, rect.top - 8),
    };
    setPendingSelection(clampSelection(text));
    setSurrounding(root.textContent?.slice(0, 2000) ?? "");
    setPopover(null);
    setPopoverAnchor(null);
    setToolbar(anchor);
  }, [disabled]);

  const handleExplainClick = () => {
    if (!pendingSelection || !toolbar) return;
    void runExplain(pendingSelection, surrounding, toolbar);
  };

  const handleBlockExplain = () => {
    if (!blockText?.trim() || disabled) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const anchor = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + 8 }
      : { x: window.innerWidth / 2, y: 80 };
    void runExplain(blockText, blockText, anchor);
  };

  const anchor = toolbar ?? popoverAnchor;

  const overlay =
    mounted && (toolbar || popover) && anchor ? (
      <>
        {toolbar && !popover ? (
          <div
            ref={toolbarRef}
            role="toolbar"
            aria-label="Selection actions"
            className="fixed z-50 -translate-x-1/2 -translate-y-full"
            style={{ left: anchor.x, top: anchor.y }}
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

        {popover ? (
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label="Explanation"
            className="fixed z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-xl dark:border-zinc-600 dark:bg-zinc-900"
            style={{ left: anchor.x, top: anchor.y + 12 }}
          >
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Explaining
            </p>
            <p className="mb-2 line-clamp-2 text-xs italic text-zinc-600 dark:text-zinc-400">
              &ldquo;{popover.selection.slice(0, 120)}
              {popover.selection.length > 120 ? "…" : ""}&rdquo;
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
              onClick={dismiss}
              className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </>
    ) : null;

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        onMouseUp={readSelection}
        onKeyUp={readSelection}
      >
        {showBlockExplain && blockText ? (
          <div className="mb-1 flex justify-end">
            <button
              type="button"
              disabled={disabled}
              onClick={handleBlockExplain}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Explain this
            </button>
          </div>
        ) : null}
        {children}
      </div>
      {overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
