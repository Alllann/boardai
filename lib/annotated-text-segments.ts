import type { ExplainHighlight } from "@/lib/explain-highlights";
import { buildGlossarySegments, type TextSegment } from "@/lib/glossary-segments";
import type { GlossaryEntry } from "@/lib/schemas";

export type AnnotatedSegment =
  | TextSegment
  | {
      kind: "explain-pending";
      text: string;
    }
  | {
      kind: "explain";
      id: string;
      text: string;
      explanation: string;
    };

export type TextRange = { start: number; end: number };

function overlaps(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return !(a.end <= b.start || a.start >= b.end);
}

/**
 * Glossary terms in plain regions, with explain highlights taking precedence.
 */
function mergeRanges(
  textLength: number,
  highlights: ExplainHighlight[],
  pending?: TextRange | null,
): Array<
  | { kind: "explain"; highlight: ExplainHighlight }
  | { kind: "explain-pending"; range: TextRange }
> {
  const validHighlights = highlights
    .filter((h) => h.start >= 0 && h.end <= textLength && h.end > h.start)
    .sort((a, b) => a.start - b.start);

  const nonOverlapping: ExplainHighlight[] = [];
  for (const h of validHighlights) {
    if (nonOverlapping.some((p) => overlaps(p, h))) continue;
    nonOverlapping.push(h);
  }

  const merged: Array<
    | { kind: "explain"; highlight: ExplainHighlight }
    | { kind: "explain-pending"; range: TextRange }
  > = nonOverlapping.map((highlight) => ({ kind: "explain", highlight }));

  if (
    pending &&
    pending.start >= 0 &&
    pending.end <= textLength &&
    pending.end > pending.start &&
    !nonOverlapping.some((h) => overlaps(h, pending))
  ) {
    merged.push({ kind: "explain-pending", range: pending });
    merged.sort((a, b) => {
      const startA = a.kind === "explain" ? a.highlight.start : a.range.start;
      const startB = b.kind === "explain" ? b.highlight.start : b.range.start;
      return startA - startB;
    });
  }

  return merged;
}

export function buildAnnotatedSegments(
  text: string,
  entries: GlossaryEntry[],
  highlights: ExplainHighlight[],
  pendingHighlight?: TextRange | null,
): AnnotatedSegment[] {
  if (!text) return [];

  const merged = mergeRanges(text.length, highlights, pendingHighlight);

  if (merged.length === 0) {
    return buildGlossarySegments(text, entries);
  }

  const out: AnnotatedSegment[] = [];
  let cursor = 0;

  for (const item of merged) {
    if (item.kind === "explain") {
      const h = item.highlight;
      if (h.start > cursor) {
        out.push(...buildGlossarySegments(text.slice(cursor, h.start), entries));
      }
      out.push({
        kind: "explain",
        id: h.id,
        text: text.slice(h.start, h.end),
        explanation: h.explanation,
      });
      cursor = h.end;
      continue;
    }

    const { range } = item;
    if (range.start > cursor) {
      out.push(...buildGlossarySegments(text.slice(cursor, range.start), entries));
    }
    out.push({
      kind: "explain-pending",
      text: text.slice(range.start, range.end),
    });
    cursor = range.end;
  }

  if (cursor < text.length) {
    out.push(...buildGlossarySegments(text.slice(cursor), entries));
  }

  return out.length > 0 ? out : [{ kind: "plain", text }];
}
