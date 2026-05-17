import type { ExplainHighlight } from "@/lib/explain-highlights";
import { buildGlossarySegments, type TextSegment } from "@/lib/glossary-segments";
import type { GlossaryEntry } from "@/lib/schemas";

export type AnnotatedSegment =
  | TextSegment
  | {
      kind: "explain";
      id: string;
      text: string;
      explanation: string;
    };

function overlaps(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return !(a.end <= b.start || a.start >= b.end);
}

/**
 * Glossary terms in plain regions, with explain highlights taking precedence.
 */
export function buildAnnotatedSegments(
  text: string,
  entries: GlossaryEntry[],
  highlights: ExplainHighlight[],
): AnnotatedSegment[] {
  if (!text) return [];

  const validHighlights = highlights
    .filter((h) => h.start >= 0 && h.end <= text.length && h.end > h.start)
    .sort((a, b) => a.start - b.start);

  const nonOverlappingHighlights: ExplainHighlight[] = [];
  for (const h of validHighlights) {
    if (nonOverlappingHighlights.some((p) => overlaps(p, h))) continue;
    nonOverlappingHighlights.push(h);
  }

  if (nonOverlappingHighlights.length === 0) {
    return buildGlossarySegments(text, entries);
  }

  const out: AnnotatedSegment[] = [];
  let cursor = 0;

  for (const h of nonOverlappingHighlights) {
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
  }

  if (cursor < text.length) {
    out.push(...buildGlossarySegments(text.slice(cursor), entries));
  }

  return out.length > 0 ? out : [{ kind: "plain", text }];
}
