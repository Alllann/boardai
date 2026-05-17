import { MAX_ON_DEMAND_EXPLAIN_CHARS } from "./board-constants";
import type { ExplainRequest } from "./schemas";

/** Stricter than schema — aligns with small Explain popover (~22rem, text-xs). */
export const EXPLAIN_EVAL_POPOVER_MAX_CHARS = 350;
export const EXPLAIN_EVAL_MAX_SENTENCES = 4;
export const EXPLAIN_EVAL_MAX_AVG_WORDS_PER_SENTENCE = 22;
export const EXPLAIN_EVAL_MAX_TOTAL_WORDS = 120;
export const EXPLAIN_EVAL_MIN_QUOTE_WORD_LEN = 5;

export type ExplainEvalCheckViolation = {
  code: string;
  message: string;
};

export type ExplainEvalCheckResult = {
  pass: boolean;
  violations: ExplainEvalCheckViolation[];
};

function splitSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text.trim()].filter(Boolean);
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function significantSelectionWords(selection: string): string[] {
  return selection
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length >= EXPLAIN_EVAL_MIN_QUOTE_WORD_LEN);
}

function hasMarkdownHeadings(text: string): boolean {
  return /^(#{1,6})\s/m.test(text);
}

function looksLikeJsonWrapper(text: string): boolean {
  const t = text.trim();
  if (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  ) {
    return true;
  }
  return /^```/m.test(t);
}

function quoteOverlapViolations(
  selection: string,
  explanation: string,
): ExplainEvalCheckViolation[] {
  const words = significantSelectionWords(selection);
  if (words.length === 0) return [];

  const lowerExplanation = explanation.toLowerCase();
  const quoted = words.filter((w) => {
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return re.test(lowerExplanation);
  });

  if (quoted.length === 0) return [];

  const ratio = quoted.length / words.length;
  if (ratio < 0.35) return [];

  return [
    {
      code: "quote_overlap",
      message: `Explanation repeats ${quoted.length}/${words.length} significant selection words (${quoted.slice(0, 4).join(", ")}${quoted.length > 4 ? ", …" : ""})`,
    },
  ];
}

export function runExplainEvalChecks(
  request: ExplainRequest,
  explanation: string,
): ExplainEvalCheckResult {
  const violations: ExplainEvalCheckViolation[] = [];
  const text = explanation.trim();

  if (text.length > MAX_ON_DEMAND_EXPLAIN_CHARS) {
    violations.push({
      code: "max_chars_schema",
      message: `Explanation exceeds ${MAX_ON_DEMAND_EXPLAIN_CHARS} characters (${text.length})`,
    });
  }

  if (text.length > EXPLAIN_EVAL_POPOVER_MAX_CHARS) {
    violations.push({
      code: "popover_max_chars",
      message: `Explanation exceeds popover budget of ${EXPLAIN_EVAL_POPOVER_MAX_CHARS} characters (${text.length})`,
    });
  }

  const sentences = splitSentences(text);
  if (sentences.length > EXPLAIN_EVAL_MAX_SENTENCES) {
    violations.push({
      code: "max_sentences",
      message: `Explanation has ${sentences.length} sentences (max ${EXPLAIN_EVAL_MAX_SENTENCES})`,
    });
  }

  const totalWords = wordCount(text);
  if (totalWords > EXPLAIN_EVAL_MAX_TOTAL_WORDS) {
    violations.push({
      code: "max_words",
      message: `Explanation has ${totalWords} words (max ${EXPLAIN_EVAL_MAX_TOTAL_WORDS})`,
    });
  }

  if (sentences.length > 0) {
    const avgWords =
      sentences.reduce((sum, s) => sum + wordCount(s), 0) / sentences.length;
    if (avgWords > EXPLAIN_EVAL_MAX_AVG_WORDS_PER_SENTENCE) {
      violations.push({
        code: "avg_sentence_length",
        message: `Average sentence length is ${avgWords.toFixed(1)} words (max ${EXPLAIN_EVAL_MAX_AVG_WORDS_PER_SENTENCE})`,
      });
    }
  }

  if (hasMarkdownHeadings(text)) {
    violations.push({
      code: "markdown_headings",
      message: "Explanation contains markdown headings",
    });
  }

  if (looksLikeJsonWrapper(text)) {
    violations.push({
      code: "json_wrapper",
      message: "Explanation looks like JSON or fenced code",
    });
  }

  violations.push(...quoteOverlapViolations(request.selection, text));

  return {
    pass: violations.length === 0,
    violations,
  };
}
