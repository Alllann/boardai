"use client";

import { useId, useMemo, useState } from "react";

import {
  buildAnnotatedSegments,
  type TextRange,
} from "@/lib/annotated-text-segments";
import type { ExplainHighlight } from "@/lib/explain-highlights";
import type { GlossaryEntry } from "@/lib/schemas";

type Props = {
  text: string;
  entries: GlossaryEntry[];
  highlights: ExplainHighlight[];
  pendingHighlight?: TextRange | null;
  textOffset?: number;
  onExplainHighlightClick?: (highlight: ExplainHighlight, element: HTMLElement) => void;
  className?: string;
};

function shiftHighlights(
  highlights: ExplainHighlight[],
  pendingHighlight: TextRange | null | undefined,
  textOffset: number,
  textLength: number,
): { highlights: ExplainHighlight[]; pendingHighlight: TextRange | null } {
  const chunkStart = textOffset;
  const chunkEnd = textOffset + textLength;

  const localHighlights = highlights
    .filter((h) => h.end > chunkStart && h.start < chunkEnd)
    .map((h) => ({
      ...h,
      start: Math.max(0, h.start - chunkStart),
      end: Math.min(textLength, h.end - chunkStart),
    }));

  let localPending: TextRange | null = null;
  if (
    pendingHighlight &&
    pendingHighlight.end > chunkStart &&
    pendingHighlight.start < chunkEnd
  ) {
    localPending = {
      start: Math.max(0, pendingHighlight.start - chunkStart),
      end: Math.min(textLength, pendingHighlight.end - chunkStart),
    };
  }

  return { highlights: localHighlights, pendingHighlight: localPending };
}

export function AnnotatedText({
  text,
  entries,
  highlights,
  pendingHighlight,
  textOffset = 0,
  onExplainHighlightClick,
  className,
}: Props) {
  const baseId = useId();
  const { highlights: localHighlights, pendingHighlight: localPending } = useMemo(
    () => shiftHighlights(highlights, pendingHighlight, textOffset, text.length),
    [highlights, pendingHighlight, textOffset, text.length],
  );
  const segments = useMemo(
    () => buildAnnotatedSegments(text, entries, localHighlights, localPending),
    [text, entries, localHighlights, localPending],
  );
  const [openGlossaryKey, setOpenGlossaryKey] = useState<string | null>(null);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.kind === "plain") {
          return <span key={`p-${i}`}>{seg.text}</span>;
        }

        if (seg.kind === "explain-pending") {
          return (
            <mark
              key={`ep-${i}`}
              className="explain-pending-glow rounded-sm bg-zinc-300/70 px-0.5 text-inherit ring-1 ring-zinc-400/60 dark:bg-zinc-600/50 dark:ring-zinc-500/50"
            >
              {seg.text}
            </mark>
          );
        }

        if (seg.kind === "explain") {
          return (
            <mark
              key={`e-${seg.id}`}
              data-explain-highlight={seg.id}
              className="cursor-pointer rounded-sm bg-amber-200/80 px-0.5 text-inherit underline decoration-amber-600/50 decoration-2 underline-offset-2 hover:bg-amber-300/90 dark:bg-amber-500/25 dark:decoration-amber-400/60 dark:hover:bg-amber-500/40"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                const h = highlights.find((x) => x.id === seg.id);
                if (h && e.currentTarget instanceof HTMLElement) {
                  onExplainHighlightClick?.(h, e.currentTarget);
                }
              }}
            >
              {seg.text}
            </mark>
          );
        }

        const key = `${baseId}-term-${i}`;
        const isOpen = openGlossaryKey === key;
        return (
          <span key={`${baseId}-wrap-${i}`} className="relative inline">
            <span
              role="button"
              tabIndex={0}
              aria-describedby={isOpen ? `${key}-tip` : undefined}
              className="cursor-help border-b border-dotted border-zinc-500 text-inherit decoration-zinc-500 underline-offset-2 outline-none hover:border-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-400 dark:hover:border-zinc-300"
              onMouseEnter={() => setOpenGlossaryKey(key)}
              onMouseLeave={() => setOpenGlossaryKey((k) => (k === key ? null : k))}
              onFocus={() => setOpenGlossaryKey(key)}
              onBlur={() => setOpenGlossaryKey((k) => (k === key ? null : k))}
            >
              {seg.text}
            </span>
            {isOpen ? (
              <span
                id={`${key}-tip`}
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-normal leading-snug text-zinc-800 shadow-lg dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <span className="mb-0.5 block font-semibold text-zinc-600 dark:text-zinc-300">
                  {seg.phrase}
                </span>
                {seg.explanation}
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
