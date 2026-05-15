import type { GlossaryEntry } from "./schemas";

export type TextSegment =
  | { kind: "plain"; text: string }
  | {
      kind: "term";
      text: string;
      explanation: string;
      phrase: string;
    };

const wordChar = /[A-Za-z0-9_]/;

function isWordChar(ch: string): boolean {
  return wordChar.test(ch);
}

/** Collect candidate spans for one match string (case-insensitive, word-bounded). */
function spansForMatch(
  text: string,
  entry: GlossaryEntry,
): Array<{
  start: number;
  end: number;
  explanation: string;
  phrase: string;
}> {
  const m = entry.match;
  if (!m.trim()) return [];
  const lower = text.toLowerCase();
  const needle = m.toLowerCase();
  const out: Array<{
    start: number;
    end: number;
    explanation: string;
    phrase: string;
  }> = [];
  let from = 0;
  while (from < text.length) {
    const idx = lower.indexOf(needle, from);
    if (idx === -1) break;
    const end = idx + needle.length;
    const before = idx === 0 ? "" : text[idx - 1]!;
    const afterCh = end >= text.length ? "" : text[end]!;
    const okBefore = idx === 0 || !isWordChar(before);
    const okAfter = end === text.length || !isWordChar(afterCh);
    if (okBefore && okAfter) {
      out.push({
        start: idx,
        end,
        explanation: entry.explanation,
        phrase: entry.phrase,
      });
    }
    from = idx + 1;
  }
  return out;
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return !(a.end <= b.start || a.start >= b.end);
}

/**
 * Split text into plain + glossary spans. Longest `match` wins first; then
 * non-overlapping packing in document order.
 */
export function buildGlossarySegments(
  text: string,
  entries: GlossaryEntry[],
): TextSegment[] {
  if (!text) {
    return [];
  }
  if (entries.length === 0) {
    return [{ kind: "plain", text }];
  }

  const sortedEntries = [...entries].sort((a, b) => b.match.length - a.match.length);

  type Span = {
    start: number;
    end: number;
    explanation: string;
    phrase: string;
  };
  const candidates: Span[] = [];
  for (const e of sortedEntries) {
    candidates.push(...spansForMatch(text, e));
  }

  candidates.sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start),
  );

  const picked: Span[] = [];
  for (const s of candidates) {
    if (picked.some((p) => overlaps(p, s))) continue;
    picked.push(s);
  }
  picked.sort((a, b) => a.start - b.start);

  const out: TextSegment[] = [];
  let cursor = 0;
  for (const s of picked) {
    if (s.start > cursor) {
      out.push({ kind: "plain", text: text.slice(cursor, s.start) });
    }
    out.push({
      kind: "term",
      text: text.slice(s.start, s.end),
      explanation: s.explanation,
      phrase: s.phrase,
    });
    cursor = s.end;
  }
  if (cursor < text.length) {
    out.push({ kind: "plain", text: text.slice(cursor) });
  }
  return out.length > 0 ? out : [{ kind: "plain", text }];
}
