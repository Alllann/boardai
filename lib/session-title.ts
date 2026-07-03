/** Stored title cap — sidebar truncates visually; tooltip shows full string. */
const TITLE_MAX = 80;

export const PLACEHOLDER_SESSION_TITLE = "New board session";

const TRAILING_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "to",
  "for",
  "with",
  "on",
  "in",
  "at",
  "by",
  "whether",
  "if",
  "of",
  "as",
  "from",
  "into",
  "that",
  "this",
  "we",
  "our",
  "your",
  "their",
  "its",
]);

const FILLER_PREFIX =
  /^(hi[,!]?\s+|hey[,!]?\s+|please\s+|can you\s+|help me\s+|i need help with\s+|i want to know\s+|should i\s+|should we\s+|we're thinking about\s+|i'm thinking about\s+)/i;

function trimTrailingStopWords(words: string[]): string[] {
  const result = [...words];
  while (
    result.length > 1 &&
    TRAILING_STOP_WORDS.has(result[result.length - 1]!.toLowerCase().replace(/[^a-z]/g, ""))
  ) {
    result.pop();
  }
  return result;
}

function truncateAtWordBoundary(text: string, max: number): string {
  if (text.length <= max) return text;
  const words = text.split(/\s+/).filter(Boolean);
  let kept: string[] = [];
  for (const word of words) {
    const next = [...kept, word].join(" ");
    if (next.length > max) break;
    kept.push(word);
  }
  kept = trimTrailingStopWords(kept);
  if (kept.length === 0) {
    return `${text.slice(0, max - 1).trimEnd()}…`;
  }
  const result = kept.join(" ");
  return result.length < text.length ? `${result}…` : result;
}

/** Best-effort short label from the owner's brief (no LLM). */
export function deriveSessionTitle(brief: string): string {
  const trimmed = brief.trim();
  if (!trimmed) return PLACEHOLDER_SESSION_TITLE;

  const line = trimmed.split(/\n/).map((l) => l.trim()).find(Boolean) ?? trimmed;
  let text = line.replace(FILLER_PREFIX, "").trim();
  if (!text) text = line;

  const sentence = text.match(/^[^.!?\n]+[.!?]?/)?.[0]?.trim() ?? text;
  const words = sentence.replace(/[.!?]+$/, "").split(/\s+/).filter(Boolean);
  const short = trimTrailingStopWords(words.slice(0, 8)).join(" ");
  const titled = short.charAt(0).toUpperCase() + short.slice(1);

  return truncateAtWordBoundary(titled, TITLE_MAX);
}

export function normalizeSessionTitle(title: string): string {
  const t = title.trim().replace(/\s+/g, " ");
  if (!t) return PLACEHOLDER_SESSION_TITLE;
  return truncateAtWordBoundary(t, TITLE_MAX);
}

/** Titles that end mid-thought (often from old meeting-goal fallbacks). */
export function isTruncatedSentenceFragment(title: string): boolean {
  const t = title.trim();
  if (!t || t.endsWith("…")) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const last = words[words.length - 1]!.toLowerCase().replace(/[^a-z]/g, "");
  if (TRAILING_STOP_WORDS.has(last)) return true;
  // Sentence-style openers belong in the body, not the sidebar label.
  if (/^(determine|decide|evaluate|assess|analyze|review|explore|discuss)\b/i.test(t)) {
    return words.length > 5;
  }
  return false;
}

export function isBriefDerivedTitle(title: string, brief: string): boolean {
  const normalized = normalizeSessionTitle(title);
  if (normalized === PLACEHOLDER_SESSION_TITLE) return true;
  const derived = deriveSessionTitle(brief);
  if (normalized === derived) return true;
  const trimmedBrief = brief.trim();
  return (
    normalized === trimmedBrief ||
    trimmedBrief.startsWith(normalized.replace(/…$/, ""))
  );
}

/** Sidebar label comes from the chair's sessionTitle only — never a chopped meeting goal. */
export function resolveSessionTitle(
  _brief: string,
  source?: { sessionTitle?: string } | null,
): string {
  const sessionTitle = source?.sessionTitle?.trim();
  if (sessionTitle) return normalizeSessionTitle(sessionTitle);
  return PLACEHOLDER_SESSION_TITLE;
}
